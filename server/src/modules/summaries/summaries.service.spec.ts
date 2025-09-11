import { Test, TestingModule } from '@nestjs/testing';
import { SummariesService } from './summaries.service';

describe('SummariesService', () => {
  let service: SummariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SummariesService],
    }).compile();

    service = module.get<SummariesService>(SummariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
