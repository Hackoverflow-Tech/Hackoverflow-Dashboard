'use server';

import clientPromise from '@/lib/mongodb';
import type { BotStatusSnapshot } from '@/actions/email-report';

const DB_NAME     = process.env.MONGODB_DB || 'hackoverflow';
const STATUS_COLL = 'bot_heartbeat';  // ← was 'bot_status'
const STATUS_DOC  = 'kernel-bot';
const STALE_MS    = 75_000;           // ← match the route exactly

export async function getBotStatusSnapshot(): Promise<BotStatusSnapshot> {
  const empty: BotStatusSnapshot = {
    online: false, lastSeen: null, tag: null,
    ping: null, guildCount: null, startedAt: null,
  };

  try {
    const client = await clientPromise;
    const doc    = await client
      .db(DB_NAME)
      .collection(STATUS_COLL)
      .findOne({ _id: STATUS_DOC as never });

    if (!doc || !doc.lastSeen) {
      console.warn('[getBotStatusSnapshot] no document found with _id:', STATUS_DOC);
      return empty;
    }

    const lastSeen   = new Date(doc.lastSeen as string);
    const staleMs    = Date.now() - lastSeen.getTime();
    const isOnline   = staleMs < STALE_MS;

    return {
      online:     isOnline,
      lastSeen:   lastSeen.toISOString(),
      tag:        typeof doc.tag        === 'string' ? doc.tag        : null,
      ping:       typeof doc.ping       === 'number' ? doc.ping       : null,
      guildCount: typeof doc.guildCount === 'number' ? doc.guildCount : null,
      startedAt:  doc.startedAt ? new Date(doc.startedAt as string).toISOString() : null,
      staleMs,
    };
  } catch (err) {
    console.error('[getBotStatusSnapshot] error:', err);
    return empty;
  }
}