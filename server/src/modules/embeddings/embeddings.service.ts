import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Embedding } from 'src/schemas/embeddings.schema';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingsService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectModel(Embedding.name) private embeddingModelDB: Model<Embedding>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'text-embedding-004',
      });

      const result = await model.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding returned from Google API');
      }

      return result.embedding.values;
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async create(createEmbeddingDto: CreateEmbeddingDto): Promise<Embedding> {
    const embedding = await this.generateEmbedding(createEmbeddingDto.text);

    return this.embeddingModelDB.findOneAndUpdate(
      { messageId: createEmbeddingDto.messageId },
      {
        ...createEmbeddingDto,
        embedding,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }
}
