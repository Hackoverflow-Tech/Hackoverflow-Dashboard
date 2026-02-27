import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const DB_NAME = process.env.MONGODB_DB || "hackoverflow";
const COLLECTION = "bot_config";
const DOC_ID = "hackathon-data";

type AuthUser = { email?: string; id?: string };

async function authenticate(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try { return verifyToken(token) as AuthUser; } catch { return null; }
}

// ─── GET — read current config ───────────────────────────────────────────────
export async function GET() {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const client = await clientPromise;
    const doc = await client.db(DB_NAME).collection(COLLECTION).findOne({ _id: DOC_ID as never });

    if (!doc) {
      return NextResponse.json(
        { error: "Bot config not found.", hint: "Use POST /api/bot-config to seed your initial config." },
        { status: 404 }
      );
    }

    const { _id, updatedAt, updatedBy, __v, ...data } = doc as Record<string, unknown>;
    void _id;

    return NextResponse.json({ data, meta: { updatedAt, updatedBy, version: __v ?? 1 } });
  } catch (err) {
    return NextResponse.json({ error: "Database error", details: String(err) }, { status: 500 });
  }
}

// ─── PUT — full replace with auto-snapshot ───────────────────────────────────
export async function PUT(req: NextRequest) {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (typeof body !== "object" || Array.isArray(body) || !body) {
      return NextResponse.json({ error: "Payload must be a JSON object" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Snapshot current to history
    const current = await db.collection(COLLECTION).findOne({ _id: DOC_ID as never });
    const currentVersion = (current?.__v as number) ?? 0;

    if (current) {
      const { _id: _omit, ...rest } = current as Record<string, unknown>;
      void _omit;
      await db.collection("bot_config_history").insertOne({
        ...rest,
        snapshotOf: DOC_ID,
        savedAt: new Date(),
        savedBy: user.email ?? "unknown",
        version: currentVersion,
      });
    }

    await db.collection(COLLECTION).replaceOne(
      { _id: DOC_ID as never },
      { _id: DOC_ID, ...body, updatedAt: new Date(), updatedBy: user.email ?? "unknown", __v: currentVersion + 1 },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Bot configuration updated", version: currentVersion + 1 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save", details: String(err) }, { status: 500 });
  }
}

// ─── POST — seed (one-time) ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const exists = await db.collection(COLLECTION).findOne({ _id: DOC_ID as never });
    if (exists) {
      return NextResponse.json({ error: "Config already exists. Use PUT to update." }, { status: 409 });
    }

    await db.collection(COLLECTION).insertOne({
      _id: DOC_ID as never,
      ...body,
      updatedAt: new Date(),
      updatedBy: user.email ?? "unknown",
      __v: 1,
    });

    return NextResponse.json({ success: true, message: "Bot config seeded" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to seed", details: String(err) }, { status: 500 });
  }
}