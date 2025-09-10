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
import { ListConversationsDto } from './dto/list-conversation.dto';
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
}
