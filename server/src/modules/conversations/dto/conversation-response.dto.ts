import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationDto {
  @ApiProperty({ description: 'Unique conversation identifier' })
  id: string;

  @ApiProperty({ description: 'Channel/conversation ID from platform' })
  channel: string;

  @ApiProperty({ description: 'Conversation name' })
  name: string;

  @ApiProperty({ description: 'Platform provider', example: 'slack' })
  provider: string;

  @ApiProperty({
    description: 'Whether this is a direct message',
    default: false,
  })
  is_im: boolean;

  @ApiProperty({ description: 'Conversation type', enum: ['channel', 'dm'] })
  type: string;

  @ApiPropertyOptional({ description: 'Other user ID for DMs' })
  user?: string;

  @ApiPropertyOptional({ description: 'Conversation purpose' })
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };

  @ApiPropertyOptional({ description: 'Conversation topic' })
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  } | null;

  @ApiProperty({ description: 'Creation timestamp (Unix)' })
  created: number;

  @ApiProperty({ description: 'Last update timestamp (Unix milliseconds)' })
  updated: number;

  @ApiPropertyOptional({ description: 'Timestamp of last message' })
  last_message_ts?: string;

  @ApiPropertyOptional({ description: 'Team IDs this conversation belongs to' })
  shared_team_ids?: string[];

  @ApiProperty({ description: 'Number of unread messages' })
  unread_count: number;

  @ApiProperty({ description: 'Last message preview' })
  last_message_preview?: string;
}

export class ConversationListResponseDto {
  @ApiProperty({
    description: 'List of conversations',
    type: [ConversationDto],
  })
  conversations: ConversationDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalConversations: number;
    unreadConversations: number;
    totalUnreadMessages: number;
    conversationsByType: {
      channels: number;
      dms: number;
    };
  };
}

export class ConversationStatsDto {
  @ApiProperty({ description: 'Total number of conversations' })
  totalConversations: number;

  @ApiProperty({ description: 'Number of conversations with unread messages' })
  unreadConversations: number;

  @ApiProperty({
    description: 'Total unread message count across all conversations',
  })
  totalUnreadMessages: number;

  @ApiProperty({ description: 'Breakdown by conversation type' })
  conversationsByType: {
    channels: number;
    dms: number;
  };

  @ApiProperty({ description: 'Breakdown by platform' })
  conversationsByProvider: Record<string, number>;

  @ApiProperty({ description: 'When statistics were generated' })
  timestamp: Date;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Channel/conversation ID' })
  channel: string;

  @ApiPropertyOptional({
    description: 'Specific message timestamp to mark as read up to',
  })
  message_ts?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Channel/conversation ID to send message to' })
  channel: string;

  @ApiProperty({ description: 'Message text content' })
  text: string;

  @ApiPropertyOptional({ description: 'Platform provider', default: 'slack' })
  provider?: string;
}
