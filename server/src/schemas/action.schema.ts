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
