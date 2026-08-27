import { apiClient } from './client';
import { ApiResponse } from './types';

export interface AttentionFact {
  type: string;
  metric: string;
  value: string | number;
  description: string;
  evidenceRef?: string;
}

export interface AttentionInference {
  type: string;
  title: string;
  insight: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction?: string;
  evidenceRefs: string[];
}

export interface CommandCenterAttentionData {
  currency: string;
  language: string;
  facts: {
    totalOutstanding: number;
    totalOverdue: number;
    overdueCustomersCount: number;
    promisesDueTodayCount: number;
    promisesDueTodayAmount: number;
    missedPromisesCount: number;
    highRiskCasesCount: number;
    activeCustomersCount: number;
  };
  inferences: AttentionInference[];
  executiveBriefing: string;
  calculatedAt: string;
}

export interface PriorityCustomerSummary {
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

export const commandCenterApi = {
  getAttention: async (params?: { language?: string; currency?: string }): Promise<CommandCenterAttentionData> => {
    const res = await apiClient.get<ApiResponse<CommandCenterAttentionData>>('/command-center/attention', { params });
    return res.data?.data || (res.data as unknown as CommandCenterAttentionData);
  },

  getPriorities: async (params?: { limit?: number; currency?: string; language?: string }): Promise<PriorityCustomerSummary[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/command-center/priorities', { params });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  getBriefing: async (params?: { language?: string; currency?: string }) => {
    const res = await apiClient.get<ApiResponse<{
      briefing: string;
      facts: CommandCenterAttentionData['facts'];
      inferences: AttentionInference[];
      calculatedAt: string;
    }>>('/command-center/briefing', { params });
    return res.data?.data || (res.data as any);
  },
};
