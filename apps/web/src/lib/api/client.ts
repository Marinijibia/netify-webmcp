import { WebStorageService } from './storage';
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

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl = DEFAULT_API_URL, defaultTimeoutMs = 45000) {
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
      const token = WebStorageService.getAccessToken();
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
        data: json as T,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request to ${endpoint} timed out after ${timeoutMs}ms`);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Unable to connect to the Netify API server.');
      }

      throw error;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = WebStorageService.getRefreshToken();
        if (!refreshToken) {
          WebStorageService.clearAll();
          return null;
        }

        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          WebStorageService.clearAll();
          return null;
        }

        const json = await response.json();
        const payload = json.data || json;
        const newAccessToken = payload.accessToken || payload.tokens?.accessToken;
        const newRefreshToken = payload.refreshToken || payload.tokens?.refreshToken;

        if (newAccessToken) {
          WebStorageService.setAccessToken(newAccessToken);
          if (newRefreshToken) {
            WebStorageService.setRefreshToken(newRefreshToken);
          }
          return newAccessToken;
        }

        WebStorageService.clearAll();
        return null;
      } catch (err) {
        console.error('Silent token refresh failed:', err);
        WebStorageService.clearAll();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || 'An unexpected error occurred' };
    }

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `HTTP ${response.status}: ${response.statusText}`;
    const errorCode = errorData?.error?.errorCode || errorData?.errorCode;
    const validationErrors = errorData?.errors || errorData?.validationErrors;

    switch (response.status) {
      case 400:
        throw new ValidationError(message, validationErrors);
      case 401:
        throw new AuthenticationError(message);
      case 403:
        throw new AuthorizationError(message);
      case 404:
        throw new NotFoundError(message);
      case 422:
        throw new ValidationError(message, validationErrors);
      default:
        throw new ApiError(message, response.status, errorCode, validationErrors);
    }
  }

  private buildQueryString(
    params: Record<string, string | number | boolean | undefined>
  ): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  get<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
