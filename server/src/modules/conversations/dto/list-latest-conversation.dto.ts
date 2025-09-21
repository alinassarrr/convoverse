import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class ListLatestConversationDto {
  @ApiPropertyOptional({
    description: 'Filter by provider',
    enum: ['slack', 'gmail'],
  })
  @IsOptional()
  @IsIn(['slack', 'gmail'])
  provider?: 'slack' | 'gmail';

  @ApiPropertyOptional({
    description: 'Max number of conversations to return',
    default: null,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) => {
    const v = Array.isArray(value) ? value[0] : value;
    if (v === undefined || v === null || v === '') return 15;
    const n = Number(v);
    return Number.isFinite(n) ? n : v; // keep invalid to trigger IsInt message
  })
  @IsOptional()
  limit?: number = 50;
}
