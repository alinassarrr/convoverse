import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'conversations', timestamps: false })
export class Conversation extends Document {
  @Prop({ required: true })
  provider: string; // 'slack', 'gmail'

  @Prop({ required: true })
  channel: string; // Channel/conversation ID

  @Prop()
  name?: string; // channel name

  @Prop()
  is_im?: boolean; // true for DMs

  @Prop()
  user?: string; // for DM, the other user ID

  @Prop({ type: Object })
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };

  @Prop({ type: Object })
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  } | null;

  @Prop()
  created?: number; // Unix timestamp

  @Prop()
  updated?: number; // Unix timestamp

  @Prop({ type: [String] })
  shared_team_ids?: string[];

  @Prop()
  last_message_ts?: string; // Timestamp of the last message in this conversation

  // Virtual properties for backward compatibility
  get platform() {
    return this.provider;
  }

  get conversationId() {
    return this.channel;
  }

  get type() {
    return this.is_im ? 'dm' : 'channel';
  }

  get isIm() {
    return this.is_im;
  }

  get isPrivate() {
    // For Slack, we can infer this or add logic based on channel ID patterns
    return this.channel?.startsWith('D'); // DMs start with D in Slack
  }
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
