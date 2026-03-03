/**
 * Authentication Utilities (Harmonized)
 * 
 * Centralized authentication logic including JWT handling,
 * session verification, and security utilities.
 * 
 * Shared between Dashboard and Checkin repositories.
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
 * Gets and validates the JWT secret from environment
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    console.warn(
      '⚠️ WARNING: Using default JWT secret. Set JWT_SECRET in environment variables.'
    );
    return 'development-only-secret-do-not-use-in-production-min-32-chars';
  }

  return secret;
}

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  EXPIRES_IN: '7d' as const,
  COOKIE_NAME: 'auth-token' as const,
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
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
        error: { type: 'expired', message: 'Authentication token has expired' },
      };
    }

    if (error instanceof JsonWebTokenError) {
      return {
        valid: false,
        error: { type: 'invalid', message: 'Authentication token is invalid' },
      };
    }

    return {
      valid: false,
      error: { type: 'invalid', message: 'Failed to verify authentication token' },
    };
  }
}

/**
 * Generates a JWT token
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
 */
export async function verifySession(
  request: NextRequest
): Promise<SessionVerificationResult> {
  const tokenResult = verifyRequestToken(request);

  if (!tokenResult.valid) {
    return {
      valid: false,
      error: tokenResult.error.message,
    };
  }

  const { userId, email, role } = tokenResult.payload;

  try {
    const client = await clientPromise;
    const db = client.db('hackoverflow');

    let user;
    if (role === 'participant') {
      user = await db.collection('participants').findOne({
        participantId: userId
      });
    } else {
      try {
        user = await db.collection('users').findOne({
          _id: new ObjectId(userId),
          email: email,
        });
      } catch {
        return { valid: false, error: 'Invalid session' };
      }
    }

    if (!user) {
      return { valid: false, error: 'User not found' };
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
    return { valid: false, error: 'Failed to verify session' };
  }
}

/**
 * Creates secure cookie options for the auth token
 */
export function getSecureCookieOptions(): {
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
    maxAge: JWT_CONFIG.COOKIE_MAX_AGE,
    path: '/',
  };
}

/**
 * Creates cookie options for clearing the auth token
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
    maxAge: 0,
    path: '/',
  };
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};
