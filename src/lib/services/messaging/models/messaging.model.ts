export interface ConversationPreview {
  id: string;
  other_user_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface ConversationListResponse {
  conversations: ConversationPreview[];
  total: number;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageListResponse {
  messages: MessageResponse[];
  total: number;
}

export interface StartConversationRequest {
  other_user_id: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface WsSendMessage {
  type: 'send_message';
  conversation_id: string;
  content: string;
}

export interface WsMarkRead {
  type: 'mark_read';
  conversation_id: string;
}

export interface WsTyping {
  type: 'typing';
  conversation_id: string;
}

export interface WsNewMessageEvent {
  type: 'new_message';
  message: MessageResponse;
}

export interface WsMessagesReadEvent {
  type: 'messages_read';
  conversation_id: string;
  user_id: string;
}

export interface WsTypingEvent {
  type: 'typing';
  conversation_id: string;
  user_id: string;
}

export interface WsErrorEvent {
  type: 'error';
  detail: string;
}

export type WsIncomingEvent =
  | WsNewMessageEvent
  | WsMessagesReadEvent
  | WsTypingEvent
  | WsErrorEvent;
