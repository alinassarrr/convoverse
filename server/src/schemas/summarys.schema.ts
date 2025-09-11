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
  // when to run the next summary
  @Prop({ type: Date, default: null }) scheduledAt: Date | null;
}

export const SummarySchema = SchemaFactory.createForClass(Summary);
