import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

// Mock IntegrationsService
const mockIntegrationsService = {
  generateGmailAuthUrl: jest.fn(),
  generateSlackAuthUrl: jest.fn(),
  handleSlackCallback: jest.fn(),
  handleGmailCallback: jest.fn(),
  getSlackIntegration: jest.fn(),
  getUserIntegrations: jest.fn(),
  handleSlackSync: jest.fn(),
  handleGmailSync: jest.fn(),
  getUserIntegrationsStatus: jest.fn(),
  connectFakeIntegration: jest.fn(),
  disconnectIntegration: jest.fn(),
  sendSlackMessage: jest.fn(),
  sendGmailMessage: jest.fn(),
};

// Mock JwtService
const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

// Mock AuthGuard
const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('IntegrationsController', () => {
  let controller: IntegrationsController;
  let integrationsService: IntegrationsService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        {
          provide: IntegrationsService,
          useValue: mockIntegrationsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthGuard,
          useValue: mockAuthGuard,
        },
      ],
    }).compile();

    controller = module.get<IntegrationsController>(IntegrationsController);
    integrationsService = module.get<IntegrationsService>(IntegrationsService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have integrationsService injected', () => {
    expect(integrationsService).toBeDefined();
  });

  it('should have jwtService injected', () => {
    expect(jwtService).toBeDefined();
  });
});
