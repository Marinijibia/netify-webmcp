import { apiClient } from './client';
import { ApiResponse } from './types';

export type AIUrgencyLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type AIConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type AIRecommendationAction =
  | 'FOLLOW_UP_NOW'
  | 'FOLLOW_UP_LATER'
  | 'REQUEST_PAYMENT_DATE'
  | 'REQUEST_PARTIAL_PAYMENT'
  | 'REVIEW_COMMITMENT'
  | 'CHANGE_COLLECTION_CHANNEL'
  | 'ESCALATE'
  | 'NO_ACTION';

export type AIRecommendationStatus = 'ACTIVE' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED';

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
  urgency: AIUrgencyLevel;
  reasons: string[];
  lastPaymentAt?: string | null;
  lastActivityAt?: string | null;
}

export interface TodayAttentionData {
  currency: string;
  totalOutstanding: number;
  totalOverdue: number;
  commitmentsDueCount: number;
  commitmentsDueAmount: number;
  highPriorityCount: number;
  topPriorities: PriorityCustomerItem[];
  executiveBriefing: string;
  calculatedAt: string;
}

export interface PriorityCustomersResponse {
  items: PriorityCustomerItem[];
  totalCount: number;
  highUrgencyCount: number;
  mediumUrgencyCount: number;
  lowUrgencyCount: number;
}

export interface CustomerExplanationData {
  summary: string;
  whyItMatters: string;
  recentHistory: string;
  recommendation: string;
  confidence: AIConfidenceLevel;
  evidenceMemoryIds: string[];
  evidenceEventIds: string[];
}

export interface CollectionRecommendationData {
  recommendationId: string;
  action: AIRecommendationAction;
  urgency: AIUrgencyLevel;
  title: string;
  reasoningSummary: string;
  suggestedChannel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'IN_PERSON' | 'EMAIL';
  suggestedMessage?: string;
  confidence: AIConfidenceLevel;
  evidenceMemoryIds: string[];
  evidenceEventIds: string[];
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

export interface CustomerSummaryData {
  balanceOverview: string;
  paymentBehaviorSummary: string;
  commitmentHistorySummary: string;
  keyMemories: string[];
  keyEvents: string[];
  strategicRecommendation: string;
  confidence: AIConfidenceLevel;
}

export interface BusinessQAData {
  intent: string;
  answer: string;
  keyFigures?: Record<string, any>;
  citations: string[];
  suggestedFollowUps: string[];
  confidence: AIConfidenceLevel;
}

export const aiApi = {
  /**
   * GET /api/v1/ai/today
   * Fetches deterministic today's attention figures and daily briefing.
   */
  async getTodayAttention(query?: { currency?: string }): Promise<TodayAttentionData> {
    const response = await apiClient.get<ApiResponse<TodayAttentionData>>('/ai/today', {
      params: query,
    });
    return response.data.data;
  },

  /**
   * GET /api/v1/ai/priority-customers
   * Fetches ranked priority customer queue with factual reasons.
   */
  async getPriorityCustomers(query?: {
    urgency?: AIUrgencyLevel;
    minScore?: number;
    currency?: string;
    page?: number;
    limit?: number;
  }): Promise<PriorityCustomersResponse> {
    const response = await apiClient.get<ApiResponse<PriorityCustomersResponse>>(
      '/ai/priority-customers',
      { params: query }
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/ai/customers/:customerId/explain
   * Explains customer priority with evidence grounding.
   */
  async explainCustomer(
    customerId: string,
    input?: { receivableId?: string }
  ): Promise<CustomerExplanationData> {
    const response = await apiClient.post<ApiResponse<CustomerExplanationData>>(
      `/ai/customers/${customerId}/explain`,
      input || {}
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/ai/customers/:customerId/recommend
   * Generates grounded collection recommendation and persists recommendation ID.
   */
  async recommendAction(
    customerId: string,
    input?: { receivableId?: string; preferredChannel?: string }
  ): Promise<CollectionRecommendationData> {
    const response = await apiClient.post<ApiResponse<CollectionRecommendationData>>(
      `/ai/customers/${customerId}/recommend`,
      input || {}
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/ai/customers/:customerId/draft-message
   * Drafts respectful collection message.
   */
  async draftMessage(
    customerId: string,
    input: {
      receivableId?: string;
      channel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'IN_PERSON' | 'EMAIL';
      tone?: 'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' | 'PARTIAL_PAYMENT_PROPOSAL';
      customNote?: string;
    }
  ): Promise<CollectionMessageDraftData> {
    const response = await apiClient.post<ApiResponse<CollectionMessageDraftData>>(
      `/ai/customers/${customerId}/draft-message`,
      input
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/ai/customers/:customerId/summary
   * Generates customer 360 overview.
   */
  async summarizeCustomer(
    customerId: string,
    input?: { timeWindowDays?: number }
  ): Promise<CustomerSummaryData> {
    const response = await apiClient.post<ApiResponse<CustomerSummaryData>>(
      `/ai/customers/${customerId}/summary`,
      input || {}
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/ai/qa
   * Ask business question with deterministic execution and verified grounding.
   */
  async askQA(input: {
    query: string;
    customerId?: string;
    receivableId?: string;
    timeWindowDays?: number;
  }): Promise<BusinessQAData> {
    const response = await apiClient.post<ApiResponse<BusinessQAData>>('/ai/qa', input);
    return response.data.data;
  },

  /**
   * PATCH /api/v1/ai/recommendations/:id/status
   * Updates recommendation state (ACCEPTED / DISMISSED).
   */
  async updateRecommendationStatus(
    recommendationId: string,
    status: AIRecommendationStatus
  ) {
    const response = await apiClient.patch<ApiResponse<any>>(
      `/ai/recommendations/${recommendationId}/status`,
      { status }
    );
    return response.data.data;
  },
};
