import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../../../schemas/messages.schema';
import { Summary } from '../../../schemas/summarys.schema';
import { Action } from '../../../schemas/action.schema';
import { Embedding } from '../../../schemas/embeddings.schema';
import { AiService } from '../../summaries/services/ai.service';
import { ASSISTANT_CONFIG } from '../config/assistant.config';

export interface SearchResult {
  id: string;
  type: 'message' | 'summary' | 'action';
  content: string;
  relevance: number;
  metadata: any;
  timestamp: Date;
}

export interface SearchOptions {
  conversationId?: string;
  userId?: string;
  provider?: string;
  limit?: number;
  minRelevance?: number;
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  sourceTypes?: Array<'message' | 'summary' | 'action'>;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(Summary.name)
    private readonly summaryModel: Model<Summary>,
    @InjectModel(Action.name)
    private readonly actionModel: Model<Action>,
    @InjectModel(Embedding.name)
    private readonly embeddingModel: Model<Embedding>,
    private readonly aiService: AiService,
  ) {}

  async searchRelevantContent(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    try {
      this.logger.debug(`Searching for: "${query}"`, options as any);

      // Query embedding is used only for messages (your schema stores { messageId, embedding })
      const queryEmbedding = await this.aiService.generateEmbedding(query);
      if (!queryEmbedding) {
        this.logger.warn('Failed to generate query embedding');
        return [];
      }

      const [messageResults, summaryResults, actionResults] = await Promise.all(
        [
          this.searchMessages(queryEmbedding, query, options), // semantic + text fallback
          this.searchSummaries(query, options), // text-only
          this.searchActions(query, options), // text-only (+importance)
        ],
      );

      const allResults = [
        ...messageResults,
        ...summaryResults,
        ...actionResults,
      ];

      const weightedResults = allResults.map((r) => ({
        ...r,
        relevance: this.calculateWeightedRelevance(r),
      }));

      const minRel =
        options.minRelevance ?? ASSISTANT_CONFIG.MIN_RELEVANCE_SCORE;
      const maxResults = options.limit ?? ASSISTANT_CONFIG.MAX_SEARCH_RESULTS;

      return weightedResults
        .filter((r) => r.relevance >= minRel)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxResults);
    } catch (error) {
      this.logger.error('Error in vector search:', error);
      return [];
    }
  }

  // --------- Messages (embeddings available) ---------
  private async searchMessages(
    queryEmbedding: number[],
    query: string,
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    if (options.sourceTypes && !options.sourceTypes.includes('message')) {
      return [];
    }

    try {
      const messageQuery: any = {};
      if (options.conversationId) messageQuery.channel = options.conversationId;
      if (options.provider) messageQuery.provider = options.provider;

      if (options.timeRange?.start || options.timeRange?.end) {
        const timeFilter: any = {};
        if (options.timeRange.start) timeFilter.$gte = options.timeRange.start;
        if (options.timeRange.end) timeFilter.$lte = options.timeRange.end;
        messageQuery.createdAt = timeFilter;
      }

      if (query.trim()) {
        const regexPatterns: any[] = [
          { text: { $regex: query, $options: 'i' } },
        ];
        const queryWords = query.toLowerCase().split(/\s+/);
        for (const w of queryWords) {
          if (w.length > 2)
            regexPatterns.push({ text: { $regex: w, $options: 'i' } });
        }
        const hyphenatedTerms = query.match(/\b\w+[-]\w+\b/g) || [];
        for (const t of hyphenatedTerms) {
          regexPatterns.push({ text: { $regex: t, $options: 'i' } });
        }
        messageQuery.$or = regexPatterns;
      }

      const messages = await this.messageModel
        .find(messageQuery)
        .sort({ createdAt: -1 })
        .limit(50)
        .exec();

      const results: SearchResult[] = [];

      for (const message of messages) {
        let relevance = 0;

        // Find embedding by messageId
        const embeddingDoc = await this.embeddingModel
          .findOne({ messageId: message._id })
          .exec();

        if (embeddingDoc?.embedding?.length) {
          if (embeddingDoc.embedding.length === queryEmbedding.length) {
            relevance = this.cosineSimilarity(
              queryEmbedding,
              embeddingDoc.embedding,
            );
          } else {
            this.logger.warn(
              `Vector dim mismatch for msg ${message._id}: q=${queryEmbedding.length} doc=${embeddingDoc.embedding.length}`,
            );
          }
        }

        // Text relevance fallback (weighted lower)
        const textRel = this.calculateTextSimilarity(
          query,
          (message as any).text || '',
        );
        relevance = Math.max(relevance, textRel * 0.6);

        if (relevance >= ASSISTANT_CONFIG.MIN_RELEVANCE_SCORE) {
          const messageId = message._id as Types.ObjectId;
          results.push({
            id: messageId.toString(),
            type: 'message',
            content: (message as any).text || '',
            relevance,
            timestamp: (message as any).createdAt || messageId.getTimestamp(),
            metadata: {
              userId: (message as any).user,
              conversationId: (message as any).channel,
              provider: (message as any).provider,
              ts: (message as any).ts,
            },
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error searching messages:', error);
      return [];
    }
  }

  private async searchSummaries(
    query: string,
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    if (options.sourceTypes && !options.sourceTypes.includes('summary')) {
      return [];
    }

    try {
      const summaryQuery: any = {};
      if (options.conversationId)
        summaryQuery.conversationId = options.conversationId;
      if (options.provider) summaryQuery.provider = options.provider;

      if (options.timeRange?.start || options.timeRange?.end) {
        const timeFilter: any = {};
        if (options.timeRange.start) timeFilter.$gte = options.timeRange.start;
        if (options.timeRange.end) timeFilter.$lte = options.timeRange.end;
        summaryQuery.createdAt = timeFilter;
      }

      if (query.trim()) {
        summaryQuery.$or = [{ summaryText: { $regex: query, $options: 'i' } }];
      }

      const summaries = await this.summaryModel
        .find(summaryQuery)
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();

      const results: SearchResult[] = [];

      for (const summary of summaries) {
        const textRel = this.calculateTextSimilarity(
          query,
          (summary as any).summaryText || '',
        );
        const relevance = textRel * 0.8; // modest boost since it's a condensed text

        if (relevance >= ASSISTANT_CONFIG.MIN_RELEVANCE_SCORE) {
          const summaryId = summary._id as Types.ObjectId;
          results.push({
            id: summaryId.toString(),
            type: 'summary',
            content: (summary as any).summaryText || '',
            relevance,
            timestamp: (summary as any).createdAt || summaryId.getTimestamp(),
            metadata: {
              conversationId: (summary as any).conversationId,
              provider: (summary as any).provider,
              messageCount: (summary as any).messageIds?.length || 0,
              messageIds: (summary as any).messageIds,
              lastMessageTs: (summary as any).lastMessageTs,
              status: (summary as any).status,
            },
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error searching summaries:', error);
      return [];
    }
  }

  private async searchActions(
    query: string,
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    if (options.sourceTypes && !options.sourceTypes.includes('action')) {
      return [];
    }

    try {
      const actionQuery: any = {};
      if (options.conversationId)
        actionQuery.conversationId = options.conversationId;
      if (options.provider) actionQuery.provider = options.provider;
      if (options.userId) actionQuery['assignees.userId'] = options.userId;

      if (options.timeRange?.start || options.timeRange?.end) {
        const timeFilter: any = {};
        if (options.timeRange.start) timeFilter.$gte = options.timeRange.start;
        if (options.timeRange.end) timeFilter.$lte = options.timeRange.end;
        actionQuery.createdAt = timeFilter;
      }

      if (query.trim()) {
        actionQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { context: { $regex: query, $options: 'i' } },
        ];
      }

      const actions = await this.actionModel
        .find(actionQuery)
        .sort({ importance: -1, createdAt: -1 })
        .limit(20)
        .exec();

      const results: SearchResult[] = [];

      for (const action of actions) {
        const combinedText = `${(action as any).title || ''} ${(action as any).description || ''} ${(action as any).context || ''}`;
        let relevance = this.calculateTextSimilarity(query, combinedText);

        // Keep your importance boost behavior
        const importanceBoost = this.getImportanceBoost(
          (action as any).importance,
        );
        relevance *= 1 + importanceBoost * 0.2;

        if (relevance >= ASSISTANT_CONFIG.MIN_RELEVANCE_SCORE) {
          const actionId = action._id as Types.ObjectId;
          results.push({
            id: actionId.toString(),
            type: 'action',
            content: (action as any).description || (action as any).title || '',
            relevance,
            timestamp: (action as any).createdAt || actionId.getTimestamp(),
            metadata: {
              conversationId: (action as any).conversationId,
              provider: (action as any).provider,
              title: (action as any).title,
              actionType: (action as any).type,
              importance: (action as any).importance,
              status: (action as any).status,
              dueDate: (action as any).due_date,
              tags: (action as any).tags,
              context: (action as any).context,
              assignees:
                (action as any).assignees?.map((a: any) => ({
                  userId: a.userId,
                  userName: a.userName,
                  role: a.role,
                  isCurrentUser: a.isCurrentUser,
                })) || [],
              isAssignedToMe: (action as any).isAssignedToMe,
              createdFromMessage: (action as any).createdFromMessage,
              summaryId: (action as any).summaryId,
            },
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error searching actions:', error);
      return [];
    }
  }

  private calculateWeightedRelevance(result: SearchResult): number {
    let relevance = result.relevance;

    // type weight
    if (ASSISTANT_CONFIG.SOURCE_WEIGHTS?.[result.type]) {
      relevance *= ASSISTANT_CONFIG.SOURCE_WEIGHTS[result.type];
    }

    const daysSince =
      (Date.now() - result.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const window = ASSISTANT_CONFIG.RECENT_DAYS_BOOST;
    if (typeof window === 'number' && daysSince <= window) {
      const recencyBoost = (window - daysSince) / Math.max(window, 1);
      relevance += recencyBoost * (ASSISTANT_CONFIG.RECENCY_BOOST_FACTOR ?? 0);
    }

    return Math.min(relevance, 1.0);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let dot = 0,
      na = 0,
      nb = 0;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i],
        bi = b[i];
      dot += ai * bi;
      na += ai * ai;
      nb += bi * bi;
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  private calculateTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const contentWords = content.toLowerCase().split(/\s+/).filter(Boolean);
    const queryText = query.toLowerCase();
    const contentText = content.toLowerCase();

    const qSet = new Set(queryWords);
    const cSet = new Set(contentWords);

    const exactMatches = Array.from(qSet).filter((x) => cSet.has(x));

    const partialMatches = Array.from(qSet).filter((q) => {
      if (exactMatches.includes(q)) return false;
      return Array.from(cSet).some((cw) => cw.includes(q) || q.includes(cw));
    });

    const keyPhrases = queryText.match(/\b\w+[-]\w+\b/g) || [];
    const phraseMatches = keyPhrases.filter((p) => contentText.includes(p));

    const total = Math.max(queryWords.length, 1);
    const exactScore = exactMatches.length / total;
    const partialScore = (partialMatches.length * 0.7) / total;
    const phraseScore =
      (phraseMatches.length * 1.2) / Math.max(keyPhrases.length || 1, 1);
    const keywordBonus =
      exactMatches.length >= 2 || phraseMatches.length >= 1 ? 0.2 : 0;

    return Math.min(
      exactScore + partialScore + phraseScore + keywordBonus,
      1.0,
    );
  }

  private getImportanceBoost(importance: string): number {
    switch ((importance || '').toLowerCase()) {
      case 'urgent':
        return 1.0;
      case 'high':
        return 0.7;
      case 'medium':
        return 0.4;
      case 'low':
        return 0.2;
      default:
        return 0.4;
    }
  }
}
