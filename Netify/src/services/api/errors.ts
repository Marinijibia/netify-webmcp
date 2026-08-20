export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode?: string;
  readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    validationErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.validationErrors = validationErrors;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network connection failed. Please check your internet.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'The request timed out. Please try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required or session expired.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Invalid request parameters.', errors?: Record<string, string[]>) {
    super(message, 422, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
