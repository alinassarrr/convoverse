import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackConfig {
  constructor(private readonly configService: ConfigService) {}
  // get used to access as a prop so we can call .clientId
  get clientId() {
    return this.configService.get<string>('slack.clientId');
  }
  get clientSecret() {
    return this.configService.get<string>('slack.clientSecret');
  }
  get redirectUri() {
    return this.configService.get<string>('slack.redirectUri');
  }
}
