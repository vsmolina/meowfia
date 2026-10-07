import { db } from "@/lib/db";

/** RFC 8058 one-click unsubscribe (mail clients POST here from the List-Unsubscribe header) */
export async function POST(_req: Request, ctx: RouteContext<"/api/unsubscribe/[token]">) {
  const { token } = await ctx.params;
  await db.subscriber.updateMany({ where: { unsubscribeToken: token }, data: { status: "UNSUBSCRIBED" } });
  return new Response("Unsubscribed", { status: 200 });
}
