/**
 * Two Postgres pools = least-privilege defense in depth.
 *
 *  - rwPool  : full CRUD, used by app logic + the /api/act write path.
 *  - roPool  : the role the NL->SQL engine executes against. In production this
 *              role has SELECT-only grants and a statement_timeout, so even a
 *              malicious query that slips past the validator can't write or run
 *              long. Falls back to the RW connection if no RO role is set.
 *
 * Pools are cached on globalThis so Next.js hot-reload / serverless invocations
 * reuse connections instead of exhausting Aurora's connection limit.
 */
import { Pool, type PoolConfig } from "pg";
import { pgConfig, readOnlyPgConfig, hasReadOnlyRole } from "./connection";

type Pools = { rw?: Pool; ro?: Pool };
const g = globalThis as unknown as { __pulsePools?: Pools };
g.__pulsePools ??= {};

function makePool(config: PoolConfig, readOnly: boolean): Pool {
  const pool = new Pool({ ...config, max: 5, idleTimeoutMillis: 30_000 });
  if (readOnly) {
    // Belt-and-suspenders: cap statement time on the read path even if the DB
    // role wasn't configured with its own timeout.
    pool.on("connect", (client) => {
      client.query("SET statement_timeout = 4000").catch(() => {});
    });
  }
  return pool;
}

export function rwPool(): Pool {
  return (g.__pulsePools!.rw ??= makePool(pgConfig(), false));
}

export function roPool(): Pool {
  if (!hasReadOnlyRole()) {
    console.warn(
      "[pulse] No read-only role configured (DATABASE_URL_RO / PGUSER_RO) — " +
        "using the primary connection for the read path. Set one before the demo " +
        "for the least-privilege security story."
    );
  }
  return (g.__pulsePools!.ro ??= makePool(readOnlyPgConfig(), true));
}
