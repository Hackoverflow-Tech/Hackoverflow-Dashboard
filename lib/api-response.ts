/**
 * API Response Utilities
 * 
 * Standardized response helpers for consistent API responses
 * with proper typing, security headers, and error handling.
 * 
 * @module lib/api-response
 */

import { NextResponse } from 'next/server';
import { SECURITY_HEADERS } from './auth';
import { 
  createRateLimitHeaders, 
  type RateLimitResult, 
  type RateLimitConfig 
} from './rate-limiter';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Response options for customization
 */
export interface ResponseOptions {
  /** HTTP status code */
  status?: number;
  /** Rate limit result for headers */
  rateLimit?: {
    result: RateLimitResult;
    config: RateLimitConfig;
  };
  /** Additional headers to include */
  headers?: Record<string, string>;
  /** Skip security headers (not recommended) */
  skipSecurityHeaders?: boolean;
}

/**
 * Creates a successful JSON response with security headers
 * 
 * @param data - Response data
 * @param options - Response options
 * @returns NextResponse with proper headers
 * 
 * @example
 * ```typescript
 * return successResponse({
 *   user: { id: '123', email: 'user@example.com' }
 * }, { status: 200 });
 * ```
 */
export function successResponse<T>(
  data: T,
  options: ResponseOptions = {}
): NextResponse {
  const { status = 200, rateLimit, headers = {}, skipSecurityHeaders = false } = options;

  const responseBody: ApiResponse<T> = {
    success: true,
    data,
  };

  const allHeaders: Record<string, string> = {
    ...(skipSecurityHeaders ? {} : SECURITY_HEADERS),
    ...(rateLimit ? createRateLimitHeaders(rateLimit.result, rateLimit.config) : {}),
    ...headers,
  };

  return NextResponse.json(responseBody, {
    status,
    headers: allHeaders,
  });
}

/**
 * Creates a successful JSON response with a message
 * 
 * @param message - Success message
 * @param data - Optional additional data
 * @param options - Response options
 * @returns NextResponse with proper headers
 */
export function successMessageResponse(
  message: string,
  data?: unknown,
  options: ResponseOptions = {}
): NextResponse {
  const { status = 200, rateLimit, headers = {}, skipSecurityHeaders = false } = options;

  const responseBody: ApiResponse = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };

  const allHeaders: Record<string, string> = {
    ...(skipSecurityHeaders ? {} : SECURITY_HEADERS),
    ...(rateLimit ? createRateLimitHeaders(rateLimit.result, rateLimit.config) : {}),
    ...headers,
  };

  return NextResponse.json(responseBody, {
    status,
    headers: allHeaders,
  });
}

/**
 * Creates an error JSON response with security headers
 * 
 * @param message - Error message
 * @param options - Response options with optional error details
 * @returns NextResponse with proper headers
 * 
 * @example
 * ```typescript
 * return errorResponse('Invalid credentials', { status: 401 });
 * ```
 */
export function errorResponse(
  message: string,
  options: ResponseOptions & {
    code?: string;
    details?: Array<{ field: string; message: string }>;
  } = {}
): NextResponse {
  const { 
    status = 400, 
    code, 
    details, 
    rateLimit, 
    headers = {}, 
    skipSecurityHeaders = false 
  } = options;

  const responseBody: ApiResponse = {
    success: false,
    error: message,
    ...(code && { code }),
    ...(details && { details }),
  };

  const allHeaders: Record<string, string> = {
    ...(skipSecurityHeaders ? {} : SECURITY_HEADERS),
    ...(rateLimit ? createRateLimitHeaders(rateLimit.result, rateLimit.config) : {}),
    ...headers,
  };

  return NextResponse.json(responseBody, {
    status,
    headers: allHeaders,
  });
}

/**
 * Creates a rate limit exceeded response
 * 
 * @param result - Rate limit check result
 * @param config - Rate limit configuration
 * @returns NextResponse with 429 status and retry headers
 */
export function rateLimitResponse(
  result: RateLimitResult,
  config: RateLimitConfig
): NextResponse {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  
  return errorResponse(
    'Too many requests. Please try again later.',
    {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      rateLimit: { result, config },
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

/**
 * Creates a validation error response
 * 
 * @param message - Main error message
 * @param details - Field-level validation errors
 * @param options - Additional response options
 * @returns NextResponse with 400 status
 */
export function validationErrorResponse(
  message: string,
  details: Array<{ field: string; message: string }>,
  options: ResponseOptions = {}
): NextResponse {
  return errorResponse(message, {
    ...options,
    status: 400,
    code: 'VALIDATION_ERROR',
    details,
  });
}

/**
 * Creates an unauthorized response
 * 
 * @param message - Error message
 * @param options - Additional response options
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized',
  options: ResponseOptions = {}
): NextResponse {
  return errorResponse(message, {
    ...options,
    status: 401,
    code: 'UNAUTHORIZED',
  });
}

/**
 * Creates a forbidden response
 * 
 * @param message - Error message
 * @param options - Additional response options
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(
  message: string = 'Forbidden',
  options: ResponseOptions = {}
): NextResponse {
  return errorResponse(message, {
    ...options,
    status: 403,
    code: 'FORBIDDEN',
  });
}

/**
 * Creates a not found response
 * 
 * @param message - Error message
 * @param options - Additional response options
 * @returns NextResponse with 404 status
 */
export function notFoundResponse(
  message: string = 'Not found',
  options: ResponseOptions = {}
): NextResponse {
  return errorResponse(message, {
    ...options,
    status: 404,
    code: 'NOT_FOUND',
  });
}

/**
 * Creates an internal server error response
 * 
 * Logs the actual error for debugging while returning
 * a generic message to the client for security.
 * 
 * @param error - The actual error (logged, not returned)
 * @param options - Additional response options
 * @returns NextResponse with 500 status
 */
export function internalErrorResponse(
  error: unknown,
  options: ResponseOptions = {}
): NextResponse {
  // Log the actual error for debugging
  console.error('[API Error]', error);
  
  return errorResponse(
    'An unexpected error occurred. Please try again later.',
    {
      ...options,
      status: 500,
      code: 'INTERNAL_ERROR',
    }
  );
}

/**
 * HTTP method not allowed response
 * 
 * @param allowedMethods - Array of allowed HTTP methods
 * @returns NextResponse with 405 status
 */
export function methodNotAllowedResponse(
  allowedMethods: string[]
): NextResponse {
  return errorResponse(
    `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    {
      status: 405,
      code: 'METHOD_NOT_ALLOWED',
      headers: {
        'Allow': allowedMethods.join(', '),
      },
    }
  );
}
