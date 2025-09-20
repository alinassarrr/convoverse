import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Conversation } from 'src/schemas/conversations.schema';
import { Message } from 'src/schemas/messages.schema';
import { ListLatestConversationDto } from './dto/list-latest-conversation.dto';
import { Integration } from 'src/schemas/integrations.schema';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(Integration.name)
    private readonly integrationModel: Model<Integration>,
  ) {}

  async listConversations(dto: ListLatestConversationDto) {
    try {
      // Get authenticated user ID from integration
      const integration = await this.integrationModel
        .findOne({ provider: dto.provider || 'slack' })
        .lean();

      if (!integration) {
        throw new BadRequestException('Integration not found');
      }

      let authedUserId: string;
      if ((dto.provider || 'slack') === 'slack') {
        authedUserId = integration.metadata?.authed_user?.id;
      } else {
        throw new BadRequestException('Provider not supported');
      }

      return this.conversationModel
        .aggregate([
          { $match: dto.provider ? { provider: dto.provider } : {} },
          { $sort: { last_message_ts: -1 } },
          { $limit: dto.limit || 50 },

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
          { $match: { 'lastMessage.ts': { $exists: true, $ne: null } } },
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
        ])
        .exec();
    } catch (error) {
      throw new BadRequestException(
        'Failed to list conversations: ' + error.message,
      );
    }
  }
  async listMessages(channel: string, provider: string) {
    try {
      const integration = await this.integrationModel
        .findOne({ provider })
        .lean();

      if (!integration) {
        throw new BadRequestException('Integration not found');
      }
      let authedUserId: string;
      if (provider === 'slack') {
        authedUserId = integration.metadata?.authed_user?.id;
      } else {
        throw new BadRequestException('Provider not supported');
      }
      return this.messageModel.aggregate([
        { $match: { channel, provider } },
        { $sort: { ts: -1 } },
        { $limit: 30 },

        {
          $lookup: {
            from: 'slack_users',
            localField: 'user',
            foreignField: 'id',
            as: 'sender',
          },
        },
        { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            direction: {
              $cond: [{ $eq: ['$user', authedUserId] }, 'out', 'in'],
            },
            senderName: {
              $cond: [
                { $eq: ['$user', authedUserId] },
                'You',
                '$sender.profile.real_name',
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            text: 1,
            ts: 1,
            direction: 1,
            senderName: 1,
            sender: {
              id: '$sender.id',
              name: '$sender.name',
              display_name: '$sender.profile.real_name',
              avatar: '$sender.profile.image_48',
            },
          },
        },
        // solution for duplicate messages due to multiple joins
        {
          $group: {
            _id: '$_id',
            text: { $first: '$text' },
            ts: { $first: '$ts' },
            direction: { $first: '$direction' },
            senderName: { $first: '$senderName' },
            sender: { $first: '$sender' },
          },
        },
        { $sort: { ts: -1 } },
      ]);
    } catch (error) {
      throw new BadRequestException(
        'Failed to list messages: ' + error.message,
      );
    }
  }
}
