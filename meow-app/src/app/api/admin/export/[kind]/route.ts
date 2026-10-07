import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { toCsv } from "@/lib/csv";
import { segmentRecipients } from "@/lib/marketing";

/** CSV exports: /api/admin/export/{orders|subscribers|customers}?segment=ALL */
export async function GET(req: Request, ctx: RouteContext<"/api/admin/export/[kind]">) {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") return new Response("Not found", { status: 404 });
  const { kind } = await ctx.params;
  let csv = "";
  if (kind === "orders") {
    const orders = await db.order.findMany({ where: { status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, include: { items: true, coupon: true } });
    csv = toCsv(
      orders.map((o) => {
        const a = (o.shippingAddress ?? {}) as Record<string, string>;
        return {
          number: o.number,
          date: o.paidAt ?? o.createdAt,
          email: o.email,
          status: o.status,
          fulfillment: o.fulfillmentStatus,
          items: o.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
          subtotal: (o.subtotalCents / 100).toFixed(2),
          discounts: ((o.discountCents + o.memberDiscountCents) / 100).toFixed(2),
          shipping: (o.shippingCents / 100).toFixed(2),
          credit_and_giftcards: ((o.creditAppliedCents + o.giftCardAppliedCents) / 100).toFixed(2),
          total: (o.totalCents / 100).toFixed(2),
          coupon: o.coupon?.code ?? "",
          ship_name: a.name ?? "",
          ship_address: [a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", "),
          tracking: o.trackingNumber ?? "",
          stripe_payment: o.stripePaymentIntentId ?? "",
        };
      }),
    );
  } else if (kind === "subscribers") {
    const segment = (new URL(req.url).searchParams.get("segment") ?? "ALL").toUpperCase() as "ALL" | "FREE" | "BUYERS" | "MEMBERS";
    const subs = await segmentRecipients(["ALL", "FREE", "BUYERS", "MEMBERS"].includes(segment) ? segment : "ALL");
    csv = toCsv(subs.map((s) => ({ email: s.email, name: s.name ?? "", source: s.source, subscribed_at: s.createdAt })));
  } else if (kind === "customers") {
    const users = await db.user.findMany({ include: { orders: { where: { status: "PAID" }, select: { totalCents: true } }, membership: true } });
    csv = toCsv(
      users.map((u) => ({
        email: u.email,
        name: u.name ?? "",
        handle: u.handle ?? "",
        joined: u.createdAt,
        orders: u.orders.length,
        lifetime_value: (u.orders.reduce((a, o) => a + o.totalCents, 0) / 100).toFixed(2),
        membership: u.membership ? `${u.membership.tier} (${u.membership.status})` : "",
        store_credit: (u.storeCreditCents / 100).toFixed(2),
      })),
    );
  } else return new Response("Unknown export", { status: 404 });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${kind}-${date}.csv"`, "Cache-Control": "no-store" } });
}
