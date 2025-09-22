export interface Message {
  ts: string;
  text: string;
  sender: {
    id: string;
    name: string;
    display_name?: string;
    avatar?: string;
    email?: string; // Gmail: extracted from user field
  };
  isFromUser: boolean;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  // Gmail-specific fields
  type?: string; // Gmail: Email subject
  user?: string; // Gmail: "Name <email@domain.com>" format
  channel?: string; // Thread/conversation ID
  provider?: "slack" | "whatsapp" | "gmail";
}

export interface Conversation {
  _id: string;
  channel: string;
  name: string;
  is_im: boolean;
  provider: "slack" | "whatsapp" | "gmail";
  description?: string;
  last_message_ts: string;
  lastMessage?: {
    ts: string;
    text: string;
    type?: string; // Gmail: Email subject
  };
  sender?: {
    id: string;
    name: string;
    display_name: string;
    avatar: string;
    email?: string;
  };
  // Gmail-specific fields
  user?: string; // Gmail: "Name <email@domain.com>" format
  created?: number;
  updated?: number;
  purpose?: string | null;
  topic?: string | null;
  shared_team_ids?: string[] | null;
  messages?: Message[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalConversations: number;
    unreadConversations: number;
    totalUnreadMessages: number;
    conversationsByType: {
      channels: number;
      dms: number;
    };
  };
}

export interface ConversationFilters {
  provider?: "slack" | "whatsapp" | "gmail";
  status?: "unread" | "read" | "archived";
  limit?: number;
  offset?: number;
}

export interface Summary {
  _id: string;
  conversationId: string;
  provider: string;
  summaryText: string;
  messageIds: string[];
  lastMessageTs: string;
  status: "pending" | "in_progress" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface ActionAssignee {
  userId: string;
  userName: string;
  role?: "owner" | "collaborator" | "reviewer" | "informed";
  isCurrentUser: boolean;
}

export interface ActionItem {
  title: string;
  description?: string;
  type:
    | "task"
    | "meeting"
    | "deadline"
    | "reminder"
    | "follow_up"
    | "decision"
    | "other";
  importance: "low" | "medium" | "high" | "urgent";
  assignees: ActionAssignee[];
  due_date: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  tags?: string[];
  context?: string;
  isAssignedToMe: boolean;
}
