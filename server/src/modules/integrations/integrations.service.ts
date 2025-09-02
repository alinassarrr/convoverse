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
}
