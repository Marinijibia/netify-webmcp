import { apiClient } from './client';
import { ApiResponse } from './types';

export type CommitmentStatus =
  | 'PENDING'
  | 'FULFILLED'
  | 'MISSED'
  | 'CANCELLED'
  | 'PARTIALLY_FULFILLED';

export interface PaymentCommitmentItem {
  id: string;
  organizationId: string;
  customerId: string;
  receivableId: string;
  createdByUserId: string;
  amount: string | number;
  currency: string;
  promisedFor: string;
  status: CommitmentStatus;
  notes?: string | null;
  isMissed?: boolean;
  daysOverdue?: number;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  receivable?: {
    id: string;
    reference?: string | null;
    description?: string | null;
    originalAmount: string | number;
    currency: string;
    status: string;
  };
}

export interface CreateCommitmentPayload {
  receivableId: string;
  customerId?: string;
  amount: number | string;
  currency?: string;
  promisedFor: string;
  notes?: string;
}

export const commitmentsApi = {
  getCommitments: async (params?: { customerId?: string; receivableId?: string; status?: string }): Promise<PaymentCommitmentItem[]> => {
    if (params?.receivableId) {
      const res = await apiClient.get<ApiResponse<any>>(`/receivables/${params.receivableId}/commitments`, { params });
      const payload = res.data?.data || res.data;
      return Array.isArray(payload) ? payload : (payload?.items || []);
    }
    if (params?.customerId) {
      const res = await apiClient.get<ApiResponse<any>>(`/customers/${params.customerId}/commitments`, { params });
      const payload = res.data?.data || res.data;
      return Array.isArray(payload) ? payload : (payload?.items || []);
    }
    const res = await apiClient.get<ApiResponse<any>>('/commitments', { params });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  getTodayCommitments: async (): Promise<PaymentCommitmentItem[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/commitments/today');
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  getMissedCommitments: async (): Promise<PaymentCommitmentItem[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/commitments/missed');
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  createCommitment: async (data: CreateCommitmentPayload): Promise<PaymentCommitmentItem> => {
    const url = data.receivableId ? `/receivables/${data.receivableId}/commitments` : '/commitments';
    const res = await apiClient.post<ApiResponse<PaymentCommitmentItem>>(url, data);
    return res.data?.data || (res.data as unknown as PaymentCommitmentItem);
  },
};
