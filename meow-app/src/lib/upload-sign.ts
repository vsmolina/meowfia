import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { signingSecret } from "@/lib/env";

/** Signed, short-lived URLs for the local-disk upload route (dev / single-server installs) */
function sign(key: string, contentType: string, exp: number) {
  return createHmac("sha256", signingSecret()).update(`upload:${key}:${contentType}:${exp}`).digest("base64url");
}

export function localUploadUrl(key: string, contentType: string) {
  const exp = Math.floor(Date.now() / 1000) + 600;
  const q = new URLSearchParams({ key, ct: contentType, exp: String(exp), sig: sign(key, contentType, exp) });
  return `/api/admin/upload?${q}`;
}

export function verifyLocalUpload(key: string, contentType: string, exp: number, sig: string) {
  if (!exp || exp * 1000 < Date.now()) return false;
  const a = Buffer.from(sign(key, contentType, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
