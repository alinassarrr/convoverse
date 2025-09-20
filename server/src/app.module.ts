import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config/config';
import { UsersModule } from './modules/users/users.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { SummariesModule } from './modules/summaries/summaries.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GatewaysModule } from './gateways/gateways.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
      }),
      global: true,
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('database.connectionString'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    IntegrationsModule,
    ConversationsModule,
    SummariesModule,
    EmbeddingsModule,
    AiAssistantModule,
    GatewaysModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
