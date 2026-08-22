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
  amount: string;
  currency: string;
  promisedFor: string;
  status: CommitmentStatus;
  sourceActivityId?: string | null;
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
    originalAmount: string;
    currency: string;
    status: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sourceActivity?: {
    id: string;
    type: string;
    channel: string;
    outcome: string;
    occurredAt: string;
    notes?: string | null;
  };
}

export interface CreateCommitmentPayload {
  receivableId: string;
  customerId?: string;
  amount: number | string;
  currency?: string;
  promisedFor: string;
  sourceActivityId?: string;
  notes?: string;
}

export interface CancelCommitmentPayload {
  notes?: string;
}

export interface CommitmentQueryParams {
  [key: string]: string | number | boolean | undefined;
  receivableId?: string;
  customerId?: string;
  status?: CommitmentStatus;
  timeframe?: 'ALL' | 'TODAY' | 'UPCOMING' | 'MISSED' | 'FULFILLED';
  page?: number;
  pageSize?: number;
}

export const commitmentsApi = {
  getCommitments: async (params?: CommitmentQueryParams): Promise<ApiResponse<PaymentCommitmentItem[]>> => {
    return apiClient.get<PaymentCommitmentItem[]>('/commitments', { params });
  },

  getTodayCommitments: async (params?: CommitmentQueryParams): Promise<ApiResponse<PaymentCommitmentItem[]>> => {
    return apiClient.get<PaymentCommitmentItem[]>('/commitments/today', { params });
  },

  getMissedCommitments: async (params?: CommitmentQueryParams): Promise<ApiResponse<PaymentCommitmentItem[]>> => {
    return apiClient.get<PaymentCommitmentItem[]>('/commitments/missed', { params });
  },

  getReceivableCommitments: async (
    receivableId: string,
    params?: CommitmentQueryParams
  ): Promise<ApiResponse<PaymentCommitmentItem[]>> => {
    return apiClient.get<PaymentCommitmentItem[]>(`/receivables/${receivableId}/commitments`, { params });
  },

  getCustomerCommitments: async (
    customerId: string,
    params?: CommitmentQueryParams
  ): Promise<ApiResponse<PaymentCommitmentItem[]>> => {
    return apiClient.get<PaymentCommitmentItem[]>(`/customers/${customerId}/commitments`, { params });
  },

  getCommitment: async (id: string): Promise<ApiResponse<PaymentCommitmentItem>> => {
    return apiClient.get<PaymentCommitmentItem>(`/commitments/${id}`);
  },

  createCommitment: async (
    data: CreateCommitmentPayload
  ): Promise<ApiResponse<PaymentCommitmentItem>> => {
    return apiClient.post<PaymentCommitmentItem>('/commitments', data);
  },

  createReceivableCommitment: async (
    receivableId: string,
    data: Omit<CreateCommitmentPayload, 'receivableId'>
  ): Promise<ApiResponse<PaymentCommitmentItem>> => {
    return apiClient.post<PaymentCommitmentItem>(`/receivables/${receivableId}/commitments`, data);
  },

  cancelCommitment: async (
    id: string,
    data: CancelCommitmentPayload
  ): Promise<ApiResponse<PaymentCommitmentItem>> => {
    return apiClient.patch<PaymentCommitmentItem>(`/commitments/${id}/cancel`, data);
  },
};
