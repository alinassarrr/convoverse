import { Controller, Get, UseGuards, Res, Query, Req } from '@nestjs/common';
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
  redirectToSlack(@Res() res: Response, @Req() req: AuthenticatedRequest) {
    const state = this.jwtService.sign(
      { userId: req.userId },
      { expiresIn: '1h' },
    );
    return this.integrationsService.getSlackAuthUrl(res, state);
  }

  @Get('slack/callback')
  handleSlackCallback(
    @Query('code') code: string, // authorization code
    @Query('state') state: string, //the random string we sent
  ) {
    return this.integrationsService.handleSlackCallback(code, state);
  }
}
