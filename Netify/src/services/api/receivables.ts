import { apiClient } from './client';
import { ApiResponse } from './types';

export interface ReceivableItem {
  id: string;
  organizationId: string;
  customerId: string;
  reference?: string | null;
  description?: string | null;
  originalAmount: string;
  amountPaid: string;
  balance: string;
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

export interface UpdateReceivablePayload {
  dueDate?: string;
  description?: string;
  reference?: string;
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
  list: async (params?: ReceivableQueryParams): Promise<ApiResponse<ReceivableItem[]>> => {
    return apiClient.get<ReceivableItem[]>('/receivables', { params });
  },

  getById: async (id: string): Promise<ApiResponse<ReceivableItem>> => {
    return apiClient.get<ReceivableItem>(`/receivables/${id}`);
  },

  create: async (data: CreateReceivablePayload): Promise<ApiResponse<ReceivableItem>> => {
    return apiClient.post<ReceivableItem>('/receivables', data);
  },

  update: async (id: string, data: UpdateReceivablePayload): Promise<ApiResponse<ReceivableItem>> => {
    return apiClient.patch<ReceivableItem>(`/receivables/${id}`, data);
  },

  cancel: async (id: string): Promise<ApiResponse<ReceivableItem>> => {
    return apiClient.patch<ReceivableItem>(`/receivables/${id}/cancel`, {});
  },
};
