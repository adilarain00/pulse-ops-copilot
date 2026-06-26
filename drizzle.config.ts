import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js auto-loads .env.local, but drizzle-kit doesn't — load it explicitly
// (.env.local takes precedence; .env is a non-overriding fallback).
config({ path: ".env.local" });
config();

// Mirror src/db/connection.ts: accept DATABASE_URL or the integration's PG* vars.
function credentials() {
  if (process.env.DATABASE_URL) return { url: process.env.DATABASE_URL };
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD) {
    return {
      host: PGHOST,
      port: Number(PGPORT ?? 5432),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE ?? "postgres",
      ssl: { rejectUnauthorized: false },
    };
  }
  if (PGHOST && PGUSER && !PGPASSWORD) {
    throw new Error(
      "PGPASSWORD is not set. Set a master password on the Aurora cluster (RDS console → Modify) " +
        "and add PGPASSWORD to .env.local (and Vercel)."
    );
  }
  return { url: "" };
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: credentials(),
  verbose: true,
  strict: true,
});
