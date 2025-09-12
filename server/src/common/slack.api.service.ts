import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  SlackConversationHistoryResponse,
  SlackConversationsListResponse,
} from 'src/types/slack.api.types';

@Injectable()
export class SlackApiService {
  constructor(private readonly http: HttpService) {}

  async getConversations(
    token: string,
    cursor?: string,
  ): Promise<SlackConversationsListResponse> {
    const res = await this.http.axiosRef.get<SlackConversationsListResponse>(
      'https://slack.com/api/conversations.list',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 20,
          types: 'public_channel,private_channel,im,mpim',
          cursor,
        },
      },
    );
    if (!res.data.ok)
      throw new BadRequestException('Failed to get conversations');
    return res.data;
  }

  async getConversationHistory(
    token: string,
    channelId: string,
    cursor?: string,
  ): Promise<SlackConversationHistoryResponse> {
    const res = await this.http.axiosRef.get<SlackConversationHistoryResponse>(
      'https://slack.com/api/conversations.history',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { channel: channelId, limit: 200, cursor },
      },
    );
    if (!res.data.ok)
      throw new BadRequestException('Failed to get conversations');
    return res.data;
  }
}
