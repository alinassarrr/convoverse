export interface ProcessedMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  ts: string;
}

export interface RagContext {
  text: string;
}

export interface GeneratedSummary {
  summary: string;
  actions: ActionItem[];
}

export interface ActionAssignee {
  userId: string;
  userName: string;
  role?: 'owner' | 'collaborator' | 'reviewer' | 'informed';
  isCurrentUser: boolean;
}

export interface ActionItem {
  title: string;
  description?: string;
  type:
    | 'task'
    | 'meeting'
    | 'deadline'
    | 'reminder'
    | 'follow_up'
    | 'decision'
    | 'other';
  importance: 'low' | 'medium' | 'high' | 'urgent';
  assignees: ActionAssignee[];
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags?: string[];
  context?: string; // original message context
  isAssignedToMe: boolean;
  createdFromMessage?: string;
}
