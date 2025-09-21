import {
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  Req,
  Res,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { IntegrationsService } from './integrations.service';
import { SendSlackMessageDto } from './dto/send-slack-message.dto';
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

  @ApiOperation({ summary: 'Connect Gmail account' })
  @ApiResponse({ status: 200, description: 'Returns Gmail OAuth URL' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('gmail/connect')
  redirectToGmail(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.generateGmailAuthUrl(req.user.userId);
  }

  @ApiOperation({ summary: 'Handle Slack OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend integration page',
  })
  @Get('slack/callback')
  async handleSlackCallback(
    @Query('code') code: string, // authorization code
    @Query('state') state: string, //the random string we sent
    @Res() res: Response,
  ) {
    try {
      const result = await this.integrationsService.handleSlackCallback(
        code,
        state,
      );
      // Redirect to frontend integration page with success message
      return res.redirect('http://localhost:3001/integration?slack=connected');
    } catch (error) {
      console.error('Slack callback error:', error);
      // Redirect to frontend integration page with error message
      return res.redirect('http://localhost:3001/integration?slack=error');
    }
  }

  @ApiOperation({ summary: 'Handle Gmail OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend integration page',
  })
  @Get('gmail/callback')
  async handleGmailCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // Process OAuth callback to exchange code for tokens
      await this.integrationsService.handleGmailCallback(code, state);

      // Trigger Gmail sync webhook
      await this.integrationsService.handleGmailSync();

      // Redirect to frontend integration page with success message
      return res.redirect('http://localhost:3001/integration?gmail=connected');
    } catch (error) {
      console.error('Gmail callback error:', error);
      // Redirect to frontend integration page with error message
      return res.redirect('http://localhost:3001/integration?gmail=error');
    }
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

  @ApiOperation({ summary: 'Get user integrations' })
  @ApiResponse({
    status: 200,
    description: 'User integrations retrieved successfully',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('status')
  async getUserIntegrations(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.getUserIntegrationsStatus(req.user.userId);
  }

  @ApiOperation({ summary: 'Connect Gmail integration (fake for demo)' })
  @ApiResponse({
    status: 200,
    description: 'Gmail integration connected successfully',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Post('gmail/connect-fake')
  async connectGmailFake(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.connectFakeIntegration(
      req.user.userId,
      'gmail',
    );
  }

  @ApiOperation({ summary: 'Connect Gmail integration (fake for demo)' })
  @ApiResponse({
    status: 200,
    description: 'Gmail integration connected successfully',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Post('gmail/connect-fake')
  async connectGmailFake(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.connectFakeIntegration(
      req.user.userId,
      'gmail',
    );
  }

  @ApiOperation({ summary: 'Disconnect Gmail integration' })
  @ApiResponse({
    status: 200,
    description: 'Gmail integration disconnected successfully',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Post('gmail/disconnect')
  async disconnectGmail(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.disconnectIntegration(
      req.user.userId,
      'gmail',
    );
  }

  @ApiOperation({ summary: 'Disconnect Slack integration' })
  @ApiResponse({
    status: 200,
    description: 'Slack integration disconnected successfully',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Post('slack/disconnect')
  async disconnectSlack(@Req() req: AuthenticatedRequest) {
    return this.integrationsService.disconnectIntegration(
      req.user.userId,
      'slack',
    );
  }

  @ApiOperation({
    summary: 'Send message to Slack',
    description: 'Send a message to a Slack channel or user via n8n webhook',
  })
  @ApiBody({ type: SendSlackMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully to n8n webhook',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Message sent successfully to Slack via n8n',
        },
        channelType: {
          type: 'string',
          enum: ['user', 'channel'],
          example: 'channel',
        },
        channelId: { type: 'string', example: 'C09DNQMMSPJ' },
        textMessage: { type: 'string', example: 'Hello from ConvoVerse!' },
        webhookResponse: { type: 'string', example: 'OK' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or n8n webhook failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Slack integration not found or invalid token',
  })
  @Post('slack/send-message')
  async sendSlackMessage(@Body() sendMessageDto: SendSlackMessageDto) {
    return this.integrationsService.sendSlackMessage(
      'test-user-id',
      sendMessageDto,
    );
  }
}
