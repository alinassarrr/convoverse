import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Embedding extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Message', required: true, unique: true })
  messageId: string;

  @Prop({ type: String, required: true })
  conversationId: string;

  @Prop({ type: String, required: true })
  provider: string;

  @Prop({ type: String, required: true })
  text: string;

  @Prop({ type: String, required: true })
  ts: string;

  @Prop({ type: [Number] })
  embedding: number[];
}

export const EmbeddingSchema = SchemaFactory.createForClass(Embedding);
