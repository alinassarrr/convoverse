import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import {
  Integration,
  IntegrationSchema,
} from '../../schemas/integration.schema';
import { SlackConfig } from 'src/config/slackConfig';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Integration.name, schema: IntegrationSchema },
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, SlackConfig],
})
export class IntegrationsModule {}
