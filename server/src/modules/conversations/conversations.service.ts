import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Conversation } from 'src/schemas/conversations.schema';
import { Message } from 'src/schemas/messages.schema';
import {} from './dto/list-conversation.dto';
import { ListLatestConversationDto } from './dto/list-latest-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
  ) {}

  /**
   * List conversations, newest first.
   * - Filters: provider, channel, type, search
   * - Limit only (no pages for MVP)
   * - Adds unread flag (0/1) by comparing last_message_ts vs per-user last_read_ts
   */
  async listConversations(dto: ListLatestConversationDto) {
    const limit = dto.limit ?? 15;

    const filter: any = {};
    if (dto.provider) {
      filter.provider = dto.provider;
    }

    return this.conversationModel
      .find(filter)
      .sort({ last_message_ts: -1 })
      .limit(limit)
      .exec();
  }
}
