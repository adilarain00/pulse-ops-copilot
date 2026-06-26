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
      "No DB password in env. For the Vercel Aurora IAM integration, run `pnpm db:push` " +
        "(it mints an IAM token automatically) rather than drizzle-kit directly. " +
        "Or set DATABASE_URL / PGPASSWORD for password auth."
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
