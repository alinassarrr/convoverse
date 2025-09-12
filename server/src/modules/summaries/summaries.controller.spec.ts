import { Test, TestingModule } from '@nestjs/testing';
import { SummariesController } from './summaries.controller';

describe('SummariesController', () => {
  let controller: SummariesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummariesController],
    }).compile();

    controller = module.get<SummariesController>(SummariesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
