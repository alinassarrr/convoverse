import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { AuthGuard } from 'src/guards/auth.guard';
import {
  ConversationListResponseDto,
  MarkAsReadDto,
} from './dto/conversation-response.dto';
import type { Request } from 'express';
import { ListLatestConversationDto } from './dto/list-latest-conversation.dto';

type AuthedReq = Request & { user: { userId: string } };

@ApiTags('Conversations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @ApiOperation({
    summary: 'List conversations (sorted by latest message)',
  })
  @ApiResponse({ status: 200, type: ConversationListResponseDto })
  @Get()
  listConversations(
    @Req() req: AuthedReq,
    @Query(new ValidationPipe({ transform: true }))
    dto: ListLatestConversationDto,
  ) {
    return this.conversationsService.listConversations(dto);
  }

  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiParam({ name: 'channel', description: 'Conversation/channel ID' })
  @ApiResponse({ status: 200 })
  @Get(':channel/messages')
  listMessages(
    @Param('channel') channel: string,
    @Query('provider') provider: string,
  ) {
    return this.conversationsService.listMessages(channel, provider);
  }
}
