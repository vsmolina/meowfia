import "server-only";
import { headers } from "next/headers";
import { env, features } from "@/lib/env";

/**
 * Fixed-window rate limiter.
 *  - Upstash Redis (REST) when UPSTASH_* env vars are set, which works across serverless instances.
 *  - In-memory fallback for local dev and single instances.
 */
type Result = { ok: boolean; remaining: number; resetAt: number };

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    if (memory.size > 10_000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
}

async function upstashLimit(key: string, limit: number, windowMs: number): Promise<Result> {
  const windowKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", windowKey],
      ["PEXPIRE", windowKey, String(windowMs)],
    ]),
    cache: "no-store",
  });
  const data = (await res.json()) as Array<{ result: number }>;
  const count = Number(data[0]?.result ?? 0);
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt: Date.now() + windowMs };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<Result> {
  if (features.upstash) {
    try {
      return await upstashLimit(key, limit, windowMs);
    } catch (e) {
      console.warn("[rate-limit] Upstash failed, falling back to memory", e);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Presets */
export const limits = {
  form: { limit: 5, windowMs: 60_000 },
  upload: { limit: 10, windowMs: 10 * 60_000 },
  checkout: { limit: 15, windowMs: 60_000 },
  download: { limit: 60, windowMs: 10 * 60_000 },
  like: { limit: 60, windowMs: 60_000 },
} as const;

/** Convenience: limit by bucket + IP. Returns an error message or null. */
export async function checkRateLimit(bucket: keyof typeof limits, extraKey = ""): Promise<string | null> {
  const ip = await clientIp();
  const { limit, windowMs } = limits[bucket];
  const r = await rateLimit(`${bucket}:${ip}:${extraKey}`, limit, windowMs);
  return r.ok ? null : "Easy there, soldier. Too many requests. Try again in a minute.";
}

/** Exposed for tests */
export const __test = { memoryLimit, memory };
