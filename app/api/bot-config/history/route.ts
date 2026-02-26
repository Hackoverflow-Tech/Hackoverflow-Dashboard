import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const DB_NAME = process.env.MONGODB_DB || "hackoverflow";

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try { return verifyToken(token); } catch { return null; }
}

export async function GET() {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const client = await clientPromise;
    const history = await client
      .db(DB_NAME)
      .collection("bot_config_history")
      .find({ snapshotOf: "hackathon-data" })
      .sort({ savedAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ history });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}