import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ActionAssignee {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ enum: ['owner', 'collaborator', 'reviewer', 'informed'] })
  role?: string;

  @Prop({ default: false })
  isCurrentUser: boolean;
}

const ActionAssigneeSchema = SchemaFactory.createForClass(ActionAssignee);

@Schema({ timestamps: true })
export class Action extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: [
      'task',
      'meeting',
      'deadline',
      'reminder',
      'follow_up',
      'decision',
      'other',
    ],
  })
  type: string;

  @Prop({
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  importance: string;

  @Prop({ type: [ActionAssigneeSchema], default: [] })
  assignees: ActionAssignee[];

  @Prop()
  due_date?: Date;

  @Prop({
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  context?: string;

  @Prop({ default: false })
  isAssignedToMe: boolean;

  @Prop()
  createdFromMessage?: string;

  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true })
  provider: string;

  @Prop()
  summaryId?: string;
}

export const ActionSchema = SchemaFactory.createForClass(Action);
