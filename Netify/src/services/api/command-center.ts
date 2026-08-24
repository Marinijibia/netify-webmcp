import { apiClient } from './client';
import { ApiResponse } from './types';
import { SupportedLanguage } from '../../i18n';

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
  language: SupportedLanguage;
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

export const commandCenterApi = {
  /**
   * Fetches deterministic daily attention signals, disaggregated facts, and inferences.
   */
  getAttention: async (params?: {
    language?: SupportedLanguage;
    currency?: string;
  }): Promise<CommandCenterAttentionData> => {
    const res = await apiClient.get<ApiResponse<CommandCenterAttentionData>>(
      '/command-center/attention',
      { params }
    );
    return res.data.data;
  },

  /**
   * Fetches top priority collection customers.
   */
  getPriorities: async (params?: {
    limit?: number;
    currency?: string;
    language?: SupportedLanguage;
  }) => {
    const res = await apiClient.get<ApiResponse<any>>('/command-center/priorities', {
      params,
    });
    return res.data.data;
  },

  /**
   * Fetches data-grounded localized daily briefing.
   */
  getBriefing: async (params?: {
    language?: SupportedLanguage;
    currency?: string;
  }) => {
    const res = await apiClient.get<ApiResponse<{
      briefing: string;
      facts: CommandCenterAttentionData['facts'];
      inferences: AttentionInference[];
      calculatedAt: string;
    }>>('/command-center/briefing', { params });
    return res.data.data;
  },
};
