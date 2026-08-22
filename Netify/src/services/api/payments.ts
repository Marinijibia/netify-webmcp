import { apiClient } from './client';
import { ApiResponse } from './types';

export interface PaymentItem {
  id: string;
  organizationId: string;
  customerId: string;
  receivableId?: string | null;
  amount: string;
  currency: string;
  paidAt: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CARD' | 'POS' | 'OTHER';
  reference?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REVERSED';
  idempotencyKey?: string | null;
  notes?: string | null;
  source?: string | null;
  customer?: {
    id: string;
    name: string;
  };
  receivable?: {
    id: string;
    reference?: string | null;
    description?: string | null;
    originalAmount: string;
    currency: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RecordPaymentPayload {
  receivableId: string;
  amount: number | string;
  method?: string;
  paidAt?: string;
  reference?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface PaymentQueryParams {
  [key: string]: string | number | boolean | undefined;
  receivableId?: string;
  customerId?: string;
  status?: string;
  method?: string;
  page?: number;
  pageSize?: number;
}

export const paymentsApi = {
  list: async (params?: PaymentQueryParams): Promise<ApiResponse<PaymentItem[]>> => {
    return apiClient.get<PaymentItem[]>('/payments', { params });
  },

  getById: async (id: string): Promise<ApiResponse<PaymentItem>> => {
    return apiClient.get<PaymentItem>(`/payments/${id}`);
  },

  record: async (data: RecordPaymentPayload): Promise<ApiResponse<PaymentItem>> => {
    return apiClient.post<PaymentItem>('/payments', data);
  },

  reverse: async (id: string): Promise<ApiResponse<PaymentItem>> => {
    return apiClient.patch<PaymentItem>(`/payments/${id}/reverse`, {});
  },
};
