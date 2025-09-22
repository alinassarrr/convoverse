import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SummariesService } from './summaries.service';
import { Summary } from '../../schemas/summarys.schema';
import { Embedding } from '../../schemas/embeddings.schema';
import { Action } from '../../schemas/action.schema';
import { AiService } from './services/ai.service';
import { MessageProcessorService } from './services/message-processor.service';

// Mock Mongoose models
const mockSummaryModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
  }),
  insertMany: jest.fn(),
};

const mockEmbeddingModel = {
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
  create: jest.fn(),
};

const mockActionModel = {
  insertMany: jest.fn(),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
  }),
  create: jest.fn(),
};

// Mock services
const mockAiService = {
  generateSummaryAndActions: jest.fn(),
};

const mockMessageProcessorService = {
  getChannelsNeedingProcessing: jest.fn().mockResolvedValue([]),
  getEnrichedMessages: jest.fn().mockResolvedValue([]),
  markMessagesAsSummarized: jest.fn(),
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id'),
};

describe('SummariesService', () => {
  let service: SummariesService;
  let summaryModel: typeof mockSummaryModel;
  let embeddingModel: typeof mockEmbeddingModel;
  let actionModel: typeof mockActionModel;
  let aiService: AiService;
  let messageProcessor: MessageProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummariesService,
        {
          provide: getModelToken(Summary.name),
          useValue: mockSummaryModel,
        },
        {
          provide: getModelToken(Embedding.name),
          useValue: mockEmbeddingModel,
        },
        {
          provide: getModelToken(Action.name),
          useValue: mockActionModel,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
        {
          provide: MessageProcessorService,
          useValue: mockMessageProcessorService,
        },
      ],
    }).compile();

    service = module.get<SummariesService>(SummariesService);
    summaryModel = module.get(getModelToken(Summary.name));
    embeddingModel = module.get(getModelToken(Embedding.name));
    actionModel = module.get(getModelToken(Action.name));
    aiService = module.get<AiService>(AiService);
    messageProcessor = module.get<MessageProcessorService>(MessageProcessorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have summaryModel injected', () => {
    expect(summaryModel).toBeDefined();
  });

  it('should have embeddingModel injected', () => {
    expect(embeddingModel).toBeDefined();
  });

  it('should have actionModel injected', () => {
    expect(actionModel).toBeDefined();
  });

  it('should have aiService injected', () => {
    expect(aiService).toBeDefined();
  });

  it('should have messageProcessor injected', () => {
    expect(messageProcessor).toBeDefined();
  });
});
