/**
 * Local seed CLI: `pnpm db:seed` (needs a reachable DB in .env.local).
 *
 * Handles three auth modes:
 *   1. DATABASE_URL (classic)
 *   2. PGPASSWORD + discrete PG* vars (password auth)
 *   3. AWS IAM (Vercel integration) — mints a short-lived RDS token
 *
 * The seed logic lives in src/db/seed-core.ts so the /api/admin/setup endpoint
 * can reuse it (with its own IAM token minting in the serverless handler).
 *
 * Note: seedDatabase and rwPool are imported dynamically (not at the top)
 * because client.ts calls rwPool() at module load time. We must mint the
 * IAM token first, so we defer these imports until after ensureDbAuth().
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { ensureDbAuth } from "./ensure-db-auth";

async function main() {
  // Ensure database auth is set (IAM token minting if needed).
  // Must happen BEFORE importing modules that call rwPool().
  await ensureDbAuth();

  // Now safe to import (these trigger rwPool creation).
  const { seedDatabase } = await import("../src/db/seed-core");
  const { rwPool } = await import("../src/db/pools");

  const counts = await seedDatabase();
  console.log("✓ Seeded:", counts);
  await rwPool().end();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
