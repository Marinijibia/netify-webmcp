import { apiClient } from './client';
import { ApiResponse } from './types';

export type BusinessEventType =
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'RECEIVABLE_CREATED'
  | 'RECEIVABLE_CANCELLED'
  | 'RECEIVABLE_OVERDUE'
  | 'RECEIVABLE_PAID'
  | 'RECEIVABLE_PARTIALLY_PAID'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REVERSED'
  | 'COLLECTION_ACTIVITY_RECORDED'
  | 'PAYMENT_COMMITMENT_CREATED'
  | 'PAYMENT_COMMITMENT_FULFILLED'
  | 'PAYMENT_COMMITMENT_PARTIALLY_FULFILLED'
  | 'PAYMENT_COMMITMENT_MISSED'
  | 'PAYMENT_COMMITMENT_CANCELLED'
  | 'INVOICE_CREATED'
  | 'DOCUMENT_UPLOADED';

export type ActorType = 'USER' | 'SYSTEM' | 'CUSTOMER' | 'PROVIDER';
export type EventSource =
  | 'USER_ACTION'
  | 'PAYMENT_PROCESS'
  | 'COLLECTION_ACTIVITY'
  | 'SCHEDULED_PROCESS'
  | 'SYSTEM';

export interface BusinessEventItem {
  id: string;
  organizationId: string;
  customerId?: string | null;
  receivableId?: string | null;
  paymentId?: string | null;
  collectionActivityId?: string | null;
  paymentCommitmentId?: string | null;
  type: BusinessEventType;
  occurredAt: string;
  recordedAt: string;
  actorType: ActorType;
  actorUserId?: string | null;
  source: EventSource;
  data: Record<string, any>;
  version: number;
  correlationId?: string | null;
  causationId?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  receivable?: {
    id: string;
    reference?: string | null;
    description?: string | null;
    originalAmount: string;
    currency: string;
    status: string;
  } | null;
  actorUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface BusinessEventQueryParams {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  pageSize?: number;
  customerId?: string;
  receivableId?: string;
  type?: string;
  actorType?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}

export interface TimelineQueryParams {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  pageSize?: number;
}

export const businessEventsApi = {
  /**
   * Retrieves the chronological event stream for a customer.
   */
  async getCustomerTimeline(
    customerId: string,
    params?: TimelineQueryParams
  ): Promise<ApiResponse<BusinessEventItem[]>> {
    return apiClient.get<BusinessEventItem[]>(`/customers/${customerId}/timeline`, { params });
  },

  /**
   * Retrieves the chronological case history for a receivable.
   */
  async getReceivableTimeline(
    receivableId: string,
    params?: TimelineQueryParams
  ): Promise<ApiResponse<BusinessEventItem[]>> {
    return apiClient.get<BusinessEventItem[]>(`/receivables/${receivableId}/timeline`, { params });
  },

  /**
   * Retrieves the organization-level event stream.
   */
  async getOrganizationEvents(
    params?: BusinessEventQueryParams
  ): Promise<ApiResponse<BusinessEventItem[]>> {
    return apiClient.get<BusinessEventItem[]>('/business-events', { params });
  },

  /**
   * Retrieves a single event by ID.
   */
  async getById(id: string): Promise<ApiResponse<BusinessEventItem>> {
    return apiClient.get<BusinessEventItem>(`/business-events/${id}`);
  },
};

