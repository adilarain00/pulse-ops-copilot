/**
 * Shared helper for db:push and db:seed.
 *
 * Both scripts need to handle three auth modes:
 *   1. DATABASE_URL (classic single-string connection)
 *   2. PGPASSWORD + discrete PG* vars (password auth)
 *   3. AWS IAM (Vercel Aurora integration) — needs token minting
 *
 * This helper mints a token in IAM mode and returns the updated env,
 * avoiding code duplication.
 */
import { getIamToken, isIamMode } from "../src/db/iam";

/**
 * Ensure database authentication is ready.
 *
 * If in IAM mode (AWS_ROLE_ARN + VERCEL_OIDC_TOKEN, no static password),
 * mints a short-lived RDS token and sets it as PGPASSWORD.
 * Otherwise, passes through (DATABASE_URL or password auth assumed to be set).
 *
 * @returns The updated process.env (or a copy with PGPASSWORD added for IAM mode)
 */
export async function ensureDbAuth(): Promise<NodeJS.ProcessEnv> {
  const env = { ...process.env };

  if (!env.DATABASE_URL && !env.PGPASSWORD && isIamMode()) {
    console.log("[db-auth] IAM mode detected — minting a short-lived RDS auth token…");
    try {
      env.PGPASSWORD = await getIamToken();
      console.log("[db-auth] Token minted successfully.");
    } catch (err) {
      const e = err as Error;
      console.error(`[db-auth] ✗ Token mint failed: ${e?.message}`);
      throw err;
    }
  }

  return env;
}
