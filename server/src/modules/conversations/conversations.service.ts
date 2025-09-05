import { BadRequestException, Injectable } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation } from 'src/schemas/conversations.schema';
import { Model } from 'mongoose';
import { Message } from 'src/schemas/messages.schema';
import { SlackApiService } from 'src/common/slack.api.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly slackApiService: SlackApiService,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}
  //  sync slack conversations and messages
  async syncSlack(userId: string) {
    const integration =
      await this.integrationsService.getSlackIntegration(userId);
    if (!integration) throw new BadRequestException('Slack not connected');

    const slackToken = integration.metadata?.authed_user
      ?.access_token as string;
    if (!slackToken) {
      throw new BadRequestException('Slack access token not found');
    }

    let cursor: string | undefined = undefined; //slack pagination cursor
    let totalSynced = 0;

    do {
      const { channels, response_metadata } =
        await this.slackApiService.getConversations(slackToken, cursor);

      for (const channel of channels) {
        await this.conversationModel.updateOne(
          { conversationId: channel.id, userID: userId },
          {
            $set: {
              platform: 'slack',
              conversationId: channel.id,
              name: channel.name,
              isIm: !!channel.is_im,
              type: channel.is_im ? 'dm' : 'channel',
              isPrivate: !!channel.is_private,
              members: channel.is_im ? [channel.user] : channel.members || [],
              topic: channel.topic?.value || '',
              purpose: channel.purpose?.value || '',
              numMembers:
                typeof channel.num_members === 'number'
                  ? channel.num_members
                  : Array.isArray(channel.members)
                    ? channel.members.length
                    : undefined,
              // store other members user id
              userId: channel.is_im ? channel.user : undefined,
            },
          },
          { upsert: true },
        );

        await this.syncMessages(slackToken, channel.id, userId);
      }

      cursor = response_metadata?.next_cursor;
      totalSynced += channels.length;
    } while (cursor);

    return { syncedConversations: totalSynced };
  }
}
