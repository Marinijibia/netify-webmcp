export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  errorCode?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
  requiresAuth?: boolean;
}
