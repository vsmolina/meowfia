import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { JOBS, type JobName } from "@/lib/jobs";

/**
 * Scheduled jobs: GET /api/cron/{drops|welcome|abandoned-carts|printful-sync}
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically.
 */
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: Request, ctx: RouteContext<"/api/cron/[job]">) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const { job } = await ctx.params;
  const fn = JOBS[job as JobName];
  if (!fn) return new Response("Unknown job", { status: 404 });
  const started = Date.now();
  try {
    const result = await fn();
    return Response.json({ job, ok: true, ms: Date.now() - started, ...result });
  } catch (e) {
    console.error(`[cron] ${job} failed`, e);
    return Response.json({ job, ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
