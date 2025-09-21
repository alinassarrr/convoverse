import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { MessageRecipientType } from '../../../types/message-recipient.enum';

export class SendSlackMessageDto {
  @ApiProperty({
    description: 'type of message recipient',
    enum: MessageRecipientType,
    example: MessageRecipientType.CHANNEL,
  })
  @IsEnum(MessageRecipientType)
  @IsNotEmpty()
  type: MessageRecipientType;

  @ApiProperty({
    description:
      'The recipient of the message - can be a user ID (e.g., U1234567890) or channel ID (e.g., C1234567890)',
    example: 'C09DNQMMSPJ',
  })
  @IsString()
  @IsNotEmpty()
  sendTo: string;

  @ApiProperty({
    description: 'The message text to send',
    example: 'Hello from ConvoVerse! How is everyone doing?',
  })
  @IsString()
  @IsNotEmpty()
  messageText: string;
}
