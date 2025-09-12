import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Summary extends Document {
  @Prop({ required: true })
  conversationId: string;
  @Prop({ required: true })
  provider: string;
  @Prop()
  summaryText: string;
  @Prop([String])
  messageIds: string[];
  @Prop()
  lastMessageTs: string;
  @Prop({
    type: String,
    enum: ['pending', 'in_progress', 'done', 'failed'],
    default: 'pending',
  })
  status: string;
}

export const SummarySchema = SchemaFactory.createForClass(Summary);
// one summary per conversation
SummarySchema.index(
  { conversationId: 1, lastMessaeTs: -1 },
  { unique: true, sparse: true },
);
