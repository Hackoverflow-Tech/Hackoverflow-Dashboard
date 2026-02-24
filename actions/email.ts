'use server';

/**
 * Email Server Actions
 *
 * Replaces the send-emails API route with secure server actions for:
 * - Batch email sending with authentication
 * - Input validation and rate limiting
 * - Type-safe email operations
 *
 * Benefits over API routes:
 * - Better type safety
 * - Automatic CSRF protection
 * - Integrated authentication
 * - Simplified error handling
 *
 * @module actions/email
 */

import { sendBatchEmails, isValidEmail } from '@/lib/email';
import { checkSessionAction } from './auth';
import {
  checkRateLimit,
  RateLimitPresets,
} from '@/lib/rate-limiter';
import type { Participant, EmailResult } from '@/types';

/**
 * Email action response type
 */
interface SendEmailActionResult {
  readonly success: boolean;
  readonly message: string;
  readonly sent: number;
  readonly failed: number;
  readonly rateLimitExceeded?: boolean;
}

/**
 * Get client identifier for rate limiting in server actions
 */
function getClientIdForAction(): string {
  return 'server-action:email';
}

/**
 * Server Action: Send batch emails to participants with enhanced security.
 *
 * Validates inputs server-side, checks authentication, applies rate limiting,
 * and dispatches emails. Replaces POST /api/send-emails.
 *
 * @param subject - Email subject line
 * @param htmlContent - HTML email body with {{variable}} placeholders
 * @param recipients - Array of participant data
 * @returns Result with sent/failed counts and status message
 *
 * @example Usage in component:
 * ```tsx
 * async function handleSendEmails() {
 *   const result = await sendEmailsAction(subject, content, participants);
 *   if (result.success) {
 *     console.log(`Sent ${result.sent} emails`);
 *   } else {
 *     console.error(result.message);
 *   }
 * }
 * ```
 */
export async function sendEmailsAction(
  subject: string,
  htmlContent: string,
  recipients: Participant[]
): Promise<SendEmailActionResult> {
  try {
    // Step 1: Rate limiting check
    const clientId = getClientIdForAction();
    const rateLimitResult = checkRateLimit(clientId, RateLimitPresets.SEND_EMAIL);
    
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Too many email requests. Try again in ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds.`,
        sent: 0,
        failed: 0,
        rateLimitExceeded: true,
      };
    }

    // Step 2: Authentication check
    const session = await checkSessionAction();
    if (!session.authenticated) {
      return {
        success: false,
        message: 'Authentication required to send emails',
        sent: 0,
        failed: 0,
      };
    }

    // Step 3: Input validation
    if (!subject?.trim()) {
      return { 
        success: false, 
        message: 'Subject is required', 
        sent: 0, 
        failed: 0 
      };
    }

    if (!htmlContent?.trim()) {
      return { 
        success: false, 
        message: 'Email content is required', 
        sent: 0, 
        failed: 0 
      };
    }

    if (!recipients || recipients.length === 0) {
      return { 
        success: false, 
        message: 'At least one recipient is required', 
        sent: 0, 
        failed: 0 
      };
    }

    // Step 4: Validate email addresses
    const invalidEmails = recipients.filter((r) => !isValidEmail(r.email));
    if (invalidEmails.length > 0) {
      return {
        success: false,
        message: `Invalid email addresses: ${invalidEmails.map((r) => r.email).join(', ')}`,
        sent: 0,
        failed: 0,
      };
    }

    // Step 5: Send emails
    const result: EmailResult = await sendBatchEmails(subject, htmlContent, recipients);

    if (result.success) {
      return {
        success: true,
        message: `Successfully sent ${result.sent} emails to ${recipients.length} recipients`,
        sent: result.sent,
        failed: result.failed,
      };
    }

    return {
      success: false,
      message: result.error || 'Failed to send emails',
      sent: result.sent,
      failed: result.failed,
    };

  } catch (error) {
    console.error('Error in sendEmailsAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      sent: 0,
      failed: 0,
    };
  }
}

/**
 * Send Single Email Server Action
 *
 * Sends a single email with authentication and validation.
 * Useful for individual notifications or confirmations.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param htmlContent - Email HTML content
 * @param recipientName - Optional recipient name
 * @returns Action result with success status
 */
export async function sendSingleEmailAction(
  to: string,
  subject: string,
  htmlContent: string,
  recipientName?: string
): Promise<SendEmailActionResult> {
  const participant: Participant = {
    name: recipientName || 'Recipient',
    email: to,
  };

  return sendEmailsAction(subject, htmlContent, [participant]);
}

/**
 * Validate Email Address Server Action
 *
 * Validates an email address using the same validation logic
 * as the email sending functions.
 *
 * @param email - Email address to validate
 * @returns Validation result
 */
export async function validateEmailAction(email: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    if (!email?.trim()) {
      return { valid: false, error: 'Email is required' };
    }

    const valid = isValidEmail(email);
    return { 
      valid, 
      error: valid ? undefined : 'Invalid email format' 
    };

  } catch (error) {
    return { 
      valid: false, 
      error: 'Error validating email address' 
    };
  }
}
