import { apiClient } from './client';

export interface AIMessageItem {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  isGrounded?: boolean;
  intent?: string;
  timestamp: string;
}

export interface ConversationSummary {
  _id: string;
  title: string;
  language: string;
  messageCount: number;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversationDetail {
  _id: string;
  userId: string;
  farmId: string;
  title: string;
  language: string;
  messages: AIMessageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  success: boolean;
  conversationId: string;
  reply: string;
  language: string;
  isGrounded: boolean;
  intent: string;
  sources?: string[];
}

export async function sendAIMessage(payload: {
  message: string;
  conversationId?: string;
  language?: string;
}): Promise<SendMessageResponse> {
  const res = await apiClient.post<SendMessageResponse>('/ai/chat', payload);
  return res.data;
}

export async function getConversations(): Promise<{ success: boolean; data: ConversationSummary[] }> {
  const res = await apiClient.get<{ success: boolean; data: ConversationSummary[] }>('/ai/conversations');
  return res.data;
}

export async function getConversation(id: string): Promise<{ success: boolean; data: AIConversationDetail }> {
  const res = await apiClient.get<{ success: boolean; data: AIConversationDetail }>(`/ai/conversations/${id}`);
  return res.data;
}

export async function createConversation(payload?: {
  title?: string;
  language?: string;
}): Promise<{ success: boolean; data: AIConversationDetail }> {
  const res = await apiClient.post<{ success: boolean; data: AIConversationDetail }>('/ai/conversations', payload);
  return res.data;
}

export async function deleteConversation(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/ai/conversations/${id}`);
  return res.data;
}
