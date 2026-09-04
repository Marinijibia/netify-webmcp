import { apiClient } from './client';
import { ApiResponse } from './types';
import { WebStorageService } from './storage';

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

export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  redirectUrl?: string | null;
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
    return apiClient.post<RegisterResult>('/auth/register', payload, { requiresAuth: false });
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/login', payload, { requiresAuth: false });
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/verify-email', payload, { requiresAuth: false });
  },

  async getMe(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/auth/me');
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email }, { requiresAuth: false });
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword }, { requiresAuth: false });
  },

  async logout(): Promise<void> {
    const refreshToken = WebStorageService.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch (err) {
        console.warn('Logout API error:', err);
      }
    }
    WebStorageService.clearAll();
  },
};
