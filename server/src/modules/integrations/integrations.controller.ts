import {
  Controller,
  Get,
  UseGuards,
  Query,
  Req,
  Res,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Connect Slack account' })
  @ApiResponse({ status: 200, description: 'Redirects to Slack OAuth' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('slack/connect')
  redirectToSlack(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.generateSlackAuthUrl(req.user.userId);
  }

  @ApiOperation({ summary: 'Handle Slack OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Slack account connected successfully',
  })
  @Get('slack/callback')
  handleSlackCallback(
    @Query('code') code: string, // authorization code
    @Query('state') state: string, //the random string we sent
  ) {
    return this.integrationsService.handleSlackCallback(code, state);
  }

  @ApiOperation({ summary: 'Trigger Slack sync via n8n webhook' })
  @ApiResponse({
    status: 200,
    description: 'n8n webhook triggered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Slack not connected or webhook failed',
  })
  @ApiParam({ name: 'userId', description: 'User ID to sync Slack data for' })
  @Get('slack/sync/:userId')
  async syncSlack(@Param('userId') userId: string) {
    return this.integrationsService.handleSlackSync(userId);
  }
}
