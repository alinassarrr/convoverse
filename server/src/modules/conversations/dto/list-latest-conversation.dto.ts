import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class ListLatestConversationDto {
  @ApiPropertyOptional({
    description: 'Filter by provider',
    enum: ['slack', 'whatsapp', 'gmail'],
  })
  @IsOptional()
  @IsIn(['slack', 'whatsapp', 'gmail'])
  provider?: 'slack' | 'whatsapp' | 'gmail';

  @ApiPropertyOptional({
    description: 'Max number of conversations to return',
    default: 15,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  limit?: number = 15;
}
