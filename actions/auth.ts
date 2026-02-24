'use server';

/**
 * Auth Server Actions
 *
 * Server-side mutations for authentication with rate limiting.
 * Uses cookies() from next/headers to read/write HTTP-only cookies
 * instead of relying on API routes.
 * 
 * Benefits over API routes:
 * - Better type safety
 * - Automatic CSRF protection
 * - No manual Response handling
 * - Integrated with React Server Components
 *
 * @module actions/auth
 */

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import {
  generateToken,
  verifyToken,
  getSecureCookieOptions,
  getClearCookieOptions,
  JWT_CONFIG,
  type SessionUser,
} from '@/lib/auth';
import {
  LoginRequestSchema,
  safeValidate,
  formatValidationErrors,
} from '@/lib/validation';
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimitPresets,
} from '@/lib/rate-limiter';
import { ObjectId } from 'mongodb';

// ── Result types ────────────────────────────────────────────

interface LoginActionResult {
  readonly success: boolean;
  readonly error?: string;
  readonly rateLimitExceeded?: boolean;
  readonly user?: {
    readonly id: string;
    readonly email: string;
    readonly name?: string;
    readonly role: string;
  };
}

interface SessionActionResult {
  readonly authenticated: boolean;
  readonly user: SessionUser | null;
}

interface LogoutActionResult {
  readonly success: boolean;
  readonly error?: string;
  readonly rateLimitExceeded?: boolean;
}

/**
 * Get client identifier for rate limiting in server actions
 * In production, you might want to use more sophisticated tracking
 */
function getClientIdForAction(): string {
  // For server actions, we'll use a simple identifier
  // Note: Request context is not directly available in server actions
  return 'server-action:general';
}

// ── Login Action ────────────────────────────────────────────

/**
 * Server Action: Authenticate user with email & password.
 *
 * Validates credentials, checks the database, generates a JWT,
 * and sets an HTTP-only auth cookie with rate limiting.
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginActionResult> {
  try {
    // Step 1: Rate limiting check
    const clientId = getClientIdForAction();
    const rateLimitResult = checkRateLimit(clientId, RateLimitPresets.LOGIN);
    
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: `Too many login attempts. Try again in ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds.`,
        rateLimitExceeded: true,
      };
    }

    // Step 2: Validate input with Zod
    const validationResult = safeValidate(LoginRequestSchema, { email, password });

    if (!validationResult.success) {
      const { message } = formatValidationErrors(validationResult.errors);
      return { success: false, error: message };
    }

    const validatedEmail = validationResult.data.email;
    const validatedPassword = validationResult.data.password;

    // Step 3: Find user in database
    const client = await clientPromise;
    const db = client.db('hackoverflow');

    const user = await db.collection('users').findOne(
      { email: validatedEmail },
      {
        projection: {
          _id: 1,
          email: 1,
          password: 1,
          name: 1,
          role: 1,
          isActive: 1,
        },
      }
    );

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Step 4: Check if account is active
    if (user.isActive === false) {
      return { success: false, error: 'Account is deactivated' };
    }

    // Step 5: Verify password
    const isValidPassword = await bcrypt.compare(validatedPassword, user.password);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Step 6: Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role ?? 'admin',
    });

    // Step 7: Update last login (fire-and-forget)
    db.collection('users')
      .updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } })
      .catch((err) => console.error('Failed to update lastLoginAt:', err));

    // Step 8: Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(JWT_CONFIG.COOKIE_NAME, token, getSecureCookieOptions());

    // Step 9: Return success with user data
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role ?? 'admin',
    };

    return { success: true, user: userData };
  } catch (error) {
    console.error('Login action error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// ── Session Check Action ────────────────────────────────────

/**
 * Server Action: Verify the current session.
 *
 * Reads the auth cookie, verifies the JWT, and checks
 * that the user still exists and is active in the database.
 */
export async function checkSessionAction(): Promise<SessionActionResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(JWT_CONFIG.COOKIE_NAME)?.value;

    if (!token) {
      return { authenticated: false, user: null };
    }

    // Verify token
    const tokenResult = verifyToken(token);
    if (!tokenResult.valid) {
      return { authenticated: false, user: null };
    }

    const { userId, email, role } = tokenResult.payload;

    // Verify user in database
    const client = await clientPromise;
    const db = client.db('hackoverflow');

    let user;
    try {
      user = await db.collection('users').findOne({
        _id: new ObjectId(userId),
        email,
      });
    } catch {
      return { authenticated: false, user: null };
    }

    if (!user || user.isActive === false) {
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role ?? role,
      },
    };
  } catch (error) {
    console.error('Session check error:', error);
    return { authenticated: false, user: null };
  }
}

// ── Logout Action ───────────────────────────────────────────

/**
 * Server Action: Log out the current user.
 *
 * Clears the auth cookie by setting it to expire immediately with rate limiting.
 */
export async function logoutAction(): Promise<LogoutActionResult> {
  try {
    // Step 1: Rate limiting check
    const clientId = getClientIdForAction();
    const rateLimitResult = checkRateLimit(clientId, RateLimitPresets.AUTH);
    
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: `Too many requests. Try again in ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds.`,
        rateLimitExceeded: true,
      };
    }

    const cookieStore = await cookies();

    // Step 2: Optionally log the logout
    const token = cookieStore.get(JWT_CONFIG.COOKIE_NAME)?.value;
    if (token) {
      const tokenResult = verifyToken(token);
      if (tokenResult.valid) {
        console.info(
          `[Logout] User ${tokenResult.payload.userId} (${tokenResult.payload.email}) logged out`
        );
      }
    }

    // Step 3: Clear the auth cookie
    cookieStore.set(JWT_CONFIG.COOKIE_NAME, '', getClearCookieOptions());

    return { success: true };
  } catch (error) {
    console.error('Logout action error:', error);
    return { success: false, error: 'An unexpected error occurred during logout' };
  }
}

