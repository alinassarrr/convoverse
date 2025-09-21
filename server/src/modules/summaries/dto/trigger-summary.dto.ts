import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TriggerSummarizationDto {
  @ApiProperty({
    example: 'conv_12345',
    description: 'The unique ID of the conversation to summarize',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    example: 'slack',
    description: 'The provider of the conversation (e.g., slack)',
  })
  @IsString()
  @IsNotEmpty()
  provider: string;
}
