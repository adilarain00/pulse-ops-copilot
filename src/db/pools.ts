/**
 * Two Postgres pools = least-privilege defense in depth.
 *
 *  - rwPool  : full CRUD, used by app logic + the /api/act write path.
 *  - roPool  : the role the NL->SQL engine executes against. In production this
 *              role has SELECT-only grants and a server-side statement_timeout,
 *              so even if a malicious query slips past the validator, the
 *              database itself refuses to write or run long.
 *
 * Pools are cached on globalThis so Next.js hot-reload / serverless invocations
 * reuse connections instead of exhausting Aurora's connection limit.
 */
import { Pool } from "pg";

type Pools = { rw?: Pool; ro?: Pool };
const g = globalThis as unknown as { __pulsePools?: Pools };
g.__pulsePools ??= {};

function makePool(url: string, readOnly: boolean): Pool {
  const pool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    // Aurora requires TLS; relax verification only outside production.
    ssl: process.env.PGSSL_DISABLE === "1" ? false : { rejectUnauthorized: false },
  });
  // Belt-and-suspenders: cap statement time on the read path even if the
  // database role wasn't configured with its own timeout.
  if (readOnly) {
    pool.on("connect", (client) => {
      client.query("SET statement_timeout = 4000").catch(() => {});
    });
  }
  return pool;
}

export function rwPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return (g.__pulsePools!.rw ??= makePool(url, false));
}

/** Read-only pool for the AI query path. Falls back to DATABASE_URL in dev. */
export function roPool(): Pool {
  const url = process.env.DATABASE_URL_RO ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Neither DATABASE_URL_RO nor DATABASE_URL is set");
  if (!process.env.DATABASE_URL_RO) {
    console.warn(
      "[pulse] DATABASE_URL_RO not set — using DATABASE_URL for the read path. " +
        "Create the pulse_readonly role before the demo for the security story."
    );
  }
  return (g.__pulsePools!.ro ??= makePool(url, true));
}
