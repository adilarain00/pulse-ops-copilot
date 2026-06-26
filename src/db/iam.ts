/**
 * IAM authentication for the Vercel AWS Aurora integration.
 *
 * The integration injects PGHOST/PGPORT/PGUSER/PGDATABASE + AWS_ROLE_ARN +
 * VERCEL_OIDC_TOKEN, but NO password — auth is via short-lived RDS IAM tokens.
 * We use the Vercel OIDC token to assume the AWS role, then ask the RDS Signer
 * for a 15-minute auth token to use as the database password. Tokens are minted
 * per new connection, so expiry is a non-issue (RDS only needs the token at
 * connect time).
 */
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

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

const REGION_RE = /^[a-z]{2}-[a-z]+-\d$/;

function resolveRegion(): string {
  // Prefer the ARN — AWS_REGION from `vercel env pull` can be redacted to "***".
  const arnRegion = process.env.AWS_RESOURCE_ARN?.split(":")[3]; // arn:aws:rds:<region>:...
  if (arnRegion && REGION_RE.test(arnRegion)) return arnRegion;
  if (process.env.AWS_REGION && REGION_RE.test(process.env.AWS_REGION)) return process.env.AWS_REGION;
  const hostMatch = process.env.PGHOST?.match(/\.([a-z]{2}-[a-z]+-\d)\.rds\.amazonaws\.com/);
  if (hostMatch) return hostMatch[1];
  throw new Error("Could not determine a valid AWS region — set AWS_REGION (e.g. ap-south-1).");
}

/** Mint a short-lived RDS IAM auth token to use as the DB password. */
export async function getIamToken(): Promise<string> {
  const region = resolveRegion();
  // The STS client inside awsCredentialsProvider reads AWS_REGION from the env.
  // Force-set it: the injected value may be redacted ("***") or missing.
  process.env.AWS_REGION = region;
  process.env.AWS_DEFAULT_REGION = region;

  const signer = new Signer({
    hostname: process.env.PGHOST!,
    port: Number(process.env.PGPORT ?? 5432),
    username: process.env.PGUSER!,
    region,
    credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN! }),
  });
  return signer.getAuthToken();
}
