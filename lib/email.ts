/**
 * Email Sending Utilities
 *
 * Handles email transporter creation, personalization,
 * and batch sending via nodemailer.
 *
 * @module lib/email
 */

import nodemailer from 'nodemailer';
import type { Participant, EmailResult } from '@/types';
import { wrapInTemplate, type EmailTemplateData } from './email-template';

/**
 * Creates a configured nodemailer transporter.
 * Throws if required env vars are missing.
 */
function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email configuration missing. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env.local'
    );
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Replaces template variables ({{name}}, {{email}}, etc.)
 * with actual participant data.
 */
function personalizeContent(template: string, participant: Participant): string {
  let personalized = template;
  personalized = personalized.replace(/\{\{name\}\}/g, participant.name || 'there');
  personalized = personalized.replace(/\{\{email\}\}/g, participant.email || '');
  personalized = personalized.replace(/\{\{role\}\}/g, participant.role || '');
  personalized = personalized.replace(/\{\{company\}\}/g, participant.company || '');
  personalized = personalized.replace(/\{\{phone\}\}/g, participant.phone || '');
  return personalized;
}

/**
 * Sends batch emails to a list of participants.
 *
 * @param subject - Email subject line
 * @param htmlContent - HTML content with optional {{variable}} placeholders
 * @param recipients - Array of participant data
 * @returns Result with sent/failed counts
 */
export async function sendBatchEmails(
  subject: string,
  htmlContent: string,
  recipients: Participant[]
): Promise<EmailResult> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const transporter = createTransporter();

    try {
      await transporter.verify();
    } catch {
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        error: 'Failed to connect to email server. Check your email configuration.',
      };
    }

    for (const recipient of recipients) {
      try {
        const personalizedContent = personalizeContent(htmlContent, recipient);

        const finalHtml = wrapInTemplate({
          content: personalizedContent,
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          recipientRole: recipient.role,
          recipientCompany: recipient.company,
        });

        await transporter.sendMail({
          from: `"Hackathon Mailer" <${process.env.EMAIL_USER}>`,
          to: recipient.email,
          subject,
          html: finalHtml,
          text: personalizedContent.replace(/<[^>]*>/g, ''),
        });

        sent++;
      } catch (error) {
        failed++;
        const errorMsg = `Failed to send to ${recipient.email}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: sent > 0,
      sent,
      failed,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    console.error('Error in sendBatchEmails:', error);
    return {
      success: false,
      sent,
      failed: recipients.length - sent,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Validates an email address format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Tests the email server connection.
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
