/**
 * app/api/bot-config/debug/route.ts
 * ──────────────────────────────────
 * Temporary diagnostic endpoint — DELETE after debugging.
 * Hit GET /api/bot-config/debug to see exactly what's in MongoDB.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DB || 'hackoverflow';

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
    const db = client.db(DB_NAME);

    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Count docs in each relevant collection
    const counts: Record<string, number> = {};
    for (const name of ['bot_logs', 'bot_heartbeat', 'bot_config', 'scheduled_messages', 'bot_config_history']) {
      counts[name] = await db.collection(name).countDocuments();
    }

    // Get the most recent heartbeat doc (full)
    const heartbeat = await db.collection('bot_heartbeat').findOne({});

    // Get the most recent log entry (full)
    const latestLog = await db.collection('bot_logs').findOne({}, { sort: { timestamp: -1 } });

    return NextResponse.json({
      dbName:          DB_NAME,
      mongoUri:        process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@') ?? 'NOT SET', // mask password
      allCollections:  collectionNames,
      documentCounts:  counts,
      latestHeartbeat: heartbeat ?? 'NONE — bot has never written a heartbeat',
      latestLog:       latestLog ?? 'NONE — bot has never written a log',
    });
  } catch (err) {
    return NextResponse.json({
      error:    String(err),
      dbName:   DB_NAME,
      mongoUri: process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@') ?? 'NOT SET',
    }, { status: 500 });
  }
}