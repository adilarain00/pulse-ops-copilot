/**
 * GET /api/audit — the most recent audit entries for the live audit panel.
 * Degrades to an empty list if the database isn't connected yet.
 */
import { NextResponse } from "next/server";
import { rwPool } from "@/db/pools";

export const runtime = "nodejs";

export async function GET() {
  try {
    const r = await rwPool().query(
      `SELECT id, actor, action_type, entity_type, payload, created_at
       FROM audit_log
       ORDER BY created_at DESC
       LIMIT 25`
    );
    return NextResponse.json({ entries: r.rows });
  } catch (err) {
    console.warn("[audit] unavailable:", (err as Error)?.message);
    return NextResponse.json({ entries: [], unavailable: true });
  }
}
