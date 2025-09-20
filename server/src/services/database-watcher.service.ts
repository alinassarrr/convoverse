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
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class DatabaseWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseWatcherService.name);
  private messageChangeStream: any;
  private conversationChangeStream: any;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    private chatGateway: ChatGateway,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'Starting real-time database watchers with Change Streams...',
    );
    await this.startMessageWatcher();
    await this.startConversationWatcher();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping database watchers...');
    if (this.messageChangeStream) {
      await this.messageChangeStream.close();
    }
    if (this.conversationChangeStream) {
      await this.conversationChangeStream.close();
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
          `🔥 Real-time message detected: ${newMessage.ts} in channel ${newMessage.channel}`,
        );

        // Wait a bit and then fetch the message with populated sender info
        setTimeout(async () => {
          try {
            await this.emitMessageWithSenderInfo(newMessage);
          } catch (error) {
            this.logger.error('Error emitting message with sender info:', error);
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
            this.chatGateway.emitNewMessage(newMessage.channel, basicMessageData);
          }
        }, 1500); // Wait 1.5 seconds for sender info to be populated
      });

      this.messageChangeStream.on('error', (error: any) => {
        this.logger.error('Message change stream error:', error);
      });

      this.logger.log('✅ Real-time message watcher started successfully');
    } catch (error) {
      this.logger.error('❌ Error starting message watcher:', error);
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

      this.conversationChangeStream.on('change', (change: any) => {
        const conversation = change.fullDocument;
        this.logger.log(
          `🔥 Real-time conversation updated: ${conversation.channel}`,
        );

        // Format conversation data for WebSocket
        const conversationData = {
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

        // Emit conversation update to all clients
        this.chatGateway.emitConversationUpdate(
          conversation.channel,
          conversationData,
        );

        // Also emit global update for conversation list updates
        this.chatGateway.emitGlobalUpdate('conversation_list_updated', {
          conversation: conversationData,
          operationType: change.operationType,
        });
      });

      this.conversationChangeStream.on('error', (error: any) => {
        this.logger.error('Conversation change stream error:', error);
      });

      this.logger.log('✅ Real-time conversation watcher started successfully');
    } catch (error) {
      this.logger.error('❌ Error starting conversation watcher:', error);
    }
  }

  private async emitMessageWithSenderInfo(message: any) {
    try {
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
          $project: {
            _id: 1,
            ts: 1,
            text: 1,
            user: 1,
            channel: 1,
            provider: 1,
            type: 1,
            metadata: 1,
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
          // Add sender information
          sender: enrichedMessage.sender,
          senderName: enrichedMessage.sender?.display_name || enrichedMessage.sender?.name,
          senderDisplayName: enrichedMessage.sender?.display_name,
          senderAvatar: enrichedMessage.sender?.avatar,
        };

        this.logger.log(
          `📤 Emitting message with sender info: ${messageData.senderName || 'Unknown'}`,
        );
        
        // Emit to specific conversation room
        this.chatGateway.emitNewMessage(enrichedMessage.channel, messageData);
      } else {
        this.logger.warn('No message found when trying to emit with sender info');
      }
    } catch (error) {
      this.logger.error('Error in emitMessageWithSenderInfo:', error);
      throw error;
    }
  }
}
