import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import {
  Integration,
  IntegrationProvider,
} from '../../schemas/integrations.schema';
import { SlackTokenResponseDTO } from './dto/slack-token-response.dto';
import { SendSlackMessageDto } from './dto/send-slack-message.dto';
import { SlackConfig } from 'src/config/slack.config';
import { GmailConfig } from 'src/config/gmail.config';
import { N8nConfig } from 'src/config/n8n.config';
import { MessageRecipientType } from 'src/types/message-recipient.enum';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectModel(Integration.name) private IntegrationModel: Model<Integration>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly slackConfig: SlackConfig,
    private readonly gmailConfig: GmailConfig,
    private readonly n8nConfig: N8nConfig,
  ) {}

  generateGmailAuthUrl(userId: string): string {
    const secret = this.configService.get<string>('jwt.secret');
    console.log('Generating Gmail state token for userId:', userId);

    const payload = { userId };
    const state = this.jwtService.sign(payload, { secret, expiresIn: '1h' });

    const clientId = this.gmailConfig.clientId;
    const redirectUri = this.gmailConfig.redirectUri;

    if (!clientId || !redirectUri) {
      throw new Error('Gmail configuration missing');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
      'https://www.googleapis.com/auth/gmail.addons.current.message.action',
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
    ].join(' ');

    const authUrl =
      'https://accounts.google.com/v3/signin/accountchooser?access_type=offline&client_id=1090717084294-bn8lgskqv5vjnik5kk12edg1eqn7lq8h.apps.googleusercontent.com&prompt=consent&redirect_uri=http%3A%2F%2Flocalhost%3A5678%2Frest%2Foauth2-credential%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.labels+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.addons.current.action.compose+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.addons.current.message.action+https%3A%2F%2Fmail.google.com%2F+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.compose&state=eyJ0b2tlbiI6IlF3R1ZTdXBPLTU2TWQwSE5ERGxaVlQxdlZ2d0dyLXZBNDVXZyIsImNpZCI6Im9SVEgwNnh3d3lWb0ZoV1MiLCJjcmVhdGVkQXQiOjE3NTg0Mjc1OTI5NDl9&dsh=S303935210%3A1758427593751683&o2v=2&service=lso&flowName=GeneralOAuthFlow&opparams=%253F&continue=https%3A%2F%2Faccounts.google.com%2Fsignin%2Foauth%2Fconsent%3Fauthuser%3Dunknown%26part%3DAJi8hAPrlyyhLAcvunUzCUYhK-9qzGANqFZVIhBsjZOXk_MmrgnG8LNdmL4mK8ryn0VbxJX-mfN4q8jqTDiqqSGPGfNNVjxkWnXmRMLTP47TqlpQfciWNwmdSCQTPob62PT8q0YuKlwxZyf95YYSzhJbUcNdwH_v5jAS5ZSfzwhlUIx-ViBxwcrrqJAA2BKkm9r8q8ineWOw3nxxWs2_dZc0R9HQLr_fKPlRmI267bjYCgA2z-9G3ygZmYDYD2b-xXxypBzYkz3FD4m8Y7OFG21pQHsgM-Wbofxvs2d0Bubue4mlg0Qlkwl6gBUb5NoJ9jIiHYTgp5v54wPTjkAdJxIvRJ00fAi6d6HAHeaZNfgTwyz8Zy5XK4MbzEjMIZQMx3J57Q-5sEUHL2lAUXJgow8V_tIshYR3ql_-3bLhkekhdq325rztlUT1IXO0bQ-UGRIXkh4YtmHzCiyfvL4w1DLiF-zoLHLoiAZ2uSgFJMj63pzj985EGWg%26flowName%3DGeneralOAuthFlow%26as%3DS303935210%253A1758427593751683%26client_id%3D1090717084294-bn8lgskqv5vjnik5kk12edg1eqn7lq8h.apps.googleusercontent.com%23&app_domain=http%3A%2F%2Flocalhost%3A5678';

    return authUrl;
  }

  generateSlackAuthUrl(userId: string): string {
    const secret = this.configService.get<string>('jwt.secret');
    console.log('Generating state token for userId:', userId);
    console.log('Secret length:', secret?.length);

    const payload = { userId };
    console.log('JWT payload:', JSON.stringify(payload, null, 2));

    const state = this.jwtService.sign(payload, { secret, expiresIn: '1h' });
    console.log('Generated state token:', state.substring(0, 50) + '...');

    const clientId = this.configService.get<string>('slack.clientId');
    const redirectUri = this.configService.get<string>('slack.redirectUri');

    if (!clientId || !redirectUri) {
      throw new Error('Slack configuration missing');
    }

    const userScopes =
      'channels:history chat:write im:history im:write users:read';

    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${encodeURIComponent(
      userScopes,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  async handleSlackCallback(code: string, state: string) {
    // verify token (state)
    let decoded: { userId?: string }; //declare a obj to save the userId after verify
    try {
      const secret = this.configService.get<string>('jwt.secret');
      console.log('Verifying state token:', state.substring(0, 50) + '...');
      console.log('Using secret length:', secret?.length);

      decoded = this.jwtService.verify(state, { secret });
      console.log('Decoded JWT payload:', JSON.stringify(decoded, null, 2));

      if (!decoded?.userId) {
        console.error('JWT payload missing userId:', decoded);
        throw new UnauthorizedException('Invalid state token');
      }
      console.log('JWT verification successful, userId:', decoded.userId);
    } catch (error) {
      console.error('JWT verification error:', error.message);
      console.error('Error details:', error);
      throw new UnauthorizedException('Invalid or expired state token');
    }

    const clientId = this.slackConfig.clientId;
    const clientSecret = this.slackConfig.clientSecret;
    const redirectUri = this.slackConfig.redirectUri;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Slack configuration missing');
    }

    // exchange code for access token
    const response = await axios.post<SlackTokenResponseDTO>(
      'https://slack.com/api/oauth.v2.access', // the endpoint to do the exchange
      null, // place holder for the body we need it null
      {
        params: {
          // obj that will be serialized into the query param
          code, // that will be exchanged to get the token
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        },
      },
    );

    if (!response.data.ok) {
      throw new Error(
        'Failed to exchange code for token: ' + response.data.error,
      );
    }
    console.log(response.data);

    const { access_token, refresh_token, team, authed_user, scope } =
      response.data;
    // store in database
    const userId = new Types.ObjectId(decoded.userId); // verified it was a request from user prevent CSRF

    const integration = await this.IntegrationModel.findOneAndUpdate(
      { userId, provider: IntegrationProvider.SLACK },
      {
        $set: {
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenType: 'Bearer',
          scope,
          metadata: {
            team: team || {},
            authed_user: authed_user || {},
          },
        },
      },
      { upsert: true, new: true },
    );

    return {
      message: 'Slack account connected successfully!',
      integrationId: integration._id,
      team: team || {},
      user: authed_user || {},
    };
  }

  async handleGmailCallback(code: string, state: string) {
    // Verify token (state)
    let decoded: { userId?: string };
    try {
      const secret = this.configService.get<string>('jwt.secret');
      console.log(
        'Verifying Gmail state token:',
        state.substring(0, 50) + '...',
      );

      decoded = this.jwtService.verify(state, { secret });
      console.log(
        'Decoded Gmail JWT payload:',
        JSON.stringify(decoded, null, 2),
      );

      if (!decoded?.userId) {
        console.error('Gmail JWT payload missing userId:', decoded);
        throw new UnauthorizedException('Invalid state token');
      }
      console.log('Gmail JWT verification successful, userId:', decoded.userId);
    } catch (error) {
      console.error('Gmail JWT verification error:', error.message);
      throw new UnauthorizedException('Invalid or expired state token');
    }

    const clientId = this.gmailConfig.clientId;
    const clientSecret = this.gmailConfig.clientSecret;
    const redirectUri = this.gmailConfig.redirectUri;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Gmail OAuth configuration missing');
    }

    // Exchange code for access token
    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, refresh_token, expires_in, scope, token_type } =
        response.data;

      // Get user profile information
      const profileResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const userProfile = profileResponse.data;

      // Store in database
      const userId = new Types.ObjectId(decoded.userId);
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      const integration = await this.IntegrationModel.findOneAndUpdate(
        { userId, provider: IntegrationProvider.GMAIL },
        {
          $set: {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenType: token_type || 'Bearer',
            scope,
            expiresAt,
            metadata: {
              userProfile,
              connectedAt: new Date(),
            },
          },
        },
        { upsert: true, new: true },
      );

      return {
        message: 'Gmail account connected successfully!',
        integrationId: integration._id,
        userProfile,
      };
    } catch (error) {
      console.error(
        'Gmail token exchange error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        'Failed to exchange code for Gmail access token: ' +
          (error.response?.data?.error_description || error.message),
      );
    }
  }
  async getSlackIntegration(userId: string) {
    return this.IntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider: IntegrationProvider.SLACK,
    });
  }

  async getUserIntegrations(userId: string) {
    return this.IntegrationModel.find({
      userId: new Types.ObjectId(userId),
    })
      .lean()
      .exec();
  }

  async handleSlackSync(userId: string) {
    const integrated = await this.getSlackIntegration(userId);
    if (!integrated) throw new UnauthorizedException('Slack unauthorized');
    const slackAccessToken = integrated.metadata?.authed_user?.access_token;
    if (!slackAccessToken)
      throw new BadRequestException('Slack access token not found');

    const n8nWebHook =
      'http://localhost:5678/webhook/7b2d8bc6-9637-4e1a-9606-9d673fb19158';

    try {
      const webhookPayload = {
        userId,
        slackAccessToken,
        authorizationHeader: `Bearer ${slackAccessToken}`,
        slackApiUrl: 'https://slack.com/api/conversations.list',
        team: integrated.metadata?.team,
        scopes: integrated.metadata?.authed_user?.scope,
        timestamp: new Date().toISOString(),
      };

      console.log('Sending to n8n webhook:', {
        userId,
        tokenPrefix: slackAccessToken.substring(0, 12) + '...',
        scopes: integrated.metadata?.authed_user?.scope,
      });

      await axios.post(n8nWebHook, webhookPayload);
      return {
        success: true,
        message: 'n8n webhook triggered successfully',
        tokenSent: slackAccessToken.substring(0, 12) + '...',
        scopes: integrated.metadata?.authed_user?.scope,
      };
    } catch (error) {
      console.error('n8n webhook error:', error.message);
      throw new BadRequestException(`Failed to trigger n8n: ${error.message}`);
    }
  }

  async handleGmailSync() {
    const n8nGmailWebHook =
      'http://localhost:5678/webhook/4ad0cbb1-1db7-4323-940d-0bf77430cdc2';

    try {
      const webhookPayload = {
        provider: 'gmail',
        timestamp: new Date().toISOString(),
      };

      console.log('Sending Gmail sync to n8n webhook');
      await axios.post(n8nGmailWebHook, webhookPayload);

      return {
        success: true,
        message: 'Gmail sync webhook triggered successfully',
      };
    } catch (error) {
      console.error('Gmail sync webhook error:', error.message);
      throw new BadRequestException(
        `Failed to trigger Gmail sync: ${error.message}`,
      );
    }
  }

  async getUserIntegrationsStatus(userId: string) {
    const integrations = await this.getUserIntegrations(userId);

    const status = {
      slack: false,
      whatsapp: false,
      gmail: false,
    };

    integrations.forEach((integration) => {
      if (integration.provider === IntegrationProvider.SLACK) {
        status.slack = true;
      } else if (integration.provider === IntegrationProvider.WHATSAPP) {
        status.whatsapp = true;
      } else if (integration.provider === IntegrationProvider.GMAIL) {
        status.gmail = true;
      }
    });

    return { status, integrations };
  }

  async connectFakeIntegration(userId: string, provider: 'whatsapp' | 'gmail') {
    const providerEnum =
      provider === 'whatsapp'
        ? IntegrationProvider.WHATSAPP
        : IntegrationProvider.GMAIL;

    const integration = await this.IntegrationModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), provider: providerEnum },
      {
        $set: {
          accessToken: `fake_${provider}_token_${Date.now()}`,
          tokenType: 'Bearer',
          scope:
            provider === 'whatsapp'
              ? 'messages:read messages:write'
              : 'gmail.readonly gmail.send',
          metadata: {
            connected: true,
            connectedAt: new Date(),
            fake: true,
            provider: provider,
          },
        },
      },
      { upsert: true, new: true },
    );

    return {
      success: true,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully!`,
      provider: provider,
      integrationId: integration._id,
      fake: true,
    };
  }

  async disconnectIntegration(
    userId: string,
    provider: 'whatsapp' | 'gmail' | 'slack',
  ) {
    let providerEnum: IntegrationProvider;

    switch (provider) {
      case 'slack':
        providerEnum = IntegrationProvider.SLACK;
        break;
      case 'whatsapp':
        providerEnum = IntegrationProvider.WHATSAPP;
        break;
      case 'gmail':
        providerEnum = IntegrationProvider.GMAIL;
        break;
    }

    const result = await this.IntegrationModel.deleteOne({
      userId: new Types.ObjectId(userId),
      provider: providerEnum,
    });

    return {
      success: true,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected successfully!`,
      deleted: result.deletedCount > 0,
    };
  }

  /**
   * Send a message to Slack via n8n webhook
   */
  async sendSlackMessage(userId: string, messageDto: SendSlackMessageDto) {
    // n8n webhook URL for sending messages
    const n8nSendMessageWebhook =
      'http://localhost:5678/webhook/ab785a89-ae51-4fc8-8af2-5732df7a318e';

    try {
      const webhookPayload = {
        channelType: messageDto.type,
        channelId: messageDto.sendTo,
        textMessage: messageDto.messageText,
      };

      const response = await axios.post(n8nSendMessageWebhook, webhookPayload, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(
        'n8n webhook response:',
        response.status,
        response.statusText,
      );

      return {
        success: true,
        message: 'Message sent successfully to Slack via n8n',
        channelType: messageDto.type as MessageRecipientType,
        channelId: messageDto.sendTo,
        textMessage: messageDto.messageText,
        webhookResponse: response.data || 'OK',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error sending message to n8n webhook:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        userId,
        channelId: messageDto.sendTo,
        webhookUrl: n8nSendMessageWebhook,
      });

      if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException(
          'n8n service is not available. Please check if n8n is running on localhost:5678',
        );
      }

      if (error.code === 'ENOTFOUND') {
        throw new BadRequestException(
          'Cannot reach n8n service. Please check the webhook URL.',
        );
      }

      throw new BadRequestException(
        `Failed to send message to n8n: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}
