import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import {
  Conversation,
  ConversationSchema,
} from 'src/schemas/conversations.schema';
import { Message, MessageSchema } from 'src/schemas/messages.schema';
import { IntegrationsModule } from '../integrations/integrations.module';
import { SlackApiService } from 'src/common/slack.api.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    IntegrationsModule,
    HttpModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, SlackApiService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
