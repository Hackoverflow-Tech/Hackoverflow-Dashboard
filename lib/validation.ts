/**
 * Validation Schemas and Utilities
 * 
 * Centralized validation using Zod for type-safe request validation.
 * Harmonized between Dashboard and Checkin repositories.
 * 
 * @module lib/validation
 */

import { z } from 'zod';

// ============================================================================
// Auth & User Schemas (Shared with Dashboard)
// ============================================================================

/**
 * Email validation regex
 * Follows RFC 5322 simplified pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PASSWORD_MAX_LENGTH = 128;

/**
 * Login request validation schema
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

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * JWT payload validation schema
 */
export const JWTPayloadSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email in token'),
  name: z.string().optional(),
  role: z.enum(['admin', 'user', 'moderator', 'participant']).default('admin'),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

/**
 * User document schema (for admin/moderator users)
 */
export const UserDocumentSchema = z.object({
  _id: z.any(), // MongoDB ObjectId
  email: z.string().email(),
  password: z.string(),
  name: z.string().optional(),
  role: z.enum(['admin', 'user', 'moderator']).default('admin'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isActive: z.boolean().default(true),
});

export type UserDocument = z.infer<typeof UserDocumentSchema>;

// ============================================================================
// Participant Schemas (Shared)
// ============================================================================

/**
 * WiFi credentials schema
 */
export const WifiCredentialsSchema = z.object({
  ssid: z.string().optional(),
  password: z.string().optional(),
});

/**
 * Check-in status schema
 */
export const CheckInStatusSchema = z.object({
  status: z.boolean(),
  time: z.date().optional(),
});

/**
 * Database participant schema
 */
export const DBParticipantSchema = z.object({
  _id: z.any().optional(),
  participantId: z.string().min(1, 'Participant ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.string().optional(),
  teamName: z.string().optional(),
  teamId: z.string().optional(),
  institute: z.string().optional(),
  labAllotted: z.string().optional(),
  roomNo: z.string().optional(),
  loginPassword: z.string().optional(),
  wifiCredentials: WifiCredentialsSchema.optional(),
  collegeCheckIn: CheckInStatusSchema.optional(),
  labCheckIn: CheckInStatusSchema.optional(),
  collegeCheckOut: CheckInStatusSchema.optional(), // Added for Dashboard compatibility
  tempLabCheckOut: CheckInStatusSchema.optional(), // Added for Dashboard compatibility
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type WifiCredentials = z.infer<typeof WifiCredentialsSchema>;
export type CheckInStatus = z.infer<typeof CheckInStatusSchema>;
export type DBParticipant = z.infer<typeof DBParticipantSchema>;

/**
 * Client-safe participant schema
 */
export const ClientParticipantSchema = z.object({
  participantId: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  role: z.string().optional(),
  teamName: z.string().optional(),
  teamId: z.string().optional(),
  institute: z.string().optional(),
  labAllotted: z.string().optional(),
  roomNo: z.string().optional(),
  wifiCredentials: WifiCredentialsSchema.optional(),
  collegeCheckIn: z.object({
    status: z.boolean(),
    time: z.string().optional(),
  }).optional(),
  labCheckIn: z.object({
    status: z.boolean(),
    time: z.string().optional(),
  }).optional(),
});

export type ClientParticipant = z.infer<typeof ClientParticipantSchema>;

export const CheckInTypeSchema = z.enum(['collegeCheckIn', 'labCheckIn']);
export type CheckInType = z.infer<typeof CheckInTypeSchema>;

export const CheckInInputSchema = z.object({
  email: z.string().email().optional(),
  participantId: z.string().optional(),
  checkInType: CheckInTypeSchema,
}).refine(data => data.email || data.participantId, {
  message: "Either email or participantId must be provided",
  path: ["email"]
});

export type CheckInInput = z.infer<typeof CheckInInputSchema>;

// ============================================================================
// API & Session Schemas
// ============================================================================

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
 * Generic result type for validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: z.ZodError };

/**
 * Safely validates data against a schema
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: result.error };
}

/**
 * Formats Zod validation errors
 */
export function formatValidationErrors(error: z.ZodError): {
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  const issues = error.issues ?? [];
  const details = issues.map((issue) => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message,
  }));
  return { message: details[0]?.message ?? 'Validation failed', details };
}

/**
 * Sanitizes a string (Shared)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}
