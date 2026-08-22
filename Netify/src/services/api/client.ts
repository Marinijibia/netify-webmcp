import { env } from '@/config/env';
import { SecureStorageService } from '@/services/storage/secure-storage';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  TimeoutError,
  ValidationError,
} from './errors';
import type { ApiResponse, RequestOptions } from './types';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl = env.apiUrl, defaultTimeoutMs = 15000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const {
      params,
      body,
      timeoutMs = this.defaultTimeoutMs,
      requiresAuth = true,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const queryString = params ? this.buildQueryString(params) : '';
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}${queryString}`;

    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(customHeaders as Record<string, string>),
    });

    if (requiresAuth) {
      const token = await SecureStorageService.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Token Expiration with Automatic Silent Refresh
      if (
        response.status === 401 &&
        requiresAuth &&
        !isRetry &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/refresh')
      ) {
        const newAccessToken = await this.performTokenRefresh();
        if (newAccessToken) {
          // Retry the original request with the fresh token
          return this.request<T>(endpoint, options, true);
        }
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {
          success: true,
          data: undefined as unknown as T,
          timestamp: new Date().toISOString(),
        };
      }

      const json = await response.json();
      if (json.success !== undefined) {
        return json as ApiResponse<T>;
      }

      return {
        success: true,
        data: json,
        message: json.message,
        timestamp: json.timestamp || new Date().toISOString(),
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError('The request timed out. Please check your connection and try again.');
      }

      // Handle all React Native and browser fetch network failures
      if (
        (error instanceof TypeError && (
          error.message.includes('fetch') ||
          error.message.includes('Network request failed') ||
          error.message.includes('Failed to fetch')
        )) ||
        (error instanceof Error && (
          error.message.includes('Network request failed') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('network error') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ETIMEDOUT')
        ))
      ) {
        throw new NetworkError('Unable to connect to Netify. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStorageService.getRefreshToken();
        if (!refreshToken) {
          await SecureStorageService.clearAuthTokens();
          return null;
        }

        const refreshUrl = `${this.baseUrl}/auth/refresh`;
        const res = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          await SecureStorageService.clearAuthTokens();
          return null;
        }

        const data = await res.json();
        const tokens = data.data || data;

        if (tokens.accessToken && tokens.refreshToken) {
          await SecureStorageService.setAccessToken(tokens.accessToken);
          await SecureStorageService.setRefreshToken(tokens.refreshToken);
          return tokens.accessToken as string;
        }

        await SecureStorageService.clearAuthTokens();
        return null;
      } catch {
        await SecureStorageService.clearAuthTokens();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // HTTP Helper Methods
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let message = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;
    let validationErrors: Record<string, string[]> | undefined;

    try {
      const errorJson = await response.json();
      message = errorJson.message || errorJson.error || message;
      errorCode = errorJson.errorCode || errorJson.code;
      validationErrors = errorJson.errors;
    } catch {
      // Body is not JSON
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 403:
        throw new AuthorizationError(message);
      case 404:
        throw new NotFoundError(message);
      case 422:
      case 400:
        throw new ValidationError(message, validationErrors);
      default:
        throw new ApiError(message, response.status, errorCode, validationErrors);
    }
  }
}

export const apiClient = new ApiClient();
