export type SlackConversation = {
  id: string;
  name?: string;
  is_im?: boolean;
  is_private?: boolean;
  user?: string;
  members?: string[];
  topic?: { value?: string };
  purpose?: { value?: string };
  num_members?: number;
};

export type SlackConversationsListResponse = {
  ok: boolean;
  channels: SlackConversation[];
  response_metadata?: { next_cursor?: string };
};
export interface SlackMessage {
  ts: string;
  text?: string;
  user?: string;
  // keep rest as unknown to avoid `any`
  [key: string]: unknown;
}

export interface SlackConversationHistoryResponse {
  ok: boolean;
  messages: SlackMessage[];
  response_metadata?: { next_cursor?: string };
}
