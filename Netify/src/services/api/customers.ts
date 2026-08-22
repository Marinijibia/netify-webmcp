import { apiClient } from './client';
import { ApiResponse } from './types';

export interface CustomerContactItem {
  id: string;
  customerId: string;
  type: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'OTHER';
  value: string;
  label?: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerItem {
  id: string;
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLOCKED';
  notes?: string | null;
  tags: string[];
  metadata?: Record<string, any>;
  contacts?: CustomerContactItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerQueryParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLOCKED';
  notes?: string;
}

export interface CreateContactPayload {
  type: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'OTHER';
  value: string;
  label?: string;
  isPrimary?: boolean;
}

export interface UpdateContactPayload {
  type?: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'OTHER';
  value?: string;
  label?: string;
  isPrimary?: boolean;
}

export const customersApi = {
  async list(params?: CustomerQueryParams): Promise<ApiResponse<CustomerItem[]>> {
    return apiClient.get<CustomerItem[]>('/customers', { params: params as any });
  },

  async getById(id: string): Promise<ApiResponse<CustomerItem>> {
    return apiClient.get<CustomerItem>(`/customers/${id}`);
  },

  async create(payload: CreateCustomerPayload): Promise<ApiResponse<CustomerItem>> {
    return apiClient.post<CustomerItem>('/customers', payload);
  },

  async update(id: string, payload: UpdateCustomerPayload): Promise<ApiResponse<CustomerItem>> {
    return apiClient.patch<CustomerItem>(`/customers/${id}`, payload);
  },

  async archive(id: string): Promise<ApiResponse<CustomerItem>> {
    return apiClient.patch<CustomerItem>(`/customers/${id}/archive`, {});
  },

  async getContacts(customerId: string): Promise<ApiResponse<CustomerContactItem[]>> {
    return apiClient.get<CustomerContactItem[]>(`/customers/${customerId}/contacts`);
  },

  async addContact(customerId: string, payload: CreateContactPayload): Promise<ApiResponse<CustomerContactItem>> {
    return apiClient.post<CustomerContactItem>(`/customers/${customerId}/contacts`, payload);
  },

  async updateContact(
    customerId: string,
    contactId: string,
    payload: UpdateContactPayload
  ): Promise<ApiResponse<CustomerContactItem>> {
    return apiClient.patch<CustomerContactItem>(`/customers/${customerId}/contacts/${contactId}`, payload);
  },

  async deleteContact(customerId: string, contactId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/customers/${customerId}/contacts/${contactId}`);
  },
};
