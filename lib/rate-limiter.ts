/**
 * Rate Limiter Implementation
 * 
 * A sliding window rate limiter for API routes using in-memory storage.
 * For production at scale, consider using Redis-based rate limiting.
 * 
 * @module lib/rate-limiter
 */

import type { NextRequest } from 'next/server';

/**
 * Configuration options for rate limiting
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  readonly maxRequests: number;
  /** Time window in milliseconds */
  readonly windowMs: number;
  /** Optional identifier prefix for different route groups */
  readonly keyPrefix?: string;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  readonly allowed: boolean;
  /** Number of remaining requests in the current window */
  readonly remaining: number;
  /** Unix timestamp when the rate limit resets */
  readonly resetTime: number;
  /** Total requests made in current window */
  readonly currentCount: number;
}

/**
 * Internal structure for tracking request timestamps
 */
interface RateLimitEntry {
  timestamps: number[];
  lastCleanup: number;
}

/**
 * In-memory store for rate limiting
 * Key format: `${keyPrefix}:${identifier}`
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup interval for expired entries (5 minutes)
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Extracts a unique identifier from the request for rate limiting
 * 
 * Priority:
 * 1. X-Forwarded-For header (for proxied requests)
 * 2. X-Real-IP header
 * 3. Connection remote address (fallback)
 * 
 * @param request - The incoming Next.js request
 * @returns A string identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Check for forwarded IP (common with proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    const clientIp = forwardedFor.split(',')[0]?.trim();
    if (clientIp) return clientIp;
  }

  // Check for X-Real-IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback to a hash of user agent + some request info
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const acceptLanguage = request.headers.get('accept-language') ?? 'unknown';
  
  // Create a simple hash for anonymous identification
  return `anon:${simpleHash(userAgent + acceptLanguage)}`;
}

/**
 * Simple string hash function for fallback identification
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Cleans up old entries from the rate limit store
 * Called periodically to prevent memory leaks
 */
function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now();
  const cutoff = now - windowMs;

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    
    // Remove entries with no remaining timestamps
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Checks and updates rate limit for a given identifier
 * 
 * Uses a sliding window algorithm:
 * - Tracks individual request timestamps
 * - Counts requests within the sliding window
 * - Automatically cleans up old timestamps
 * 
 * @param identifier - Unique identifier for the client
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 * 
 * @example
 * ```typescript
 * const result = checkRateLimit('192.168.1.1', {
 *   maxRequests: 5,
 *   windowMs: 60000,
 *   keyPrefix: 'login'
 * });
 * 
 * if (!result.allowed) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowMs, keyPrefix = 'default' } = config;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create entry
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = {
      timestamps: [],
      lastCleanup: now,
    };
    rateLimitStore.set(key, entry);
  }

  // Periodic cleanup of all entries
  if (now - entry.lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanupExpiredEntries(windowMs);
    entry.lastCleanup = now;
  }

  // Filter timestamps within the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Check if rate limit exceeded
  const currentCount = entry.timestamps.length;
  const allowed = currentCount < maxRequests;

  if (allowed) {
    // Record this request
    entry.timestamps.push(now);
  }

  // Calculate reset time (when the oldest request in window expires)
  const oldestTimestamp = entry.timestamps[0] ?? now;
  const resetTime = oldestTimestamp + windowMs;

  return {
    allowed,
    remaining: Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0)),
    resetTime,
    currentCount: currentCount + (allowed ? 1 : 0),
  };
}

/**
 * Creates rate limit headers for the response
 * 
 * @param result - The rate limit check result
 * @param config - The rate limit configuration
 * @returns Headers object with rate limit information
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'Retry-After': result.allowed 
      ? '0' 
      : Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RateLimitPresets = {
  /** Strict rate limiting for authentication endpoints (5 req/min) */
  AUTH: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    keyPrefix: 'auth',
  },
  
  /** Very strict rate limiting for login attempts (3 req/min) */
  LOGIN: {
    maxRequests: 3,
    windowMs: 60 * 1000,
    keyPrefix: 'login',
  },
  
  /** Standard API rate limiting (100 req/min) */
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    keyPrefix: 'api',
  },
  
  /** Lenient rate limiting for read operations (200 req/min) */
  READ: {
    maxRequests: 200,
    windowMs: 60 * 1000,
    keyPrefix: 'read',
  },
  
  /** Moderate rate limiting for email sending (10 req/hour) */
  SEND_EMAIL: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'email',
  },
} as const satisfies Record<string, RateLimitConfig>;
