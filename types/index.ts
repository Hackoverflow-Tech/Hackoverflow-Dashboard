/**
 * Shared Type Definitions
 *
 * Centralized types used across mailer, ID card generator,
 * and dashboard modules.
 *
 * @module types
 */

/** Base participant data from CSV import */
export interface Participant {
  readonly name: string;
  readonly email: string;
  readonly role?: string;
  readonly company?: string;
  readonly phone?: string;
}

/** Database participant with all hackathon details */
export interface DBParticipant {
  _id?: string;
  participantId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  teamName?: string;
  institute?: string;
  labAllotted?: string;
  wifiCredentials?: {
    ssid?: string;
    password?: string;
  };
  collegeCheckIn?: {
    status: boolean;
    time?: Date;
  };
  labCheckIn?: {
    status: boolean;
    time?: Date;
  };
  /** Permanent checkout from the college/event */
  collegeCheckOut?: {
    status: boolean;
    time?: Date;
  };
  /** Temporary exit from the lab (tracked for alerts if > 10 min) */
  tempLabCheckOut?: {
    status: boolean;
    time?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/** Participant with selection state for UI lists */
export interface SelectableParticipant extends Participant {
  selected: boolean;
}

/** ID card data with generated fields */
export interface IDCardData {
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly company: string;
  readonly phone: string;
  readonly participantId: string;
  readonly qrCodeDataURL: string;
}

/** Hackathon event metadata for ID cards */
export interface HackathonInfo {
  readonly name: string;
  readonly date: string;
  readonly venue: string;
}

/** Result from batch email sending */
export interface EmailResult {
  readonly success: boolean;
  readonly sent: number;
  readonly failed: number;
  readonly error?: string;
}

/** Email send request payload */
export interface SendEmailRequest {
  readonly subject: string;
  readonly htmlContent: string;
  readonly recipients: Participant[];
}

/** Database sponsor with company details */
export interface DBSponsor {
  _id?: string;
  sponsorId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  companyName: string;
  createdAt?: Date;
  updatedAt?: Date;
}