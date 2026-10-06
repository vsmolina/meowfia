import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { signingSecret } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";

/**
 * Expiring, tamper-proof download tokens.
 * Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 * The download route also checks that the entitlement still exists.
 */
export type DownloadFormat = "letter" | "a4";
type Payload = { e: string; f: DownloadFormat; x: number }; // entitlementId, format, expiry (unix seconds)

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function sign(data: string, secret = signingSecret()) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createDownloadToken(entitlementId: string, format: DownloadFormat, ttlSeconds = 60 * 15, now = Date.now(), secret?: string) {
  const payload: Payload = { e: entitlementId, f: format, x: Math.floor(now / 1000) + ttlSeconds };
  const data = b64(JSON.stringify(payload));
  return `${data}.${sign(data, secret)}`;
}

export function verifyDownloadToken(token: string, now = Date.now(), secret?: string): { entitlementId: string; format: DownloadFormat } | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data, secret));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (typeof p.e !== "string" || (p.f !== "letter" && p.f !== "a4") || typeof p.x !== "number") return null;
    if (p.x * 1000 < now) return null;
    return { entitlementId: p.e, format: p.f };
  } catch {
    return null;
  }
}

/** Short-lived link shown in the account library */
export function downloadUrl(entitlementId: string, format: DownloadFormat, ttlSeconds = 60 * 15) {
  return siteUrl(`/api/download?token=${createDownloadToken(entitlementId, format, ttlSeconds)}`);
}

/** Landing page link used in emails: lets them pick Letter/A4 and doesn't expire as fast (7 days) */
export function emailDownloadPageUrl(entitlementId: string) {
  return siteUrl(`/downloads/${createDownloadToken(entitlementId, "letter", 60 * 60 * 24 * 7)}`);
}
