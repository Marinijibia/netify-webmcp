import { apiClient } from './client';
import { ApiResponse } from './types';

export interface PaymentItem {
  id: string;
  organizationId: string;
  customerId: string;
  receivableId?: string | null;
  amount: string | number;
  currency: string;
  paidAt: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CARD' | 'POS' | 'OTHER';
  reference?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REVERSED';
  notes?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  receivable?: {
    id: string;
    reference?: string | null;
    description?: string | null;
    originalAmount: string | number;
    currency: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RecordPaymentPayload {
  receivableId?: string;
  customerId?: string;
  amount: number | string;
  currency?: string;
  method?: string;
  paidAt?: string;
  reference?: string;
  notes?: string;
}

export const paymentsApi = {
  list: async (params?: { customerId?: string; receivableId?: string; pageSize?: number }): Promise<PaymentItem[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/payments', { params });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  getById: async (id: string): Promise<PaymentItem> => {
    const res = await apiClient.get<ApiResponse<PaymentItem>>(`/payments/${id}`);
    return res.data?.data || (res.data as unknown as PaymentItem);
  },

  record: async (data: RecordPaymentPayload): Promise<PaymentItem> => {
    const res = await apiClient.post<ApiResponse<PaymentItem>>('/payments', data);
    return res.data?.data || (res.data as unknown as PaymentItem);
  },

  confirm: async (id: string): Promise<PaymentItem> => {
    const res = await apiClient.patch<ApiResponse<PaymentItem>>(`/payments/${id}/confirm`, {});
    return res.data?.data || (res.data as unknown as PaymentItem);
  },
};
