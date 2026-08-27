import { apiClient } from './client';
import { ApiResponse } from './types';

export interface BusinessMemoryItem {
  id: string;
  organizationId: string;
  customerId?: string | null;
  receivableId?: string | null;
  category: string;
  type: string;
  timeWindow: string;
  statement: string;
  value: Record<string, any>;
  currency?: string | null;
  confidence: number;
  status: string;
  evidenceCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  createdAt: string;
}

export const businessMemoryApi = {
  getCustomerMemories: async (customerId: string): Promise<BusinessMemoryItem[]> => {
    const res = await apiClient.get<ApiResponse<any>>(`/customers/${customerId}/memories`);
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },
};
