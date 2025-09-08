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
import { SlackConfig } from 'src/config/slack.config';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectModel(Integration.name) private IntegrationModel: Model<Integration>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly slackConfig: SlackConfig,
  ) {}

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
  async getSlackIntegration(userId: string) {
    return this.IntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider: IntegrationProvider.SLACK,
    });
  }

  async handleSlackSync(userId: string) {
    const integrated = await this.getSlackIntegration(userId);
    if (!integrated) throw new UnauthorizedException('Slack unauthorized');
    const slackAccessToken = integrated.metadata?.authed_user?.access_token;
    if (!slackAccessToken)
      throw new BadRequestException('Slack access token not found');

    const n8nWebHook =
      'http://localhost:5678/webhook-test/7b2d8bc6-9637-4e1a-9606-9d673fb19158';

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
}
