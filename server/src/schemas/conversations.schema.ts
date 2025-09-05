import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation extends Document {
  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  conversationId: string;

  @Prop()
  userId?: string; // for dm

  @Prop()
  name?: string; // channel name

  @Prop({ enum: ['channel', 'dm'] })
  type: string;

  @Prop()
  isPrivate?: boolean;

  @Prop({ type: [String], default: [] })
  members?: string[]; // user IDs
  @Prop()
  topic?: string;
  @Prop()
  purpose?: string;
  @Prop()
  numMembers?: number;

  @Prop()
  isIm?: boolean;

  @Prop({ required: true })
  userID: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
