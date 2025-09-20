import { Controller, Post, Body } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @ApiOperation({ summary: 'Create an embedding from text' })
  @ApiResponse({ status: 201, description: 'The embedding has been created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  @Post()
  async create(@Body() dto: CreateEmbeddingDto) {
    return this.embeddingsService.create(dto);
  }
}
