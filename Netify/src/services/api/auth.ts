import { apiClient } from './client';
import { ApiResponse } from './types';
import { SecureStorageService } from '@/services/storage/secure-storage';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationName?: string;
  currency?: string;
  country?: string;
}

export interface RegisterResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
  };
  requiresEmailVerification: boolean;
  message: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

export interface SessionItem {
  id: string;
  deviceId?: string | null;
  deviceName?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingStep: string;
  onboardingData?: Record<string, any> | null;
  memberships?: {
    id: string;
    organizationId: string;
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      currency: string;
      country: string;
    };
  }[];
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
    onboardingStep?: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  } | null;
  role?: string | null;
  tokens?: AuthTokens;
  requiresEmailVerification?: boolean;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<ApiResponse<RegisterResult>> {
    return apiClient.post<RegisterResult>('/auth/register', payload);
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/verify-email', payload);
  },

  async resendVerification(payload: ResendVerificationPayload): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/resend-verification', payload);
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/login', payload);
  },

  async refresh(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>> {
    return apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number }>('/auth/refresh', {
      refreshToken,
    });
  },

  async logout(refreshToken: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/logout', { refreshToken });
  },

  async logoutAll(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/logout-all', {});
  },

  async getSessions(): Promise<ApiResponse<SessionItem[]>> {
    const refreshToken = await SecureStorageService.getRefreshToken();
    return apiClient.get<SessionItem[]>('/auth/sessions', {
      headers: refreshToken ? { 'x-refresh-token': refreshToken } : undefined,
    });
  },

  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
  },

  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/change-password', payload);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/reset-password', payload);
  },

  async getMe(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/auth/me');
  },
};
