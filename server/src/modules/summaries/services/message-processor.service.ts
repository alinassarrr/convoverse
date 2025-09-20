import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import dayjs from 'dayjs';
import { Message } from 'src/schemas/messages.schema';
import { Integration } from 'src/schemas/integrations.schema';
import { Summary } from 'src/schemas/summarys.schema';
import { SummariesConfig } from '../config/summaries.config';
import {
  ProcessedMessage,
  ChannelProcessingStatus,
  UserProfile,
  SlackIntegration,
} from '../interfaces/summaries.interfaces';

@Injectable()
export class MessageProcessorService {
  private readonly logger = new Logger(MessageProcessorService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Integration.name) private integrationModel: Model<Integration>,
    @InjectModel(Summary.name) private summaryModel: Model<Summary>,
  ) {}

  /**
   * Gets all channels that need processing
   */
  async getChannelsNeedingProcessing(): Promise<ChannelProcessingStatus[]> {
    const channels = await this.messageModel.distinct('channel', {});
    this.logger.log(`Found ${channels.length} channels to check`);

    const channelsStatus: ChannelProcessingStatus[] = [];

    for (const channel of channels) {
      const probe = await this.messageModel.findOne({ channel }).lean();
      if (!probe) continue;

      const status = await this.getChannelProcessingStatus(
        channel,
        probe.provider,
      );
      channelsStatus.push(status);
    }

    return channelsStatus.filter((status) => status.shouldProcess);
  }

  /**
   * Checks if a channel needs processing
   */
  async getChannelProcessingStatus(
    channel: string,
    provider: string,
  ): Promise<ChannelProcessingStatus> {
    const lastSummary = await this.getLastSummary(channel, provider);
    const pendingMessages = await this.getPendingMessages(
      channel,
      provider,
      lastSummary?.lastMessageTs,
    );

    if (!pendingMessages.length) {
      this.logger.debug(`No pending messages for channel ${channel}`);
      return {
        channel,
        provider,
        pendingCount: 0,
        oldestAgeMinutes: 0,
        shouldProcess: false,
      };
    }

    const pendingCount = pendingMessages.length;
    const oldestAgeMinutes = this.computeMessageAge(pendingMessages[0].ts);

    const shouldProcess =
      pendingCount >= SummariesConfig.MIN_MESSAGES_FOR_SUMMARY ||
      oldestAgeMinutes >= SummariesConfig.MAX_AGE_MINUTES_FOR_SUMMARY;

    this.logger.log(
      `Channel ${channel}: ${pendingCount} pending messages, oldest: ${oldestAgeMinutes} minutes`,
    );

    return {
      channel,
      provider,
      pendingCount,
      oldestAgeMinutes,
      shouldProcess,
    };
  }

  /**
   * Gets and enriches messages for processing
   */
  async getEnrichedMessages(
    conversationId: string,
    provider: string,
    lastMessageTs?: string,
  ): Promise<ProcessedMessage[]> {
    const messages = await this.getNewMessages(
      conversationId,
      provider,
      lastMessageTs,
    );

    if (!messages.length) {
      return [];
    }

    // Get user profiles for name enrichment
    const userIds = [...new Set(messages.map((m) => m.user))];
    const userProfiles = await this.getUserProfiles(userIds);
    const integration = await this.getIntegration(provider);

    const authedUserId = this.getAuthedUserId(integration, provider);
    const userMap = this.createUserMap(userProfiles);

    return messages.map((msg) => ({
      id: msg._id.toString(),
      sender: msg.user,
      senderName: this.getSenderName(msg.user, authedUserId, userMap),
      text: msg.text,
      ts: msg.ts,
    }));
  }

  /**
   * Marks messages as summarized
   */
  async markMessagesAsSummarized(messageIds: string[]): Promise<void> {
    await this.messageModel.updateMany(
      { _id: { $in: messageIds } },
      { $set: { summarized: true } },
    );
  }

  /**
   * Gets the last summary for a conversation
   */
  private async getLastSummary(conversationId: string, provider: string) {
    return this.summaryModel
      .findOne({ conversationId, provider, status: 'done' })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Gets pending messages for a conversation
   */
  private async getPendingMessages(
    channel: string,
    provider: string,
    lastMessageTs?: string,
  ) {
    const match: any = { channel, provider };

    if (lastMessageTs) {
      match.ts = { $gt: lastMessageTs };
    }

    return this.messageModel.find(match).sort({ ts: 1 }).lean();
  }

  /**
   * Gets new messages for processing (limited batch)
   */
  private async getNewMessages(
    conversationId: string,
    provider: string,
    lastMessageTs?: string,
  ) {
    const match: any = { channel: conversationId, provider };

    if (lastMessageTs) {
      match.ts = { $gt: lastMessageTs };
    }

    return this.messageModel
      .find(match)
      .sort({ ts: 1 })
      .limit(SummariesConfig.MAX_MESSAGES_PER_BATCH)
      .lean();
  }

  /**
   * Gets user profiles from database
   */
  private async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    const users = await this.messageModel.db
      .collection('slack_users')
      .find({ id: { $in: userIds } })
      .toArray();

    return users.map((user) => ({
      id: user.id,
      profile: user.profile,
    })) as UserProfile[];
  }

  /**
   * Gets integration details
   */
  private async getIntegration(
    provider: string,
  ): Promise<SlackIntegration | null> {
    return this.integrationModel
      .findOne({ provider })
      .lean() as Promise<SlackIntegration | null>;
  }

  /**
   * Gets authenticated user ID for the integration
   */
  private getAuthedUserId(
    integration: SlackIntegration | null,
    provider: string,
  ): string | undefined {
    if (provider === 'slack') {
      return integration?.metadata?.authed_user?.id;
    }
    return undefined;
  }

  /**
   * Creates user ID to name mapping
   */
  private createUserMap(userProfiles: UserProfile[]): Record<string, string> {
    return userProfiles.reduce(
      (acc, user) => {
        acc[user.id] = user.profile?.real_name || user.id;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  /**
   * Gets display name for message sender
   */
  private getSenderName(
    userId: string,
    authedUserId: string | undefined,
    userMap: Record<string, string>,
  ): string {
    if (authedUserId && userId === authedUserId) {
      return 'Me';
    }
    return userMap[userId] || userId;
  }

  /**
   * Computes age of message in minutes
   */
  private computeMessageAge(ts: string): number {
    const seconds = parseInt(String(ts).split('.')[0], 10);
    if (!Number.isFinite(seconds)) return Infinity;

    const createdAt = dayjs.unix(seconds);
    return dayjs().diff(createdAt, 'minute');
  }

  /**
   * Gets the current authenticated user ID for the provider
   */
  async getCurrentUserId(provider: string): Promise<string | undefined> {
    const integration = await this.getIntegration(provider);
    return this.getAuthedUserId(integration, provider);
  }
}
