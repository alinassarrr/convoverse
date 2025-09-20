import { ApiProperty } from '@nestjs/swagger';
import { ActionItem, ActionAssignee } from '../interfaces/summaries.interfaces';

export class ActionAssigneeResponseDto {
  @ApiProperty({
    description: 'User ID of the assignee',
    example: 'U1234567890',
  })
  userId: string;

  @ApiProperty({
    description: 'Display name of the assignee',
    example: 'John Doe',
  })
  userName: string;

  @ApiProperty({
    description: 'Role of the assignee in this action',
    enum: ['owner', 'collaborator', 'reviewer', 'informed'],
    example: 'owner',
  })
  role?: 'owner' | 'collaborator' | 'reviewer' | 'informed';

  @ApiProperty({
    description: 'Whether this assignee is the current user',
    example: true,
  })
  isCurrentUser: boolean;
}

export class ActionItemResponseDto {
  @ApiProperty({
    description: 'Title of the action item',
    example: 'Complete project proposal',
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the action',
    example:
      'Write and submit the Q1 project proposal including budget and timeline',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Type of action',
    enum: [
      'task',
      'meeting',
      'deadline',
      'reminder',
      'follow_up',
      'decision',
      'other',
    ],
    example: 'task',
  })
  type:
    | 'task'
    | 'meeting'
    | 'deadline'
    | 'reminder'
    | 'follow_up'
    | 'decision'
    | 'other';

  @ApiProperty({
    description: 'Importance level of the action',
    enum: ['low', 'medium', 'high', 'urgent'],
    example: 'high',
  })
  importance: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({
    description: 'List of people assigned to this action',
    type: [ActionAssigneeResponseDto],
  })
  assignees: ActionAssigneeResponseDto[];

  @ApiProperty({
    description: 'Due date in ISO8601 format',
    example: '2025-09-20T15:00:00Z',
    required: false,
  })
  due_date: string | null;

  @ApiProperty({
    description: 'Current status of the action',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    example: 'pending',
  })
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @ApiProperty({
    description: 'Tags associated with this action',
    example: ['urgent', 'project', 'proposal'],
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description: 'Original message context that created this action',
    example: 'We need to get the proposal ready by Friday',
    required: false,
  })
  context?: string;

  @ApiProperty({
    description: 'Whether this action is assigned to the current user',
    example: true,
  })
  isAssignedToMe: boolean;
}
