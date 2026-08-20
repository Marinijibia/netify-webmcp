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

  constructor(baseUrl = env.apiUrl, defaultTimeoutMs = 15000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      const json = await response.json();
      return (json.data !== undefined ? json.data : json) as T;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request to ${endpoint} timed out after ${timeoutMs}ms`);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Unable to connect to the Netify server.');
      }

      throw error;
    }
  }

  // HTTP Helper Methods
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
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
