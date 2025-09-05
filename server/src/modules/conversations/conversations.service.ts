import { BadRequestException, Injectable } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation } from 'src/schemas/conversations.schema';
import { Model } from 'mongoose';
import { Message } from 'src/schemas/messages.schema';
import { SlackApiService } from 'src/common/slack.api.service';

@Injectable()
export class ConversationsService {}
