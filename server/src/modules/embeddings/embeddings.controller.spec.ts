import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingsController } from './embeddings.controller';

describe('EmbeddingsController', () => {
  let controller: EmbeddingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmbeddingsController],
    }).compile();

    controller = module.get<EmbeddingsController>(EmbeddingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
