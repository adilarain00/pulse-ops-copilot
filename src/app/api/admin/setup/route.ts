/**
 * POST /api/admin/setup?secret=...  — one-time DB provisioning from the Vercel
 * runtime (where the IAM connection works). Creates the schema, then seeds.
 *
 * Guarded by SETUP_SECRET (constant-time compared). Refuses to run if the secret
 * is unset or wrong. Idempotent: skips seeding if data already exists unless
 * ?force=1. DELETE SETUP_SECRET (and ideally this route) after provisioning.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { rwPool } from "@/db/pools";
import { SCHEMA_DDL } from "@/db/ddl";
import { seedDatabase } from "@/db/seed-core";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.SETUP_SECRET;
  if (!secret) return false;
  const provided =
    new URL(req.url).searchParams.get("secret") ?? req.headers.get("x-setup-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const force = new URL(req.url).searchParams.get("force") === "1";

  try {
    // 1) Schema (idempotent)
    await rwPool().query(SCHEMA_DDL);

    // 2) Seed (skip if already populated, unless forced)
    const existing = await rwPool().query("SELECT count(*)::int AS n FROM orders");
    const orderCount = existing.rows[0].n as number;
    if (orderCount > 0 && !force) {
      return NextResponse.json({
        ok: true,
        schema: "ready",
        seeded: false,
        note: `Schema present; ${orderCount} orders already exist. Pass ?force=1 to reseed.`,
      });
    }

    const counts = await seedDatabase();
    return NextResponse.json({ ok: true, schema: "ready", seeded: true, counts });
  } catch (err) {
    console.error("[setup] failed:", err);
    return NextResponse.json(
      { error: "Setup failed", detail: (err as Error)?.message },
      { status: 500 }
    );
  }
}
