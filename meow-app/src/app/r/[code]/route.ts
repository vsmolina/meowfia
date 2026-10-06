import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { REF_COOKIE } from "@/lib/referral-cookie";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";

/** Referral landing: /r/CODE → sets attribution cookie, counts the click, sends them home */
export async function GET(req: Request, ctx: RouteContext<"/r/[code]">) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  const dest = new URL(to && to.startsWith("/") && !to.startsWith("//") ? to : "/", url.origin);
  dest.searchParams.set("welcome", "recruit");
  const res = NextResponse.redirect(dest);

  if (!/^[a-z0-9]{8,40}$/i.test(code)) return res;
  const referrer = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!referrer) return res;

  res.cookies.set(REF_COOKIE, code, {
    maxAge: siteConfig.commerce.referral.cookieDays * 86_400,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: url.protocol === "https:",
  });
  const ip = await clientIp();
  const { ok } = await rateLimit(`refclick:${code}:${ip}`, 1, 60 * 60_000);
  if (ok) await db.referralClick.create({ data: { referrerId: referrer.id } });
  return res;
}
