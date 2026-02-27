
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const DB_NAME = process.env.MONGODB_DB || "hackoverflow";
const COLL    = "bot_logs";

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try { return verifyToken(token); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(Number(searchParams.get("limit")  ?? 100), 200);
  const type   = searchParams.get("type");    // filter by log type
  const since  = searchParams.get("since");   // ISO timestamp — for polling

  try {
    const client = await clientPromise;
    const filter: Record<string, unknown> = {};

    if (type && type !== "all") {
      filter.type = type;
    }
    if (since) {
      filter.timestamp = { $gt: new Date(since) };
    }

    const logs = await client
      .db(DB_NAME)
      .collection(COLL)
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Aggregate counts for the summary bar
    const [counts] = await client
      .db(DB_NAME)
      .collection(COLL)
      .aggregate([
        {
          $group: {
            _id:          "$type",
            total:        { $sum: 1 },
            errors:       { $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] } },
            avgDurationMs:{ $avg: "$durationMs" },
          },
        },
      ])
      .toArray()
      .then(rows => {
        // reshape into { ai_mention: { total, errors }, … }
        const summary: Record<string, { total: number; errors: number; avgMs: number }> = {};
        for (const r of rows) {
          summary[r._id as string] = {
            total:  r.total  as number,
            errors: r.errors as number,
            avgMs:  Math.round((r.avgDurationMs as number) ?? 0),
          };
        }
        return [summary];
      });

    return NextResponse.json({ logs, summary: counts ?? {} });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}