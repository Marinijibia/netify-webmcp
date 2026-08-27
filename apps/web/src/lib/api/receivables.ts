import { apiClient } from './client';
import { ApiResponse } from './types';

export interface ReceivableItem {
  id: string;
  organizationId: string;
  customerId: string;
  reference?: string | null;
  description?: string | null;
  originalAmount: string | number;
  amountPaid: string | number;
  balance: string | number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  source: 'MANUAL' | 'INVOICE' | 'CREDIT_SALE' | 'OTHER';
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'DISPUTED' | 'CANCELLED';
  notes?: string | null;
  isOverdue: boolean;
  daysOverdue: number;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    status?: string;
  };
  payments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceivablePayload {
  customerId: string;
  amount: number | string;
  dueDate: string;
  issuedAt?: string;
  currency?: string;
  description?: string;
  reference?: string;
  source?: string;
  notes?: string;
}

export interface ReceivableQueryParams {
  [key: string]: string | number | boolean | undefined;
  customerId?: string;
  status?: string;
  isOverdue?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const receivablesApi = {
  list: async (params?: ReceivableQueryParams): Promise<ReceivableItem[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/receivables', { params });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  getById: async (id: string): Promise<ReceivableItem> => {
    const res = await apiClient.get<ApiResponse<ReceivableItem>>(`/receivables/${id}`);
    return res.data?.data || (res.data as unknown as ReceivableItem);
  },

  create: async (data: CreateReceivablePayload): Promise<ReceivableItem> => {
    const res = await apiClient.post<ApiResponse<ReceivableItem>>('/receivables', data);
    return res.data?.data || (res.data as unknown as ReceivableItem);
  },

  cancel: async (id: string): Promise<ReceivableItem> => {
    const res = await apiClient.patch<ApiResponse<ReceivableItem>>(`/receivables/${id}/cancel`, {});
    return res.data?.data || (res.data as unknown as ReceivableItem);
  },
};
