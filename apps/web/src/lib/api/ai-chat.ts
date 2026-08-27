import { apiClient } from './client';
import { ApiResponse } from './types';

export interface AIMessageItem {
  id: string;
  conversationId: string;
  sender: 'USER' | 'COPILOT' | 'SYSTEM';
  content: string;
  language?: string;
  createdAt: string;
}

export interface AIChatResponse {
  conversationId: string;
  messageId: string;
  sender: 'COPILOT';
  content: string;
  intent?: string;
  facts?: Array<{ title: string; detail: string; metric?: string | number }>;
  inferences?: Array<{ title: string; reason: string; urgency?: string }>;
  evidence?: {
    memoryIds: string[];
    eventIds: string[];
    customerIds: string[];
    receivableIds: string[];
  };
  suggestedActions?: Array<{
    id?: string;
    actionType: string;
    title: string;
    description: string;
    payload: Record<string, any>;
    isConsequential: boolean;
  }>;
  suggestedFollowUps?: string[];
}

export const aiChatApi = {
  sendMessage: async (data: {
    content: string;
    conversationId?: string;
    customerId?: string;
  }): Promise<AIChatResponse> => {
    const res = await apiClient.post<ApiResponse<AIChatResponse>>('/ai/chat', data);
    return (res.data?.data || res.data) as AIChatResponse;
  },

  listConversations: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/ai/conversations');
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : [];
  },
};
