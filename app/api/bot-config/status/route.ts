/**
 * app/api/bot-config/status/route.ts
 * ────────────────────────────────────
 * Returns the bot's real online/offline status by reading the
 * heartbeat document the bot writes to MongoDB every 30 seconds.
 * If the last heartbeat is older than 75 seconds, the bot is considered offline.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

const DB_NAME        = process.env.MONGODB_DB || 'hackoverflow';
const COLL           = 'bot_heartbeat';
const DOC_ID         = 'kernel-bot';
const STALE_AFTER_MS = 75_000; // if no heartbeat in 75s → offline

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  try { return verifyToken(token); } catch { return null; }
}

export async function GET() {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const client = await clientPromise;
    const doc = await client
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ _id: DOC_ID as never });

    if (!doc || !doc.lastSeen) {
      return NextResponse.json({
        online:    false,
        lastSeen:  null,
        tag:       null,
        ping:      null,
        guildCount: null,
        startedAt: null,
      });
    }

    const lastSeen   = new Date(doc.lastSeen as string);
    const staleness  = Date.now() - lastSeen.getTime();
    const online     = staleness < STALE_AFTER_MS;

    return NextResponse.json({
      online,
      lastSeen:   lastSeen.toISOString(),
      tag:        doc.tag        ?? null,
      ping:       doc.ping       ?? null,
      guildCount: doc.guildCount ?? null,
      startedAt:  doc.startedAt  ? new Date(doc.startedAt as string).toISOString() : null,
      staleMs:    staleness,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}