import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SaveSummaryDto {
  @ApiProperty({ example: 'conv_12345' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ example: 'slack' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'This conversation was about project deadlines.' })
  @IsString()
  @IsNotEmpty()
  summaryText: string;

  @ApiProperty({
    type: [String],
    example: ['msg_id_1', 'msg_id_2'],
    description: 'Array of message IDs included in the summary',
  })
  @IsArray()
  @IsString({ each: true })
  messageIds: string[];

  @ApiProperty({
    example: '1757376408.006219',
    description: 'Timestamp of the last message included in the summary',
  })
  @IsString()
  @IsNotEmpty()
  lastMessageTs: string;
}
