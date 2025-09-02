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
} from '../../schemas/integration.schema';
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

  getSlackAuthUrl(res: Response, state: string) {
    const clientId = this.configService.get<string>('slack.clientId');
    const redirectUri = this.configService.get<string>('slack.redirectUri');

    if (!clientId || !redirectUri) {
      throw new Error('Slack configuration missing');
    }

    const scopes = 'channels:read chat:write im:read im:write users:read';
    // clientId=slackApp ID / scopes=the premissions / redirect= where slack will send the user back / state=random string stored in DB to protect from CSRF
    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${encodeURIComponent(
      scopes,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return res.redirect(url);
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
  }
}
