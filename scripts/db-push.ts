/**
 * `pnpm db:push` wrapper.
 *
 * drizzle-kit needs a static password, but the Vercel Aurora integration uses
 * IAM (no password). So in IAM mode we mint a short-lived RDS token and hand it
 * to drizzle-kit as PGPASSWORD for this one run. With DATABASE_URL/PGPASSWORD
 * already set, we just pass through.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { spawnSync } from "node:child_process";
import { getIamToken, isIamMode } from "../src/db/iam";

async function main() {
  const env = { ...process.env };

  if (!env.DATABASE_URL && !env.PGPASSWORD && isIamMode()) {
    console.log("IAM mode detected — minting a short-lived RDS auth token…");
    env.PGPASSWORD = await getIamToken();
  }

  const result = spawnSync("pnpm", ["exec", "drizzle-kit", "push"], {
    stdio: "inherit",
    env,
    shell: true,
  });
  process.exit(result.status ?? 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
