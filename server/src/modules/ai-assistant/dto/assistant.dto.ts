import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsIn } from 'class-validator';

export class AskAssistantDto {
  @ApiProperty({
    description: 'The question or query to ask the AI assistant',
    example: 'What are the recent updates?',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'Optional conversation session ID for maintaining context',
    example: 'conv_abc123',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class AssistantResponseDto {
  @ApiProperty({
    description: "The AI assistant's answer to the user's question",
    example: 'Based on the available information, here is what I found...',
  })
  answer: string;

  @ApiProperty({
    description: 'Sources used to generate the answer',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['action', 'summary', 'message'],
          description: 'Type of data source',
        },
        content: {
          type: 'string',
          description: 'Content excerpt from the source',
        },
        relevance: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Relevance score (0-1)',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata about the source',
        },
      },
    },
  })
  sources: Array<{
    type: 'message' | 'action' | 'summary';
    content: string;
    relevance: number;
    metadata?: any;
  }>;

  @ApiProperty({
    description: 'Confidence level of the answer (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  confidence: number;

  @ApiProperty({
    description: 'Brief explanation of how the AI arrived at the answer',
    example:
      'Found relevant information from multiple sources and cross-referenced the data',
    required: false,
  })
  reasoning?: string;

  @ApiProperty({
    description: 'Session ID for conversation continuity',
    example: 'conv_abc123',
    required: false,
  })
  sessionId?: string;
}
