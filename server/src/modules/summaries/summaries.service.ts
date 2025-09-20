import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interval } from '@nestjs/schedule';
import { Summary } from 'src/schemas/summarys.schema';
import { Embedding } from 'src/schemas/embeddings.schema';
import { Action } from 'src/schemas/action.schema';
import { SummariesConfig } from './config/summaries.config';
import { AiService } from './services/ai.service';
import { MessageProcessorService } from './services/message-processor.service';
import { TriggerSummarizationDto } from './dto/trigger-summary.dto';
import { SaveSummaryDto } from './dto/save-summary.dto';
import {
  ProcessingResult,
  RagContext,
} from './interfaces/summaries.interfaces';

@Injectable()
export class SummariesService {
  private readonly logger = new Logger(SummariesService.name);

  constructor(
    @InjectModel(Summary.name) private summaryModel: Model<Summary>,
    @InjectModel(Embedding.name) private embeddingModel: Model<Embedding>,
    @InjectModel(Action.name) private actionModel: Model<Action>,
    private readonly aiService: AiService,
    private readonly messageProcessor: MessageProcessorService,
  ) {}

  @Interval(SummariesConfig.SCHEDULER_INTERVAL)
  async scheduledCheck(): Promise<void> {
    try {
      this.logger.log('Starting scheduled summary check...');
      await this.processFirstPendingConversation();
    } catch (error) {
      this.logger.error('Scheduled check failed', error);
    }
  }

  async triggerSummarization(
    dto: TriggerSummarizationDto,
  ): Promise<ProcessingResult> {
    this.logger.log(`Manual trigger for conversation: ${dto.conversationId}`);
    return this.processConversation(dto.conversationId, dto.provider);
  }

  async saveSummary(dto: SaveSummaryDto): Promise<Summary> {
    try {
      return await this.summaryModel.create({ ...dto, status: 'done' });
    } catch (error: any) {
      this.logger.error('Failed to save summary', error);
      throw new Error(`Failed to save summary: ${error.message}`);
    }
  }

  private async processFirstPendingConversation(): Promise<void> {
    const channelsNeedingProcessing =
      await this.messageProcessor.getChannelsNeedingProcessing();
    if (channelsNeedingProcessing.length === 0) {
      this.logger.log('No conversations need processing');
      return;
    }
    const firstChannel = channelsNeedingProcessing[0];
    this.logger.log(`Processing channel: ${firstChannel.channel}`);
    await this.processConversation(firstChannel.channel, firstChannel.provider);
    this.logger.log(`Processed channel ${firstChannel.channel}`);
  }

  private async processConversation(
    conversationId: string,
    provider: string,
  ): Promise<ProcessingResult> {
    try {
      const lastSummary = await this.getLastSummary(conversationId, provider);
      const enrichedMessages = await this.messageProcessor.getEnrichedMessages(
        conversationId,
        provider,
        lastSummary?.lastMessageTs,
      );
      if (enrichedMessages.length === 0) {
        return { status: 'no new messages' };
      }
      const ragContext = await this.getRagContext(
        conversationId,
        enrichedMessages,
      );
      // Get current user ID for action assignment tracking
      const currentUserId = await this.getCurrentUserId(provider);

      const generatedSummary = await this.aiService.generateSummaryAndActions(
        lastSummary?.summaryText || null,
        ragContext,
        enrichedMessages,
        currentUserId,
      );
      const savedSummary = await this.saveSummaryToDatabase(
        conversationId,
        provider,
        generatedSummary.summary,
        enrichedMessages,
      );

      // Save extracted actions to actions collection
      const summaryId =
        savedSummary._id?.toString() || savedSummary.id?.toString() || '';
      await this.saveActionsToDatabase(
        conversationId,
        provider,
        generatedSummary.actions,
        summaryId,
        currentUserId,
      );

      await this.messageProcessor.markMessagesAsSummarized(
        enrichedMessages.map((msg) => msg.id),
      );
      return { status: 'success', summary: savedSummary };
    } catch (error: any) {
      this.logger.error(
        `Failed to process conversation ${conversationId}`,
        error,
      );
      return { status: 'failed', error: error.message };
    }
  }

  private async getLastSummary(conversationId: string, provider: string) {
    return this.summaryModel
      .findOne({ conversationId, provider, status: 'done' })
      .sort({ createdAt: -1 })
      .lean();
  }

  private async getRagContext(
    conversationId: string,
    newMessages: any[],
  ): Promise<RagContext[]> {
    try {
      const embeddings = await this.embeddingModel
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(SummariesConfig.DEFAULT_RAG_TOP_K)
        .lean();
      return embeddings.map((embedding) => ({ text: embedding.text }));
    } catch (error) {
      return [];
    }
  }

  private async saveSummaryToDatabase(
    conversationId: string,
    provider: string,
    summaryText: string,
    messages: any[],
  ): Promise<Summary> {
    const summary = await this.summaryModel.create({
      conversationId,
      provider,
      summaryText,
      messageIds: messages.map((msg) => msg.id),
      lastMessageTs: messages[messages.length - 1].ts,
      status: 'done',
    });
    return summary;
  }

  /**
   * Saves extracted actions to the actions collection
   */
  private async saveActionsToDatabase(
    conversationId: string,
    provider: string,
    actions: any[],
    summaryId: string,
    currentUserId?: string,
  ): Promise<void> {
    if (!actions || actions.length === 0) {
      this.logger.debug('No actions to save');
      return;
    }

    try {
      const actionDocuments = actions.map((action) => ({
        title: action.title,
        description: action.description,
        type: action.type || 'other',
        importance: action.importance || 'medium',
        assignees: action.assignees || [],
        due_date: action.due_date ? new Date(action.due_date) : undefined,
        status: action.status || 'pending',
        tags: action.tags || [],
        context: action.context,
        isAssignedToMe: action.isAssignedToMe || false,
        createdFromMessage: action.createdFromMessage,
        conversationId,
        provider,
        summaryId,
      }));

      await this.actionModel.insertMany(actionDocuments);
      this.logger.log(
        `Saved ${actions.length} actions for conversation ${conversationId}`,
      );
    } catch (error) {
      this.logger.error('Failed to save actions to database', error);
      // Don't throw - we don't want to fail the entire summary process if action saving fails
    }
  }

  /**
   * Gets the latest summary for a specific conversation
   */
  async getLatestSummary(conversationId: string, provider: string = 'slack') {
    const summary = await this.summaryModel
      .findOne({ conversationId, provider, status: 'done' })
      .sort({ createdAt: -1 })
      .lean();

    if (!summary) {
      throw new Error(`No summary found for conversation ${conversationId}`);
    }

    return summary;
  }

  /**
   * Gets all actions for a specific conversation with optional filters
   */
  async getConversationActions(
    conversationId: string,
    provider: string = 'slack',
    filters: any = {},
  ) {
    const query = {
      conversationId,
      provider,
      ...filters,
    };

    const actions = await this.actionModel
      .find(query)
      .sort({ createdAt: -1, importance: 1 }) // Latest first, urgent first
      .lean();

    return actions;
  }

  /**
   * Gets conversation overview with summary and actions
   */
  async getConversationOverview(
    conversationId: string,
    provider: string = 'slack',
  ) {
    try {
      // Get latest summary
      const summary = await this.summaryModel
        .findOne({ conversationId, provider, status: 'done' })
        .sort({ createdAt: -1 })
        .lean();

      // Get all actions for this conversation
      const actions = await this.actionModel
        .find({ conversationId, provider })
        .sort({ createdAt: -1, importance: 1 })
        .lean();

      // Calculate action statistics
      const actionStats = {
        total: actions.length,
        pending: actions.filter((a) => a.status === 'pending').length,
        urgent: actions.filter((a) => a.importance === 'urgent').length,
        assignedToMe: actions.filter((a) => a.isAssignedToMe === true).length,
      };

      return {
        summary: summary || null,
        actions,
        actionStats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get conversation overview for ${conversationId}`,
        error,
      );
      throw new Error('Failed to retrieve conversation overview');
    }
  }

  /**
   * Gets the current authenticated user ID for the integration
   */
  private async getCurrentUserId(
    provider: string,
  ): Promise<string | undefined> {
    try {
      return await this.messageProcessor.getCurrentUserId(provider);
    } catch (error) {
      this.logger.warn('Could not get current user ID', error);
      return undefined;
    }
  }
}
