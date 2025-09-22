import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConversationsService } from './conversations.service';
import { Conversation } from '../../schemas/conversations.schema';
import { Message } from '../../schemas/messages.schema';
import { Integration } from '../../schemas/integrations.schema';

// Mock Mongoose models
const mockConversationModel = {
  aggregate: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  exec: jest.fn(),
};

const mockMessageModel = {
  aggregate: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  exec: jest.fn(),
};

const mockIntegrationModel = {
  findOne: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      provider: 'slack',
      metadata: {
        authed_user: { id: 'test-user-id' }
      }
    })
  }),
  find: jest.fn(),
  create: jest.fn(),
};

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationModel: typeof mockConversationModel;
  let messageModel: typeof mockMessageModel;
  let integrationModel: typeof mockIntegrationModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getModelToken(Conversation.name),
          useValue: mockConversationModel,
        },
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: getModelToken(Integration.name),
          useValue: mockIntegrationModel,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    conversationModel = module.get(getModelToken(Conversation.name));
    messageModel = module.get(getModelToken(Message.name));
    integrationModel = module.get(getModelToken(Integration.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have conversationModel injected', () => {
    expect(conversationModel).toBeDefined();
  });

  it('should have messageModel injected', () => {
    expect(messageModel).toBeDefined();
  });

  it('should have integrationModel injected', () => {
    expect(integrationModel).toBeDefined();
  });
});
