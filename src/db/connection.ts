/**
 * Build pg connection configs from the environment.
 *
 * Supports two styles so it works with the Vercel AWS Marketplace integration
 * out of the box:
 *   1. A single DATABASE_URL (classic).
 *   2. The discrete PG* vars the integration injects (PGHOST/PGPORT/PGUSER/
 *      PGDATABASE) + a PGPASSWORD you add. No fragile URL assembly needed.
 */
import type { PoolConfig } from "pg";

const ssl = process.env.PGSSL_DISABLE === "1" ? false : { rejectUnauthorized: false };

function fromParts(user?: string, password?: string): PoolConfig | null {
  const { PGHOST, PGPORT, PGDATABASE } = process.env;
  if (!PGHOST || !user || !password) return null;
  return {
    host: PGHOST,
    port: Number(PGPORT ?? 5432),
    user,
    password,
    database: PGDATABASE ?? "postgres",
    ssl,
  };
}

/** Read-write connection (app logic, /api/act, migrations, seed). */
export function pgConfig(): PoolConfig {
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL, ssl };
  const parts = fromParts(process.env.PGUSER, process.env.PGPASSWORD);
  if (parts) return parts;
  throw new Error(
    "Database not configured. Set DATABASE_URL, or PGHOST + PGUSER + PGPASSWORD (PGPORT/PGDATABASE optional)."
  );
}

/** Read-only connection for the NL->SQL path. Falls back to the RW connection. */
export function readOnlyPgConfig(): PoolConfig {
  if (process.env.DATABASE_URL_RO) return { connectionString: process.env.DATABASE_URL_RO, ssl };
  const parts = fromParts(process.env.PGUSER_RO, process.env.PGPASSWORD_RO);
  if (parts) return parts;
  return pgConfig();
}

/** True when a dedicated read-only role is configured (vs. falling back to RW). */
export function hasReadOnlyRole(): boolean {
  return Boolean(process.env.DATABASE_URL_RO || (process.env.PGUSER_RO && process.env.PGPASSWORD_RO));
}
