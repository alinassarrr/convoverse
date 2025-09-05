import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedRequest extends Request {
  userId: string;
}

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('slack/connect')
  redirectToSlack(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.generateSlackAuthUrl(req.userId);
  }

  @Get('slack/callback')
  handleSlackCallback(
    @Query('code') code: string, // authorization code
    @Query('state') state: string, //the random string we sent
  ) {
    return this.integrationsService.handleSlackCallback(code, state);
  }
}
