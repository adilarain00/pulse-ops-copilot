import { defineConfig } from "drizzle-kit";
import "dotenv/config";

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
