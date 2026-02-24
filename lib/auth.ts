/**
 * Authentication Utilities
 * 
 * Centralized authentication logic including JWT handling,
 * session verification, and security utilities.
 * 
 * @module lib/auth
 */

import type { NextRequest } from 'next/server';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { z } from 'zod';
import { JWTPayloadSchema, type JWTPayload } from './validation';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

/**
 * Environment configuration with validation
 */
const EnvSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Gets and validates the JWT secret from environment
 * Throws an error in production if not properly configured
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    // Development fallback with warning
    console.warn(
      '⚠️ WARNING: Using default JWT secret. Set JWT_SECRET in environment variables.'
    );
    return 'development-only-secret-do-not-use-in-production-min-32-chars';
  }
  
  if (secret.length < 32) {
    console.warn('⚠️ WARNING: JWT_SECRET should be at least 32 characters for security');
  }
  
  return secret;
}

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  /** Token expiration time */
  EXPIRES_IN: '7d' as const,
  /** Cookie name for auth token */
  COOKIE_NAME: 'auth-token' as const,
  /** Cookie max age in seconds (7 days) */
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
  /** Algorithm used for signing */
  ALGORITHM: 'HS256' as const,
} as const;

/**
 * Result type for token verification
 */
export type TokenVerificationResult =
  | { valid: true; payload: JWTPayload }
  | { valid: false; error: TokenError };

/**
 * Token error types
 */
export type TokenError =
  | { type: 'missing'; message: string }
  | { type: 'expired'; message: string }
  | { type: 'invalid'; message: string }
  | { type: 'malformed'; message: string };

/**
 * Extracts and verifies JWT token from request cookies
 * 
 * @param request - Next.js request object
 * @returns Token verification result with payload or error
 * 
 * @example
 * ```typescript
 * const result = verifyRequestToken(request);
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error.message }, { status: 401 });
 * }
 * const { userId, email } = result.payload;
 * ```
 */
export function verifyRequestToken(request: NextRequest): TokenVerificationResult {
  const token = request.cookies.get(JWT_CONFIG.COOKIE_NAME)?.value;
  
  if (!token) {
    return {
      valid: false,
      error: {
        type: 'missing',
        message: 'Authentication token is required',
      },
    };
  }
  
  return verifyToken(token);
}

/**
 * Verifies a JWT token string
 * 
 * @param token - JWT token string
 * @returns Token verification result
 */
export function verifyToken(token: string): TokenVerificationResult {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    });
    
    // Validate the decoded payload structure
    const payloadResult = JWTPayloadSchema.safeParse(decoded);
    
    if (!payloadResult.success) {
      return {
        valid: false,
        error: {
          type: 'malformed',
          message: 'Token payload is malformed',
        },
      };
    }
    
    return {
      valid: true,
      payload: payloadResult.data,
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        valid: false,
        error: {
          type: 'expired',
          message: 'Authentication token has expired',
        },
      };
    }
    
    if (error instanceof JsonWebTokenError) {
      return {
        valid: false,
        error: {
          type: 'invalid',
          message: 'Authentication token is invalid',
        },
      };
    }
    
    return {
      valid: false,
      error: {
        type: 'invalid',
        message: 'Failed to verify authentication token',
      },
    };
  }
}

/**
 * Generates a JWT token for a user
 * 
 * @param payload - User data to include in token
 * @returns Signed JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const secret = getJWTSecret();
  
  return jwt.sign(payload, secret, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
}

/**
 * Session verification result
 */
export type SessionVerificationResult =
  | { valid: true; user: SessionUser }
  | { valid: false; error: string };

/**
 * Verified session user data
 */
export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

/**
 * Verifies a session by checking both the token and the database
 * 
 * This provides an additional layer of security by ensuring:
 * 1. The token is valid and not expired
 * 2. The user still exists in the database
 * 3. The user account is still active
 * 
 * @param request - Next.js request object
 * @returns Session verification result with user data or error
 */
export async function verifySession(
  request: NextRequest
): Promise<SessionVerificationResult> {
  // First, verify the token
  const tokenResult = verifyRequestToken(request);
  
  if (!tokenResult.valid) {
    return {
      valid: false,
      error: tokenResult.error.message,
    };
  }
  
  const { userId, email, role } = tokenResult.payload;
  
  try {
    // Verify user exists in database
    const client = await clientPromise;
    const db = client.db('hackoverflow');
    
    let user;
    try {
      user = await db.collection('users').findOne({
        _id: new ObjectId(userId),
        email: email, // Extra verification
      });
    } catch {
      // Invalid ObjectId format
      return {
        valid: false,
        error: 'Invalid session',
      };
    }
    
    if (!user) {
      return {
        valid: false,
        error: 'User not found',
      };
    }
    
    // Check if user is active (if field exists)
    if (user.isActive === false) {
      return {
        valid: false,
        error: 'Account is deactivated',
      };
    }
    
    return {
      valid: true,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role ?? role,
      },
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return {
      valid: false,
      error: 'Failed to verify session',
    };
  }
}

/**
 * Creates secure cookie options for the auth token
 * 
 * @returns Cookie options object
 */
export function getSecureCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: JWT_CONFIG.COOKIE_MAX_AGE,
    path: '/',
  };
}

/**
 * Creates cookie options for clearing the auth token
 * 
 * @returns Cookie options for deletion
 */
export function getClearCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  };
}

/**
 * Security headers to include in API responses
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};
