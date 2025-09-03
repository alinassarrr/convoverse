import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum IntegrationProvider {
  SLACK = 'slack',
}

@Schema({ timestamps: true, collection: 'integrations' })
export class Integration extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: IntegrationProvider,
    required: true,
    index: true,
  })
  provider: IntegrationProvider;

  @Prop()
  accessToken?: string;

  @Prop()
  refreshToken?: string;
  @Prop()
  tokenType?: string;
  @Prop()
  scope?: string;
  @Prop()
  expiresAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
