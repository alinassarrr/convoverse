import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { AiAssistantController } from './controllers/ai-assistant.controller';

// Services
import { AiAssistantService } from './services/ai-assistant.service';
import { VectorSearchService } from './services/vector-search.service';
import { ContextBuilderService } from './services/context-builder.service';
import { ConversationMemoryService } from './services/conversation-memory.service';
import { SecurityService } from './services/security.service';

// Import schemas
import { Summary, SummarySchema } from '../../schemas/summarys.schema';
import { Action, ActionSchema } from '../../schemas/action.schema';
import { Embedding, EmbeddingSchema } from '../../schemas/embeddings.schema';
import { Message, MessageSchema } from '../../schemas/messages.schema';

// Import dependent modules
import { SummariesModule } from '../summaries/summaries.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Summary.name, schema: SummarySchema },
      { name: Action.name, schema: ActionSchema },
      { name: Embedding.name, schema: EmbeddingSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    // Import the SummariesModule to access AiService
    SummariesModule,
  ],
  controllers: [AiAssistantController],
  providers: [
    AiAssistantService,
    VectorSearchService,
    ContextBuilderService,
    ConversationMemoryService,
    SecurityService,
  ],
  exports: [
    // Export services so they can be used in other modules if needed
    AiAssistantService,
    VectorSearchService,
    ContextBuilderService,
    ConversationMemoryService,
  ],
})
export class AiAssistantModule {}
