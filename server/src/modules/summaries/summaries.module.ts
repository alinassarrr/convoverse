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
import { Embedding, EmbeddingSchema } from 'src/schemas/embeddings.schema';
import { Action, ActionSchema } from 'src/schemas/action.schema';
import { AiService } from './services/ai.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { MessageProcessorService } from './services/message-processor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Integration.name, schema: IntegrationSchema },
      { name: Summary.name, schema: SummarySchema },
      { name: Embedding.name, schema: EmbeddingSchema },
      { name: Action.name, schema: ActionSchema },
    ]),
  ],
  controllers: [SummariesController],
  providers: [
    SummariesService,
    AiService,
    RateLimiterService,
    MessageProcessorService,
  ],
  exports: [SummariesService],
})
export class SummariesModule {}
