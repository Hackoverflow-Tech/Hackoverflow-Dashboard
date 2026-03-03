/**
 * In-Memory Sliding Window Rate Limiter (Harmonized)
 * 
 * Harmonzied across Dashboard and Checkin repositories to provide
 * identical rate limiting logic.
 * 
 * Note: This implementation is local to the server process.
 * 
 * @module lib/rate-limiter
 */

import { NextRequest } from 'next/server';

// Rate limit configuration options
export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly keyPrefix?: string;
}

// Result of a rate limit check
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetTime: number;
  readonly currentCount: number;
}

/**
 * In-memory store for rate limit windows
 */
const rateLimitStore = new Map<string, number[]>();

// Cleanup interval to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore.entries()) {
    if (timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Every 5 minutes

/**
 * Extracts a unique identifier from the request
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const clientIp = forwardedFor.split(',')[0]?.trim();
    if (clientIp) return clientIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'anonymous';
}

/**
 * Checks and updates rate limit using In-Memory Sliding Window
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, keyPrefix = 'default' } = config;
  const key = `ratelimit:${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = rateLimitStore.get(key) || [];

  // 1. Remove timestamps outside the sliding window
  timestamps = timestamps.filter(ts => ts > windowStart);

  // 2. Check if allowed
  const count = timestamps.length;
  const allowed = count < maxRequests;

  if (allowed) {
    // 3. Record current hit
    timestamps.push(now);
  }

  // 4. Update store
  rateLimitStore.set(key, timestamps);

  // 5. Calculate reset time
  const oldestTs = timestamps.length > 0 ? timestamps[0] : now;
  const resetTime = oldestTs + windowMs;

  return {
    allowed,
    remaining: Math.max(0, maxRequests - timestamps.length),
    resetTime,
    currentCount: timestamps.length,
  };
}

/**
 * Standard headers creator
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
 * Preset Rate limiters (Shared Logic)
 */
export const RateLimitPresets = {
  AUTH: { maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'auth' },
  LOGIN: { maxRequests: 3, windowMs: 60 * 1000, keyPrefix: 'login' },
  API: { maxRequests: 100, windowMs: 60 * 1000, keyPrefix: 'api' },
  READ: { maxRequests: 200, windowMs: 60 * 1000, keyPrefix: 'read' },
  SEND_EMAIL: { maxRequests: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'email' },
} as const;
