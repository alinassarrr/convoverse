import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import {
  Integration,
  IntegrationSchema,
} from '../../schemas/integrations.schema';
import { SlackConfig } from 'src/config/slack.config';
import { N8nConfig } from 'src/config/n8n.config';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Integration.name, schema: IntegrationSchema },
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, SlackConfig, N8nConfig],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
