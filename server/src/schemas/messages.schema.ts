import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Message extends Document {
  @Prop()
  platform: string;

  @Prop()
  messageId: string;

  @Prop()
  conversationId: string;

  @Prop()
  userID: string;

  @Prop()
  text: string;

  @Prop()
  sender: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
