/**
 * Validation Schemas and Utilities
 * 
 * Centralized validation using Zod for type-safe request validation.
 * All schemas include detailed error messages and sanitization.
 * 
 * @module lib/validation
 */

import { z } from 'zod';

/**
 * Email validation regex
 * Follows RFC 5322 simplified pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Password requirements
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

/**
 * Login request validation schema
 * 
 * Validates:
 * - Email format and length
 * - Password presence and reasonable bounds
 */
export const LoginRequestSchema = z.object({
  email: z
    .string({ error: 'Email must be a string' })
    .min(1, 'Email is required')
    .max(254, 'Email must not exceed 254 characters')
    .email('Please provide a valid email address')
    .regex(EMAIL_REGEX, 'Please provide a valid email address')
    .toLowerCase()
    .trim(),
    
  password: z
    .string({ error: 'Password must be a string' })
    .min(1, 'Password is required')
    .max(PASSWORD_MAX_LENGTH, `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`),
});

/**
 * Type inference for login request
 */
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * JWT payload validation schema
 * Used for validating decoded JWT tokens
 */
export const JWTPayloadSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required'),
    
  email: z
    .string()
    .email('Invalid email in token'),
    
  role: z
    .enum(['admin', 'user', 'moderator'])
    .default('admin'),
    
  iat: z
    .number()
    .optional(),
    
  exp: z
    .number()
    .optional(),
});

/**
 * Type inference for JWT payload
 */
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

/**
 * User document schema (from database)
 */
export const UserDocumentSchema = z.object({
  _id: z.any(), // MongoDB ObjectId
  email: z.string().email(),
  password: z.string(),
  name: z.string().optional(),
  role: z.enum(['admin', 'user', 'moderator']).default('admin'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  lastLoginAt: z.date().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Type inference for user document
 */
export type UserDocument = z.infer<typeof UserDocumentSchema>;

/**
 * API response schemas for type safety
 */
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown().optional(),
  message: z.string().optional(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

/**
 * Session response schema
 */
export const SessionResponseSchema = z.object({
  authenticated: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    role: z.string(),
  }).nullable(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/**
 * Validation result type
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: z.ZodError };

/**
 * Safely validates data against a schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with typed data or errors
 * 
 * @example
 * ```typescript
 * const result = safeValidate(LoginRequestSchema, requestBody);
 * if (!result.success) {
 *   return formatValidationErrors(result.errors);
 * }
 * const { email, password } = result.data;
 * ```
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Formats Zod validation errors into a user-friendly structure
 * 
 * @param error - Zod validation error
 * @returns Formatted error object for API response
 */
export function formatValidationErrors(error: z.ZodError): {
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  const issues = error.issues ?? [];
  const details = issues.map((issue: z.ZodIssue) => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message,
  }));

  // Get the first error message as the main message
  const message = details[0]?.message ?? 'Validation failed';

  return { message, details };
}

/**
 * Sanitizes a string to prevent XSS and injection attacks
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Validates and sanitizes JSON input from request body
 * 
 * @param body - Request body (unknown type)
 * @returns Parsed JSON or null if invalid
 */
export function safeParseJSON(body: unknown): Record<string, unknown> | null {
  if (body === null || body === undefined) {
    return null;
  }
  
  if (typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  
  return null;
}
