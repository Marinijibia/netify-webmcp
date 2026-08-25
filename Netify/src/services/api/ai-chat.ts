import { apiClient } from './client';
import { ApiResponse } from './types';
import { SupportedLanguage } from '../../i18n';

export interface AIMessageItem {
  id: string;
  conversationId: string;
  sender: 'USER' | 'COPILOT' | 'SYSTEM';
  content: string;
  language: SupportedLanguage;
  intent?: string;
  evidenceMemoryIds?: string[];
  evidenceEventIds?: string[];
  evidenceCustomerIds?: string[];
  evidenceReceivableIds?: string[];
  createdAt: string;
}

export interface AIActionProposalItem {
  id: string;
  actionType: string;
  title: string;
  description: string;
  payload: Record<string, any>;
  status: 'SUGGESTED' | 'CONFIRMED' | 'EXECUTED' | 'REJECTED' | 'EXPIRED';
  isConsequential: boolean;
  confirmedAt?: string | null;
  executedAt?: string | null;
  createdAt: string;
}

export interface AIConversationItem {
  id: string;
  title: string;
  language: SupportedLanguage;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface AIChatResponse {
  conversationId: string;
  messageId: string;
  sender: 'COPILOT';
  content: string;
  detectedLanguage: SupportedLanguage;
  intent: string;
  facts: Array<{ title: string; detail: string; metric?: string | number }>;
  inferences: Array<{ title: string; reason: string; urgency?: string }>;
  evidence: {
    memoryIds: string[];
    eventIds: string[];
    customerIds: string[];
    receivableIds: string[];
  };
  suggestedActions: Array<{
    id?: string;
    actionType: string;
    title: string;
    description: string;
    payload: Record<string, any>;
    isConsequential: boolean;
  }>;
  suggestedFollowUps: string[];
  metrics: {
    latencyMs: number;
    provider: string;
  };
}

export const aiChatApi = {
  /**
   * Sends a message to the Multilingual AI Copilot.
   */
  sendMessage: async (data: {
    content: string;
    conversationId?: string;
    language?: SupportedLanguage;
    customerId?: string;
  }): Promise<AIChatResponse> => {
    const res = await apiClient.post<AIChatResponse>('/ai/chat', data);
    return res.data;
  },

  /**
   * Lists historical conversation sessions.
   */
  listConversations: async (): Promise<AIConversationItem[]> => {
    const res = await apiClient.get<ApiResponse<AIConversationItem[]>>('/ai/conversations');
    return res.data.data;
  },

  /**
   * Retrieves messages for a specific conversation session.
   */
  getConversation: async (
    conversationId: string
  ): Promise<{
    id: string;
    title: string;
    language: SupportedLanguage;
    messages: AIMessageItem[];
    actionProposals: AIActionProposalItem[];
  }> => {
    const res = await apiClient.get<ApiResponse<any>>(`/ai/conversations/${conversationId}`);
    return res.data.data;
  },

  /**
   * Deletes a conversation session.
   */
  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/ai/conversations/${conversationId}`);
  },

  /**
   * Confirms or declines a proposed AI action.
   */
  confirmAction: async (
    actionProposalId: string,
    confirm: boolean,
    notes?: string
  ): Promise<{
    proposal: AIActionProposalItem;
    executed: boolean;
    message: string;
  }> => {
    const res = await apiClient.post<ApiResponse<any>>(
      `/ai/actions/${actionProposalId}/confirm`,
      { confirm, notes }
    );
    return res.data.data;
  },

  /**
   * Updates user's preferred language.
   */
  updateLanguagePreference: async (language: SupportedLanguage): Promise<void> => {
    await apiClient.patch('/ai/language', { language });
  },
};
