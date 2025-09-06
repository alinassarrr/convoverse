import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Platform identifier',
    example: 'slack',
    enum: ['slack', 'discord', 'teams'],
  })
  @IsString()
  platform: string;

  @ApiProperty({
    description: 'Unique conversation identifier from the platform',
    example: 'C1234567890',
  })
  @IsString()
  conversationId: string;

  @ApiProperty({
    description: 'Conversation name',
    example: 'general',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Type of conversation',
    example: 'channel',
    enum: ['channel', 'dm'],
  })
  @IsEnum(['channel', 'dm'])
  type: string;

  @ApiProperty({
    description: 'Whether this is a direct message',
    example: false,
  })
  @IsBoolean()
  isIm: boolean;

  @ApiProperty({
    description: 'Whether the conversation is private',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty({
    description: 'List of member user IDs',
    example: ['U1234567890', 'U0987654321'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  members?: string[];

  @ApiProperty({
    description: 'Conversation topic',
    example: 'General discussion',
    required: false,
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({
    description: 'Conversation purpose',
    example: 'Team announcements',
    required: false,
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({
    description: 'Number of members',
    example: 15,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  numMembers?: number;

  @ApiProperty({
    description: 'Other participant in DM',
    example: 'U1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
