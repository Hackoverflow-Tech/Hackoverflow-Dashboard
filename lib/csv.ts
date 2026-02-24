/**
 * Unified CSV Processing Utilities
 *
 * Provides CSV parsing for both mailer (PapaParse) and
 * ID card generator (manual parsing with QR generation).
 *
 * @module lib/csv
 */

import Papa from 'papaparse';
import type { Participant, IDCardData } from '@/types';
import { generateQRCode } from '../utils/generate-qr';

/**
 * Parse CSV file into participant records using PapaParse.
 * Used by the mailer module for recipient lists.
 *
 * @param file - Uploaded CSV File object
 * @returns Promise resolving to parsed participants
 */
export function parseCSVFile(file: File): Promise<Participant[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const participants = results.data
          .map((row) => ({
            name: row.name || 'N/A',
            email: row.email || '',
            role: row.role || '',
            company: row.company || '',
            phone: row.phone || '',
          }))
          .filter((p) => p.email.length > 0);

        resolve(participants);
      },
      error: (error: Error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse CSV text into ID card data with generated QR codes.
 * Used by the ID card generator module.
 *
 * @param csvText - Raw CSV text content
 * @returns Promise resolving to ID card data array
 */
export async function parseCSVForIDCards(csvText: string): Promise<IDCardData[]> {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredColumns = ['name', 'email', 'role', 'company', 'phone'];
  const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const cards: IDCardData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim());

    const participant: Record<string, string> = {};
    headers.forEach((header, index) => {
      participant[header] = values[index] || '';
    });

    const participantId = `PART-${String(i).padStart(4, '0')}`;

    const qrData = JSON.stringify({
      name: participant.name,
      email: participant.email,
      role: participant.role,
      company: participant.company,
      phone: participant.phone,
      id: participantId,
    });

    const qrCodeDataURL = await generateQRCode(qrData);

    cards.push({
      name: participant.name,
      email: participant.email,
      role: participant.role,
      company: participant.company,
      phone: participant.phone,
      participantId,
      qrCodeDataURL,
    });
  }

  return cards;
}
