import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Affiliate redirect with click counting. rel="sponsored" on links; this keeps the target URL editable in admin. */
export async function GET(req: Request, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  const link = await db.affiliateLink.findFirst({ where: { id, active: true } });
  if (!link || !/^https?:\/\//.test(link.url)) return NextResponse.redirect(new URL("/supply-depot", req.url));
  await db.affiliateLink.update({ where: { id }, data: { clicks: { increment: 1 } } });
  return NextResponse.redirect(link.url, { status: 302, headers: { "X-Robots-Tag": "noindex" } });
}
