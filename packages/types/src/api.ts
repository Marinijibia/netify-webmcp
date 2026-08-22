export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  details?: any;
  timestamp: string;
  path?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionDto {
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

export interface SecurityEventDto {
  id: string;
  eventType: string;
  createdAt: string;
  ipAddress?: string | null;
  metadata?: Record<string, any> | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
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
    status?: string;
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
