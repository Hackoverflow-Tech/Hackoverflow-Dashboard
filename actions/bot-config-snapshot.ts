'use server';

/**
 * Fetch the current bot config meta from the DB and return a BotConfigSnapshot.
 * Call this in your hourly cron/action just before sendHourlyBackupReport().
 *
 * Usage (in your backup action / cron handler):
 *
 *   import { getBotConfigSnapshot } from '@/actions/bot-config-snapshot';
 *   import { sendHourlyBackupReport } from '@/actions/email-report';
 *
 *   const botSnap = await getBotConfigSnapshot();
 *   await sendHourlyBackupReport(logs, recipient, botSnap);
 */

import clientPromise from '@/lib/mongodb';
import type { BotConfigSnapshot } from '@/actions/email-report';

const DB_NAME   = process.env.MONGODB_DB || 'hackoverflow';
const COLL      = 'bot_config';
const DOC_ID    = 'hackathon-data';

export async function getBotConfigSnapshot(): Promise<BotConfigSnapshot> {
  try {
    const client = await clientPromise;
    const doc = await client
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ _id: DOC_ID as never });

    if (!doc) {
      return { version: 0, updatedAt: null, updatedBy: null, healthy: false, fieldCount: 0 };
    }

    const { _id, updatedAt, updatedBy, __v, ...rest } = doc as Record<string, unknown>;
    void _id;

    const updatedBy_str = typeof updatedBy === 'string' ? updatedBy : null;

    return {
      version:    typeof __v === 'number' ? __v : 1,
      updatedAt:  updatedAt instanceof Date
                    ? updatedAt.toISOString()
                    : typeof updatedAt === 'string' ? updatedAt : null,
      updatedBy:  updatedBy_str === 'unknown' ? null : updatedBy_str,
      healthy:    true,
      fieldCount: Object.keys(rest).length,
    };
  } catch {
    return { version: 0, updatedAt: null, updatedBy: null, healthy: false };
  }
}