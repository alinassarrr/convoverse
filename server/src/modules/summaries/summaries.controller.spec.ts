import { Test, TestingModule } from '@nestjs/testing';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

// Mock SummariesService
const mockSummariesService = {
  triggerSummarization: jest.fn(),
  saveSummary: jest.fn(),
  getLatestSummary: jest.fn(),
  getConversationActions: jest.fn(),
  getConversationOverview: jest.fn(),
  scheduledCheck: jest.fn(),
};

describe('SummariesController', () => {
  let controller: SummariesController;
  let summariesService: SummariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummariesController],
      providers: [
        {
          provide: SummariesService,
          useValue: mockSummariesService,
        },
      ],
    }).compile();

    controller = module.get<SummariesController>(SummariesController);
    summariesService = module.get<SummariesService>(SummariesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have summariesService injected', () => {
    expect(summariesService).toBeDefined();
  });
});
