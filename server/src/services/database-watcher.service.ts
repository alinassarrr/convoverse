import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../schemas/messages.schema';
import { Conversation } from '../schemas/conversations.schema';
import { Action } from '../schemas/action.schema';
import { Summary } from '../schemas/summarys.schema';
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class DatabaseWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseWatcherService.name);
  private messageChangeStream: any;
  private conversationChangeStream: any;
  private actionChangeStream: any;
  private summaryChangeStream: any;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Action.name) private actionModel: Model<Action>,
    @InjectModel(Summary.name) private summaryModel: Model<Summary>,
    private chatGateway: ChatGateway,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'Starting real-time database watchers with Change Streams...',
    );
    await this.startMessageWatcher();
    await this.startConversationWatcher();
    await this.startActionWatcher();
    await this.startSummaryWatcher();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping database watchers...');
    if (this.messageChangeStream) {
      await this.messageChangeStream.close();
    }
    if (this.conversationChangeStream) {
      await this.conversationChangeStream.close();
    }
    if (this.actionChangeStream) {
      await this.actionChangeStream.close();
    }
    if (this.summaryChangeStream) {
      await this.summaryChangeStream.close();
    }
  }

  private async startMessageWatcher() {
    try {
      // Watch for new messages being inserted
      this.messageChangeStream = this.messageModel.collection.watch(
        [
          {
            $match: {
              operationType: 'insert',
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.messageChangeStream.on('change', async (change: any) => {
        const newMessage = change.fullDocument;
        this.logger.log(
          `Real-time message detected: ${newMessage.ts} in channel ${newMessage.channel}`,
        );

        // First, update the conversation's last_message_ts
        try {
          await this.updateConversationLastMessageTs(newMessage);
        } catch (error) {
          this.logger.error(
            'Error updating conversation last_message_ts:',
            error,
          );
        }

        // Wait a bit and then fetch the message with populated sender info
        setTimeout(async () => {
          try {
            await this.emitMessageWithSenderInfo(newMessage);
          } catch (error) {
            this.logger.error(
              'Error emitting message with sender info:',
              error,
            );
            // Fallback to basic message data
            const basicMessageData = {
              id: (newMessage._id as Types.ObjectId).toString(),
              ts: newMessage.ts,
              text: newMessage.text,
              user: newMessage.user,
              channel: newMessage.channel,
              provider: newMessage.provider,
              type: newMessage.type,
              timestamp: (newMessage._id as Types.ObjectId)
                .getTimestamp()
                .toISOString(),
              metadata: newMessage.metadata,
            };
            this.chatGateway.emitNewMessage(
              newMessage.channel,
              basicMessageData,
            );
          }
        }, 1500); // Wait 1.5 seconds for sender info to be populated
      });

      this.messageChangeStream.on('error', (error: any) => {
        this.logger.error('Message change stream error:', error);
      });

      this.logger.log('Real-time message watcher started successfully');
    } catch (error) {
      this.logger.error('Error starting message watcher:', error);
    }
  }

  private async startConversationWatcher() {
    try {
      // Watch for conversation updates (like last_message_ts changes)
      this.conversationChangeStream = this.conversationModel.collection.watch(
        [
          {
            $match: {
              $or: [
                { operationType: 'insert' },
                { operationType: 'update' },
                { operationType: 'replace' },
              ],
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.conversationChangeStream.on('change', async (change: any) => {
        const conversation = change.fullDocument;
        this.logger.log(
          `Real-time conversation updated: ${conversation.channel}`,
        );

        try {
          // Fetch enriched conversation data with last message and sender info
          const enrichedConversation =
            await this.getEnrichedConversationData(conversation);

          // Emit conversation update to all clients
          this.chatGateway.emitConversationUpdate(
            conversation.channel,
            enrichedConversation,
          );

          // Also emit global update for conversation list updates
          this.chatGateway.emitGlobalUpdate('conversation_list_updated', {
            conversation: enrichedConversation,
            operationType: change.operationType,
          });
        } catch (error) {
          this.logger.error('Error enriching conversation data:', error);
          // Fallback to basic conversation data
          const basicConversationData = {
            id: (conversation._id as Types.ObjectId).toString(),
            channel: conversation.channel,
            name: conversation.name,
            provider: conversation.provider,
            is_im: conversation.is_im,
            user: conversation.user,
            last_message_ts: conversation.last_message_ts,
            updated: conversation.updated,
            timestamp: new Date().toISOString(),
          };

          this.chatGateway.emitConversationUpdate(
            conversation.channel,
            basicConversationData,
          );

          this.chatGateway.emitGlobalUpdate('conversation_list_updated', {
            conversation: basicConversationData,
            operationType: change.operationType,
          });
        }
      });

      this.conversationChangeStream.on('error', (error: any) => {
        this.logger.error('Conversation change stream error:', error);
      });

      this.logger.log('Real-time conversation watcher started successfully');
    } catch (error) {
      this.logger.error('Error starting conversation watcher:', error);
    }
  }

  private async updateConversationLastMessageTs(message: any) {
    try {
      const updateResult = await this.conversationModel.updateOne(
        {
          channel: message.channel,
          provider: message.provider,
        },
        {
          $set: {
            last_message_ts: message.ts,
            updated: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
          },
        },
      );

      if (updateResult.matchedCount > 0) {
        this.logger.log(
          `Updated conversation ${message.channel} last_message_ts to ${message.ts}`,
        );
      } else {
        this.logger.warn(
          `No conversation found to update for channel ${message.channel}`,
        );
        // Optionally create a new conversation record if it doesn't exist
        // This might happen if a message arrives before the conversation is synced
      }
    } catch (error) {
      this.logger.error(
        `Error updating conversation last_message_ts for channel ${message.channel}:`,
        error,
      );
      throw error;
    }
  }

  private async getEnrichedConversationData(conversation: any) {
    try {
      // Get integration for authed user ID
      const integration = await this.conversationModel.db
        .collection('integrations')
        .findOne({ provider: conversation.provider });

      if (!integration) {
        throw new Error('Integration not found');
      }

      let authedUserId: string;
      if (conversation.provider === 'slack') {
        authedUserId = integration.metadata?.authed_user?.id;
      } else {
        throw new Error('Provider not supported');
      }

      // Use the same aggregation pipeline as ConversationsService
      const enrichedData = await this.conversationModel.aggregate([
        { $match: { _id: conversation._id } },
        { $sort: { last_message_ts: -1 } },
        {
          $lookup: {
            from: 'messages',
            let: { channel: '$channel', provider: '$provider' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$channel', '$$channel'] },
                      { $eq: ['$provider', '$$provider'] },
                    ],
                  },
                },
              },
              { $sort: { ts: -1 } },
              { $limit: 1 },
            ],
            as: 'lastMessage',
          },
        },
        {
          $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true },
        },
        // For DMs: Find the other participant (not the authenticated user)
        {
          $lookup: {
            from: 'messages',
            let: { channel: '$channel', provider: '$provider' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$channel', '$$channel'] },
                      { $eq: ['$provider', '$$provider'] },
                      { $ne: ['$user', authedUserId] }, // Not the authenticated user
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'otherParticipantMessage',
          },
        },
        // Get user info for the display (other participant for DMs, last sender for channels)
        {
          $lookup: {
            from: 'slack_users',
            let: {
              displayUserId: {
                $cond: [
                  { $eq: ['$is_im', true] },
                  // For DMs: use other participant if available, otherwise last message sender
                  {
                    $cond: [
                      { $gt: [{ $size: '$otherParticipantMessage' }, 0] },
                      { $arrayElemAt: ['$otherParticipantMessage.user', 0] },
                      '$lastMessage.user',
                    ],
                  },
                  // For channels: use last message sender
                  '$lastMessage.user',
                ],
              },
            },
            pipeline: [
              { $match: { $expr: { $eq: ['$id', '$$displayUserId'] } } },
              { $limit: 1 },
            ],
            as: 'sender',
          },
        },
        { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            channel: 1,
            provider: 1,
            is_im: 1,
            name: 1,
            description: 1,
            last_message_ts: 1,
            'lastMessage.text': {
              $substr: [{ $ifNull: ['$lastMessage.text', ''] }, 0, 20],
            },
            'lastMessage.ts': 1,
            sender: {
              id: '$sender.id',
              name: '$sender.name',
              display_name: '$sender.profile.real_name',
              avatar: '$sender.profile.image_48',
            },
          },
        },
      ]);

      if (enrichedData.length > 0) {
        const enriched = enrichedData[0];
        return {
          _id: (enriched._id as Types.ObjectId).toString(),
          id: (enriched._id as Types.ObjectId).toString(), // For compatibility
          channel: enriched.channel,
          name: enriched.name,
          provider: enriched.provider,
          is_im: enriched.is_im,
          description: enriched.description,
          last_message_ts: enriched.last_message_ts,
          lastMessage: {
            text: enriched.lastMessage?.text || '',
            ts: enriched.lastMessage?.ts || enriched.last_message_ts,
          },
          sender: enriched.sender || {},
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('No conversation data found');
      }
    } catch (error) {
      this.logger.error('Error in getEnrichedConversationData:', error);
      throw error;
    }
  }

  private async emitMessageWithSenderInfo(message: any) {
    try {
      // Get integration for authed user ID
      const integration = await this.messageModel.db
        .collection('integrations')
        .findOne({ provider: message.provider });

      let authedUserId: string | undefined;
      if (integration && message.provider === 'slack') {
        authedUserId = integration.metadata?.authed_user?.id;
      }

      // Use aggregation to get message with sender info (similar to your conversations service)
      const messagesWithSender = await this.messageModel.aggregate([
        { $match: { _id: message._id } },
        {
          $lookup: {
            from: 'slack_users',
            localField: 'user',
            foreignField: 'id',
            as: 'senderInfo',
          },
        },
        { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            direction: {
              $cond: [{ $eq: ['$user', authedUserId] }, 'out', 'in'],
            },
            senderName: {
              $cond: [
                { $eq: ['$user', authedUserId] },
                'You',
                '$senderInfo.profile.real_name',
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            ts: 1,
            text: 1,
            user: 1,
            channel: 1,
            provider: 1,
            type: 1,
            metadata: 1,
            direction: 1,
            senderName: 1,
            sender: {
              id: '$senderInfo.id',
              name: '$senderInfo.name',
              display_name: '$senderInfo.profile.real_name',
              avatar: '$senderInfo.profile.image_48',
            },
          },
        },
      ]);

      if (messagesWithSender.length > 0) {
        const enrichedMessage = messagesWithSender[0];

        // Format message for WebSocket with sender info
        const messageData = {
          id: (enrichedMessage._id as Types.ObjectId).toString(),
          ts: enrichedMessage.ts,
          text: enrichedMessage.text,
          user: enrichedMessage.user,
          channel: enrichedMessage.channel,
          provider: enrichedMessage.provider,
          type: enrichedMessage.type,
          timestamp: (enrichedMessage._id as Types.ObjectId)
            .getTimestamp()
            .toISOString(),
          metadata: enrichedMessage.metadata,
          // Add direction and sender information
          direction: enrichedMessage.direction,
          sender: enrichedMessage.sender,
          senderName: enrichedMessage.senderName,
          senderDisplayName: enrichedMessage.sender?.display_name,
          senderAvatar: enrichedMessage.sender?.avatar,
        };

        this.logger.log(
          `Emitting message with sender info: ${messageData.senderName || 'Unknown'}`,
        );

        // Emit to specific conversation room
        this.chatGateway.emitNewMessage(enrichedMessage.channel, messageData);
      } else {
        this.logger.warn(
          'No message found when trying to emit with sender info',
        );
      }
    } catch (error) {
      this.logger.error('Error in emitMessageWithSenderInfo:', error);
      throw error;
    }
  }

  private async startActionWatcher() {
    try {
      // Watch for action changes (insert, update, delete)
      this.actionChangeStream = this.actionModel.collection.watch(
        [
          {
            $match: {
              $or: [
                { operationType: 'insert' },
                { operationType: 'update' },
                { operationType: 'replace' },
                { operationType: 'delete' },
              ],
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.actionChangeStream.on('change', (change: any) => {
        const action = change.fullDocument;
        this.logger.log(
          `Real-time action ${change.operationType}: ${action?._id || change.documentKey._id}`,
        );

        let actionData;

        if (change.operationType === 'delete') {
          // For deletes, we only have the _id
          actionData = {
            id: change.documentKey._id.toString(),
            operationType: 'delete',
            timestamp: new Date().toISOString(),
          };
        } else {
          // For insert/update/replace, format the action data
          actionData = {
            id: (action._id as Types.ObjectId).toString(),
            title: action.title,
            description: action.description,
            type: action.type,
            importance: action.importance,
            assignees: action.assignees,
            due_date: action.due_date,
            status: action.status,
            tags: action.tags,
            context: action.context,
            isAssignedToMe: action.isAssignedToMe,
            createdFromMessage: action.createdFromMessage,
            conversationId: action.conversationId,
            provider: action.provider,
            summaryId: action.summaryId,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
            operationType: change.operationType,
            timestamp: new Date().toISOString(),
          };
        }

        // Emit to specific conversation room
        if (action?.conversationId) {
          this.chatGateway.server
            .to(`conversation_${action.conversationId}`)
            .emit('action_updated', {
              conversationId: action.conversationId,
              action: actionData,
              timestamp: new Date().toISOString(),
            });
        }

        // Also emit global update for actions list
        this.chatGateway.emitGlobalUpdate('action_list_updated', {
          action: actionData,
          operationType: change.operationType,
        });
      });

      this.actionChangeStream.on('error', (error: any) => {
        this.logger.error('Action change stream error:', error);
      });

      this.logger.log('Real-time action watcher started successfully');
    } catch (error) {
      this.logger.error('Error starting action watcher:', error);
    }
  }

  private async startSummaryWatcher() {
    try {
      // Watch for summary changes (insert, update, replace)
      this.summaryChangeStream = this.summaryModel.collection.watch(
        [
          {
            $match: {
              $or: [
                { operationType: 'insert' },
                { operationType: 'update' },
                { operationType: 'replace' },
              ],
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.summaryChangeStream.on('change', (change: any) => {
        const summary = change.fullDocument;
        this.logger.log(
          `Real-time summary ${change.operationType}: ${summary.conversationId}`,
        );

        // Format summary data for WebSocket
        const summaryData = {
          id: (summary._id as Types.ObjectId).toString(),
          conversationId: summary.conversationId,
          provider: summary.provider,
          summaryText: summary.summaryText,
          messageIds: summary.messageIds,
          lastMessageTs: summary.lastMessageTs,
          status: summary.status,
          createdAt: summary.createdAt,
          updatedAt: summary.updatedAt,
          operationType: change.operationType,
          timestamp: new Date().toISOString(),
        };

        // Emit to specific conversation room
        this.chatGateway.server
          .to(`conversation_${summary.conversationId}`)
          .emit('summary_updated', {
            conversationId: summary.conversationId,
            summary: summaryData,
            timestamp: new Date().toISOString(),
          });

        // Also emit global update for summaries list
        this.chatGateway.emitGlobalUpdate('summary_list_updated', {
          summary: summaryData,
          operationType: change.operationType,
        });
      });

      this.summaryChangeStream.on('error', (error: any) => {
        this.logger.error('Summary change stream error:', error);
      });

      this.logger.log('Real-time summary watcher started successfully');
    } catch (error) {
      this.logger.error('Error starting summary watcher:', error);
    }
  }
}
