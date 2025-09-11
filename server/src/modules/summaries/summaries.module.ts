import { Module } from '@nestjs/common';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from 'src/schemas/conversations.schema';
import { Message, MessageSchema } from 'src/schemas/messages.schema';
import {
  Integration,
  IntegrationSchema,
} from 'src/schemas/integrations.schema';
import { Summary, SummarySchema } from 'src/schemas/summarys.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Integration.name, schema: IntegrationSchema },
      { name: Summary.name, schema: SummarySchema },
    ]),
  ],
  controllers: [SummariesController],
  providers: [SummariesService, SummariesService],
  exports: [SummariesService],
})
export class SummariesModule {}
