/**
 * `pnpm db:push` wrapper.
 *
 * Handles three auth modes:
 *   1. DATABASE_URL (classic)
 *   2. PGPASSWORD + discrete PG* vars (password auth)
 *   3. AWS IAM (Vercel integration) — mints a short-lived RDS token
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { execSync } from "node:child_process";
import { ensureDbAuth } from "./ensure-db-auth";

async function main() {
  const env = await ensureDbAuth();
  console.log("\n[db-push] Now running drizzle-kit push...\n");

  // Use execSync with stdio: "inherit" to preserve TTY for interactive prompts
  try {
    execSync("pnpm exec drizzle-kit push", {
      stdio: "inherit",
      env,
      shell: process.platform === "win32" ? "powershell" : "/bin/bash",
    });
    console.log("\n[db-push] ✓ Schema pushed successfully!");
  } catch (err) {
    const e = err as Error;
    if (e.message.includes("Interactive prompts")) {
      console.error("\n[db-push] ✗ TTY issue: drizzle-kit needs interactive terminal.");
      console.error("[db-push] Try running this command directly in PowerShell:");
      console.error(`  cd "${process.cwd()}"`);
      console.error("  pnpm db:push");
      console.error("[db-push] Then press 'y' to confirm the migration when prompted.");
      process.exit(1);
    }
    throw new Error(`drizzle-kit push failed: ${e.message}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
