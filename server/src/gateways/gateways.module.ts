import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { DatabaseWatcherService } from '../services/database-watcher.service';
import { Message, MessageSchema } from '../schemas/messages.schema';
import { Conversation, ConversationSchema } from '../schemas/conversations.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  providers: [ChatGateway, DatabaseWatcherService],
  exports: [ChatGateway, DatabaseWatcherService],
})
export class GatewaysModule {}
