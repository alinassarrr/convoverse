import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class N8nConfig {
  constructor(private configService: ConfigService) {}

  get baseUrl(): string {
    return (
      this.configService.get<string>('N8N_BASE_URL') || 'http://localhost:5678'
    );
  }

  get syncWebhookUrl(): string {
    return `${this.baseUrl}/webhook/7b2d8bc6-9637-4e1a-9606-9d673fb19158`;
  }

  get sendMessageWebhookUrl(): string {
    return (
      this.configService.get<string>('N8N_SEND_MESSAGE_WEBHOOK_URL') ||
      `${this.baseUrl}/webhook/send-slack-message`
    );
  }
}
