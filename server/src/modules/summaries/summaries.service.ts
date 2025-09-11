import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { Message } from 'src/schemas/messages.schema';
import { Summary } from 'src/schemas/summarys.schema';
import { TriggerSummarizationDto } from './dto/trigger-summary.dto';
import { SaveSummaryDto } from './dto/save-summary.dto';

@ApiTags('Summaries')
@Injectable()
export class SummariesService {
  constructor(
    @InjectModel(Summary.name) private readonly summaryModel: Model<Summary>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}
  // called by n8n or button on UI to get unsummarized messages
  // waiting for code review
  async triggerSummarization(triggerDto: TriggerSummarizationDto) {
    const { conversationId, provider } = triggerDto;

    const lastSummary = await this.summaryModel
      .findOne({ conversationId, provider, status: 'done' })
      .sort({ createdAt: -1 })
      .lean();
    // get messages after last summary
    const match: any = {
      channel: triggerDto.conversationId,
      provider: triggerDto.provider,
    };
    if (lastSummary?.lastMessageTs) {
      match.ts = { $gt: lastSummary.lastMessageTs };
    }
    // get the next 20 messages
    const messages = await this.messageModel
      .find(match)
      .sort({ ts: 1 })
      .limit(20)
      .lean();
    if (!messages.length) {
      return { status: 'no new messages' };
    }

    const content = messages.map((msg) => ({
      id: msg._id,
      user: msg.user,
      text: msg.text,
      ts: msg.ts,
    }));

    return {
      conversationId,
      provider,
      lastMessageTs: content[content.length - 1].ts,
      messages: content,
      messageIds: content.map((m) => m.id),
    };
  }
  // after summary done by n8n time to save it
  async saveSummary(saveSummaryDto: SaveSummaryDto) {
    const { conversationId, provider, summaryText, messageIds, lastMessageTs } =
      saveSummaryDto;

    try {
      const createdSummary = await this.summaryModel.create({
        conversationId,
        provider,
        summaryText,
        messageIds,
        lastMessageTs,
        status: 'done',
      });
      return createdSummary;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
