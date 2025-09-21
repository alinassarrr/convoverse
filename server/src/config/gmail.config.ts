import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GmailConfig {
  constructor(private configService: ConfigService) {}

  get clientId() {
    return this.configService.get<string>('gmail.clientId');
  }
  get clientSecret() {
    return this.configService.get<string>('gmail.clientSecret');
  }
  get redirectUri() {
    return this.configService.get<string>('gmail.redirectUri');
  }
}
