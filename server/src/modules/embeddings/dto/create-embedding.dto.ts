import { IsString, IsArray } from 'class-validator';

export class CreateEmbeddingDto {
  @IsString()
  messageId: string;

  @IsString()
  conversationId: string;

  @IsString()
  text: string;

  @IsString()
  provider: string;

  @IsString()
  ts: string;
}
