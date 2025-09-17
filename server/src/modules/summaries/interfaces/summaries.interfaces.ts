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
  calendar: CalendarEvent | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags?: string[];
  context?: string; // original message context
  isAssignedToMe: boolean;
  createdFromMessage?: string;
}

export interface CalendarEvent {
  start: string;
  end: string;
  attendees: string[];
}

export interface ProcessingResult {
  status: 'success' | 'failed' | 'no new messages';
  error?: string;
  summary?: any;
}

export interface ChannelProcessingStatus {
  channel: string;
  provider: string;
  pendingCount: number;
  oldestAgeMinutes: number;
  shouldProcess: boolean;
}

export interface UserProfile {
  id: string;
  profile?: {
    real_name?: string;
  };
}

export interface SlackIntegration {
  provider: string;
  metadata?: {
    authed_user?: {
      id: string;
    };
  };
}
