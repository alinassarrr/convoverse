import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConversationsService } from './conversations.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('sync/slack')
  async syncSlack(@Req() req: Request & { user: { userId: string } }) {
    return this.conversationsService.syncSlack(req.user.userId);
  }
}
