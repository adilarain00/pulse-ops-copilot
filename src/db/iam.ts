/**
 * IAM authentication for the Vercel AWS Aurora integration.
 *
 * The integration injects PGHOST/PGPORT/PGUSER/PGDATABASE + AWS_ROLE_ARN +
 * VERCEL_OIDC_TOKEN, but NO password — auth is via short-lived RDS IAM tokens.
 * We use the Vercel OIDC token to assume the AWS role (STS
 * AssumeRoleWithWebIdentity), then ask the RDS Signer for a ~15-minute token to
 * use as the database password.
 *
 * The STS call has explicit timeouts so a network/permission problem fails fast
 * with a clear, logged error instead of hanging until the function times out.
 */
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const REGION_RE = /^[a-z]{2}-[a-z]+-\d$/;

/** IAM mode = integration vars present and no explicit password/URL override. */
export function isIamMode(): boolean {
  return Boolean(
    process.env.AWS_ROLE_ARN &&
      process.env.PGHOST &&
      process.env.PGUSER &&
      !process.env.PGPASSWORD &&
      !process.env.DATABASE_URL
  );
}

function resolveRegion(): string {
  const arnRegion = process.env.AWS_RESOURCE_ARN?.split(":")[3]; // arn:aws:rds:<region>:...
  if (arnRegion && REGION_RE.test(arnRegion)) return arnRegion;
  if (process.env.AWS_REGION && REGION_RE.test(process.env.AWS_REGION)) return process.env.AWS_REGION;
  const hostMatch = process.env.PGHOST?.match(/\.([a-z]{2}-[a-z]+-\d)\.rds\.amazonaws\.com/);
  if (hostMatch) return hostMatch[1];
  throw new Error("Could not determine a valid AWS region — set AWS_REGION (e.g. ap-south-1).");
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/** Mint a short-lived RDS IAM auth token to use as the DB password. */
export async function getIamToken(): Promise<string> {
  const region = resolveRegion();
  // The STS client reads AWS_REGION from env; the injected value may be redacted.
  process.env.AWS_REGION = region;
  process.env.AWS_DEFAULT_REGION = region;

  const roleArn = process.env.AWS_ROLE_ARN!;
  const started = Date.now();
  console.log(
    `[iam] minting RDS token region=${region} host=${process.env.PGHOST} ` +
      `user=${process.env.PGUSER} oidc=${process.env.VERCEL_OIDC_TOKEN ? "present" : "MISSING"} ` +
      `role=...${roleArn?.slice(-24)}`
  );

  // Fail fast instead of hanging the whole function on a stuck STS request.
  const requestHandler = new NodeHttpHandler({ connectionTimeout: 4000, requestTimeout: 8000 });

  try {
    const signer = new Signer({
      hostname: process.env.PGHOST!,
      port: Number(process.env.PGPORT ?? 5432),
      username: process.env.PGUSER!,
      region,
      credentials: awsCredentialsProvider({
        roleArn,
        clientConfig: { region, requestHandler, maxAttempts: 2 },
      }),
    });

    const token = await withTimeout(signer.getAuthToken(), 12_000, "RDS IAM token mint (STS)");
    console.log(`[iam] token minted in ${Date.now() - started}ms`);
    return token;
  } catch (err) {
    const e = err as Error;
    console.error(`[iam] token mint FAILED after ${Date.now() - started}ms: ${e?.name}: ${e?.message}`);
    throw new Error(`IAM token mint failed: ${e?.message}`);
  }
}
