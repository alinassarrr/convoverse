import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ConversationsService } from './conversations.service';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('Conversations')
@ApiBearerAuth('JWT-auth')
@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @ApiOperation({ summary: 'Sync conversations and messages from Slack' })
  @ApiResponse({
    status: 200,
    description: 'Sync completed',
  })
  @ApiResponse({ status: 400, description: 'Slack not connected' })
  @Get('sync/slack/messages')
  async syncSlack(@Req() req: Request & { user: { userId: string } }) {
    return this.conversationsService.syncSlack(req.user.userId);
  }
}
