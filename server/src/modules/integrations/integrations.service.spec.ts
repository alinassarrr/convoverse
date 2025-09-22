import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { IntegrationsService } from './integrations.service';
import { Integration } from '../../schemas/integrations.schema';
import { SlackConfig } from '../../config/slack.config';
import { GmailConfig } from '../../config/gmail.config';
import { N8nConfig } from '../../config/n8n.config';

// Mock dependencies
const mockIntegrationModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockSlackConfig = {
  clientId: 'test-slack-client-id',
  clientSecret: 'test-slack-client-secret',
  redirectUri: 'http://localhost:3000/auth/slack/callback',
};

const mockGmailConfig = {
  clientId: 'test-gmail-client-id',
  clientSecret: 'test-gmail-client-secret',
  redirectUri: 'http://localhost:3000/auth/gmail/callback',
};

const mockN8nConfig = {
  webhookUrl: 'http://localhost:5678/webhook/test',
};

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let integrationModel: typeof mockIntegrationModel;
  let jwtService: JwtService;
  let configService: ConfigService;
  let slackConfig: SlackConfig;
  let gmailConfig: GmailConfig;
  let n8nConfig: N8nConfig;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: getModelToken(Integration.name),
          useValue: mockIntegrationModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SlackConfig,
          useValue: mockSlackConfig,
        },
        {
          provide: GmailConfig,
          useValue: mockGmailConfig,
        },
        {
          provide: N8nConfig,
          useValue: mockN8nConfig,
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    integrationModel = module.get(getModelToken(Integration.name));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    slackConfig = module.get<SlackConfig>(SlackConfig);
    gmailConfig = module.get<GmailConfig>(GmailConfig);
    n8nConfig = module.get<N8nConfig>(N8nConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have integrationModel injected', () => {
    expect(integrationModel).toBeDefined();
  });

  it('should have jwtService injected', () => {
    expect(jwtService).toBeDefined();
  });

  it('should have configService injected', () => {
    expect(configService).toBeDefined();
  });

  it('should have slackConfig injected', () => {
    expect(slackConfig).toBeDefined();
  });

  it('should have gmailConfig injected', () => {
    expect(gmailConfig).toBeDefined();
  });

  it('should have n8nConfig injected', () => {
    expect(n8nConfig).toBeDefined();
  });
});
