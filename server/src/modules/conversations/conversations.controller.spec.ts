import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

// Mock ConversationsService
const mockConversationsService = {
  listConversations: jest.fn(),
  listMessages: jest.fn(),
};

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let conversationsService: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
    conversationsService = module.get<ConversationsService>(ConversationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have conversationsService injected', () => {
    expect(conversationsService).toBeDefined();
  });
});
