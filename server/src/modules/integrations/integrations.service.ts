import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Response } from 'express';
import axios from 'axios';
import {
  Integration,
  IntegrationProvider,
} from '../../schemas/integrations.schema';
import { SlackTokenResponseDTO } from './dto/slack-token-response.dto';
import { SlackConfig } from 'src/config/slackConfig';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectModel(Integration.name) private IntegrationModel: Model<Integration>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly slackConfig: SlackConfig,
  ) {}

  generateSlackAuthUrl(userId: string): string {
    const state = this.jwtService.sign({ userId }, { expiresIn: '1h' });
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
      decoded = this.jwtService.verify(state);
      if (!decoded?.userId) {
        throw new UnauthorizedException('Invalid state token');
      }
    } catch {
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
}
