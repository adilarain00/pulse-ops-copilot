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

  const params = new URL(req.url).searchParams;
  const force = params.get("force") === "1";

  // Fast diagnostic: just prove the IAM connection works (mint token + SELECT 1).
  if (params.get("probe") === "1") {
    const t0 = Date.now();
    try {
      const r = await rwPool().query("SELECT 1 AS ok");
      return NextResponse.json({ ok: true, probe: true, result: r.rows[0], tookMs: Date.now() - t0 });
    } catch (err) {
      console.error("[setup] probe failed:", err);
      return NextResponse.json(
        { error: "probe failed", detail: (err as Error)?.message, tookMs: Date.now() - t0 },
        { status: 500 }
      );
    }
  }

  try {
    // 1) Schema (idempotent)
    console.log("[setup] applying schema DDL…");
    const t0 = Date.now();
    await rwPool().query(SCHEMA_DDL);
    console.log(`[setup] schema ready in ${Date.now() - t0}ms`);

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

    console.log("[setup] seeding…");
    const tSeed = Date.now();
    const counts = await seedDatabase();
    console.log(`[setup] seeded in ${Date.now() - tSeed}ms`, counts);
    return NextResponse.json({ ok: true, schema: "ready", seeded: true, counts });
  } catch (err) {
    console.error("[setup] failed:", err);
    return NextResponse.json(
      { error: "Setup failed", detail: (err as Error)?.message },
      { status: 500 }
    );
  }
}
