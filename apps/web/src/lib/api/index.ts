export * from './types';
export * from './errors';
export * from './storage';
export * from './client';
export * from './auth';
export * from './command-center';
export * from './customers';
export * from './receivables';
export * from './payments';
export * from './commitments';
export * from './collection-activities';
export * from './ai';
export * from './ai-chat';
export * from './business-memory';
export * from './notifications';
export * from './onboarding';

import { apiClient } from './client';
import { ApiResponse } from './types';

export interface TeamMemberUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
}

export interface TeamMemberItem {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'REMOVED';
  user: TeamMemberUser;
  createdAt: string;
  updatedAt: string;
}

export interface DelegationSettings {
  visibilityMode: 'OPEN_COLLABORATION' | 'ASSIGNED_TERRITORY';
  hideRevenueFromStaff: boolean;
  requireCashierVerification: boolean;
}

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  currency: string;
  country: string;
  timezone: string;
  status: string;
  logoUrl?: string | null;
  settings?: {
    delegation?: DelegationSettings;
    [key: string]: any;
  } | null;
  myMembership?: {
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'MEMBER';
    status: string;
  };
}

export const organizationApi = {
  async getCurrent(): Promise<OrganizationDetails> {
    const res = await apiClient.get<ApiResponse<OrganizationDetails>>('/organizations/current');
    return res.data?.data || (res.data as unknown as OrganizationDetails);
  },

  async update(id: string, payload: Partial<OrganizationDetails>): Promise<OrganizationDetails> {
    const res = await apiClient.patch<ApiResponse<OrganizationDetails>>(`/organizations/${id}`, payload);
    return res.data?.data || (res.data as unknown as OrganizationDetails);
  },

  async getMembers(orgId: string): Promise<TeamMemberItem[]> {
    const res = await apiClient.get<ApiResponse<TeamMemberItem[]>>(`/organizations/${orgId}/members`);
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : [];
  },

  async updateMemberRole(
    orgId: string,
    memberId: string,
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'MEMBER'
  ): Promise<TeamMemberItem> {
    const res = await apiClient.patch<ApiResponse<TeamMemberItem>>(
      `/organizations/${orgId}/members/${memberId}/role`,
      { role }
    );
    return res.data?.data || (res.data as unknown as TeamMemberItem);
  },

  async updateMemberStatus(
    orgId: string,
    memberId: string,
    status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'REMOVED'
  ): Promise<TeamMemberItem> {
    const res = await apiClient.patch<ApiResponse<TeamMemberItem>>(
      `/organizations/${orgId}/members/${memberId}/status`,
      { status }
    );
    return res.data?.data || (res.data as unknown as TeamMemberItem);
  },
};

