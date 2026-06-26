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
import { getIamToken, isIamMode } from "./iam";

const ssl = process.env.PGSSL_DISABLE === "1" ? false : { rejectUnauthorized: false };

/** Base config shared by the IAM path (host/port/db/ssl, no static password). */
function iamBase(user: string): PoolConfig {
  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user,
    database: process.env.PGDATABASE ?? "postgres",
    ssl,
    // pg calls this per new connection; we mint a fresh 15-min IAM token each time.
    password: () => getIamToken(),
  };
}

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
  if (isIamMode()) return iamBase(process.env.PGUSER!);
  throw new Error(
    "Database not configured. Set DATABASE_URL, PGPASSWORD, or the Vercel Aurora IAM vars " +
      "(AWS_ROLE_ARN + VERCEL_OIDC_TOKEN, injected by the integration)."
  );
}

/** Read-only connection for the NL->SQL path. Falls back to the RW connection. */
export function readOnlyPgConfig(): PoolConfig {
  if (process.env.DATABASE_URL_RO) return { connectionString: process.env.DATABASE_URL_RO, ssl };
  const parts = fromParts(process.env.PGUSER_RO, process.env.PGPASSWORD_RO);
  if (parts) return parts;
  // IAM mode with a dedicated read-only DB user (no password).
  if (process.env.PGUSER_RO && isIamMode()) return iamBase(process.env.PGUSER_RO);
  return pgConfig();
}

/** True when a dedicated read-only role is configured (vs. falling back to RW). */
export function hasReadOnlyRole(): boolean {
  return Boolean(
    process.env.DATABASE_URL_RO ||
      (process.env.PGUSER_RO && process.env.PGPASSWORD_RO) ||
      (process.env.PGUSER_RO && isIamMode())
  );
}
