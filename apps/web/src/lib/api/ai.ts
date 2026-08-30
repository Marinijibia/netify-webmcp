import { apiClient } from './client';
import { ApiResponse } from './types';

export interface PriorityCustomerItem {
  customerId: string;
  customerName: string;
  phone?: string | null;
  email?: string | null;
  currency: string;
  totalOutstanding: number;
  totalOverdue: number;
  oldestOverdueDays: number;
  openReceivablesCount: number;
  pendingCommitmentsCount: number;
  missedCommitmentsCount: number;
  priorityScore: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  lastPaymentAt?: string | null;
  lastActivityAt?: string | null;
}

export interface CustomerExplanationData {
  summary: string;
  whyItMatters: string;
  recentHistory: string;
  recommendation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceMemoryIds: string[];
  evidenceEventIds: string[];
}

export interface CollectionRecommendationData {
  recommendationId: string;
  action: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  reasoningSummary: string;
  suggestedChannel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'IN_PERSON' | 'EMAIL';
  suggestedMessage?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CollectionMessageDraftData {
  channel: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'IN_PERSON' | 'EMAIL';
  tone: 'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' | 'PARTIAL_PAYMENT_PROPOSAL';
  recipientName: string;
  recipientContact?: string;
  subject?: string;
  messageBody: string;
  callScriptPoints?: string[];
  culturalNotes?: string;
  verifiedOutstandingAmount: number;
  currency: string;
}

export const aiApi = {
  async getTodayAttention(query?: { currency?: string }) {
    const res = await apiClient.get<ApiResponse<any>>('/ai/today', { params: query });
    return res.data?.data || res.data;
  },

  async getPriorityCustomers(query?: { urgency?: string; currency?: string }): Promise<PriorityCustomerItem[]> {
    const res = await apiClient.get<ApiResponse<any>>('/ai/priority-customers', { params: query });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  async explainCustomer(customerId: string): Promise<CustomerExplanationData> {
    const res = await apiClient.post<ApiResponse<CustomerExplanationData>>(
      `/ai/customers/${customerId}/explain`,
      {},
      { timeoutMs: 60000 }
    );
    return res.data?.data || (res.data as unknown as CustomerExplanationData);
  },

  async recommendAction(customerId: string): Promise<CollectionRecommendationData> {
    const res = await apiClient.post<ApiResponse<CollectionRecommendationData>>(
      `/ai/customers/${customerId}/recommend`,
      {},
      { timeoutMs: 60000 }
    );
    return res.data?.data || (res.data as unknown as CollectionRecommendationData);
  },

  async draftMessage(
    customerId: string,
    input: {
      channel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'IN_PERSON' | 'EMAIL';
      tone?: 'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' | 'PARTIAL_PAYMENT_PROPOSAL';
      customNote?: string;
      receivableId?: string;
    }
  ): Promise<CollectionMessageDraftData> {
    const res = await apiClient.post<ApiResponse<CollectionMessageDraftData>>(
      `/ai/customers/${customerId}/draft-message`,
      input,
      { timeoutMs: 60000 }
    );
    return res.data?.data || (res.data as unknown as CollectionMessageDraftData);
  },
};
