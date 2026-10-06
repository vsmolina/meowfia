import "server-only";
import { z } from "zod";

/**
 * Validated server environment. Every integration key is optional, so the app
 * runs fully in mock mode with an empty .env. Use `features` to branch on
 * which real integrations are configured. See .env.example for docs.
 */
const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  NEXT_PUBLIC_SITE_URL: optional,

  AUTH_SECRET: optional,
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,
  ADMIN_EMAILS: optional,

  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,

  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,
  EMAIL_REPLY_TO: optional,

  STORAGE_DRIVER: z.enum(["local", "s3"]).optional(),
  LOCAL_STORAGE_DIR: optional,
  S3_ENDPOINT: optional,
  S3_REGION: optional,
  S3_BUCKET: optional,
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  S3_PUBLIC_URL: optional,

  PRINTFUL_API_KEY: optional,
  PRINTFUL_STORE_ID: optional,

  DOWNLOAD_SIGNING_SECRET: optional,
  CRON_SECRET: optional,

  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,

  NEXT_PUBLIC_VERCEL_ANALYTICS: optional,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: optional,
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: optional,
  NEXT_PUBLIC_META_PIXEL_ID: optional,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables. See .env.example.");
}

export const env = parsed.data;

const isProd = env.NODE_ENV === "production";

if (isProd && !env.AUTH_SECRET) {
  console.warn("⚠️  AUTH_SECRET is not set. Auth.js requires it in production.");
}

export const features = {
  stripe: Boolean(env.STRIPE_SECRET_KEY),
  stripeWebhooks: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
  resend: Boolean(env.RESEND_API_KEY),
  google: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  s3: env.STORAGE_DRIVER === "s3" && Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY),
  printful: Boolean(env.PRINTFUL_API_KEY),
  upstash: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
} as const;

/** Secret for signing download links. Falls back to AUTH_SECRET, then a dev-only constant. */
export function signingSecret(): string {
  const s = env.DOWNLOAD_SIGNING_SECRET ?? env.AUTH_SECRET;
  if (s) return s;
  if (isProd) throw new Error("DOWNLOAD_SIGNING_SECRET (or AUTH_SECRET) must be set in production");
  return "dev-only-insecure-signing-secret";
}

export const adminEmails = (env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
