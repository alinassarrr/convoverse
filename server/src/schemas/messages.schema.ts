import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'messages', timestamps: false })
export class Message extends Document {
  @Prop({ required: true })
  provider: string; // 'slack', 'gmail'

  @Prop({ required: true })
  ts: string; // Slack timestamp / message ID

  @Prop({ required: true })
  channel: string; // Channel/conversation ID

  @Prop()
  text: string;

  @Prop()
  user: string; // User/sender ID

  @Prop()
  type: string; // 'message', etc.

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Virtual properties for backward compatibility
  get platform() {
    return this.provider;
  }

  get messageId() {
    return this.ts;
  }

  get conversationId() {
    return this.channel;
  }

  get sender() {
    return this.user;
  }

  // // For date fields, we'll use _id timestamp or add a custom timestamp
  // get createdAt() {
  //   // Extract timestamp from MongoDB ObjectId if no explicit timestamp
  //   return this._id ? new Date(this._id.getTimestamp()) : new Date();
  // }
}

export const MessageSchema = SchemaFactory.createForClass(Message);
