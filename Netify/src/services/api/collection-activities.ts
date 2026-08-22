import { apiClient } from './client';
import { ApiResponse } from './types';

export type ActivityType =
  | 'CALL'
  | 'WHATSAPP'
  | 'SMS'
  | 'EMAIL'
  | 'IN_PERSON'
  | 'PAYMENT_REMINDER'
  | 'FOLLOW_UP'
  | 'OTHER';

export type CollectionChannel =
  | 'PHONE'
  | 'WHATSAPP'
  | 'SMS'
  | 'EMAIL'
  | 'IN_PERSON'
  | 'OTHER';

export type ActivityOutcome =
  | 'NO_RESPONSE'
  | 'CONTACTED'
  | 'PROMISED_PAYMENT'
  | 'PARTIAL_PAYMENT'
  | 'FULL_PAYMENT'
  | 'DISPUTE'
  | 'REQUESTED_EXTENSION'
  | 'WRONG_CONTACT'
  | 'CUSTOMER_UNAVAILABLE'
  | 'OTHER';

export interface CollectionActivityItem {
  id: string;
  organizationId: string;
  customerId: string;
  receivableId: string;
  performedByUserId: string;
  type: ActivityType;
  channel: CollectionChannel;
  outcome: ActivityOutcome;
  occurredAt: string;
  notes?: string | null;
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
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  commitments?: any[];
}

export interface CreateCollectionActivityPayload {
  receivableId: string;
  customerId?: string;
  type: ActivityType;
  channel: CollectionChannel;
  outcome: ActivityOutcome;
  occurredAt?: string;
  notes?: string;
  commitment?: {
    amount: number | string;
    promisedFor: string;
    notes?: string;
  };
}

export interface ActivityQueryParams {
  [key: string]: string | number | boolean | undefined;
  receivableId?: string;
  customerId?: string;
  type?: ActivityType;
  channel?: CollectionChannel;
  outcome?: ActivityOutcome;
  page?: number;
  pageSize?: number;
}

export const collectionActivitiesApi = {
  getActivities: async (params?: ActivityQueryParams): Promise<ApiResponse<CollectionActivityItem[]>> => {
    return apiClient.get<CollectionActivityItem[]>('/collection-activities', { params });
  },

  getReceivableActivities: async (
    receivableId: string,
    params?: ActivityQueryParams
  ): Promise<ApiResponse<CollectionActivityItem[]>> => {
    return apiClient.get<CollectionActivityItem[]>(`/receivables/${receivableId}/activities`, { params });
  },

  getCustomerActivities: async (
    customerId: string,
    params?: ActivityQueryParams
  ): Promise<ApiResponse<CollectionActivityItem[]>> => {
    return apiClient.get<CollectionActivityItem[]>(`/customers/${customerId}/activities`, { params });
  },

  getActivity: async (id: string): Promise<ApiResponse<CollectionActivityItem>> => {
    return apiClient.get<CollectionActivityItem>(`/collection-activities/${id}`);
  },

  createActivity: async (
    data: CreateCollectionActivityPayload
  ): Promise<ApiResponse<CollectionActivityItem>> => {
    return apiClient.post<CollectionActivityItem>('/collection-activities', data);
  },

  createReceivableActivity: async (
    receivableId: string,
    data: Omit<CreateCollectionActivityPayload, 'receivableId'>
  ): Promise<ApiResponse<CollectionActivityItem>> => {
    return apiClient.post<CollectionActivityItem>(`/receivables/${receivableId}/activities`, data);
  },
};
