import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { formatDate, formatMoney } from "@/lib/format";
import { LICENSE_LABELS } from "@/lib/labels";
import { PageTitle } from "@/components/account/page-title";
import { StatusBadge } from "@/components/site/status-badge";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await db.order.findUnique({ where: { id }, include: { items: true, shippingRate: true, coupon: true } });
  // Ownership check: by user id or by the email used at checkout
  if (!order || (order.userId !== user.id && order.email !== user.email)) notFound();
  const addr = order.shippingAddress as Record<string, string> | null;

  const lines: [string, number][] = [
    ["Subtotal", order.subtotalCents],
    ...(order.discountCents ? ([[`Discount${order.coupon ? ` (${order.coupon.code})` : ""}`, -order.discountCents]] as [string, number][]) : []),
    ...(order.memberDiscountCents ? ([["Member discount", -order.memberDiscountCents]] as [string, number][]) : []),
    ...(order.shippingRateId ? ([[`Shipping (${order.shippingRate?.name ?? ""})`, order.shippingCents]] as [string, number][]) : []),
    ...(order.creditAppliedCents ? ([["Store credit", -order.creditAppliedCents]] as [string, number][]) : []),
    ...(order.giftCardAppliedCents ? ([["Gift card", -order.giftCardAppliedCents]] as [string, number][]) : []),
  ];

  return (
    <div className="space-y-6">
      <PageTitle eyebrow={formatDate(order.createdAt, "long")} title={`Order #${order.number}`}>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.fulfillmentStatus} />
        </div>
      </PageTitle>

      <div className="rounded-lg border-2 border-ink/80 bg-paper">
        <ul className="divide-y divide-dashed divide-ink/20">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">
                  {i.quantity > 1 && `${i.quantity}× `}
                  {i.name}
                </p>
                {i.kind === "TEMPLATE" && <p className="text-sm text-muted-foreground">{LICENSE_LABELS[i.license]} license · <Link className="underline" href="/account/downloads">Download</Link></p>}
                {i.giftRecipientEmail && <p className="text-sm text-muted-foreground">Gift for {i.giftRecipientEmail}</p>}
              </div>
              <p className="font-semibold">{formatMoney(i.totalCents)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t-2 border-ink/80 p-4 text-sm">
          {lines.map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v < 0 ? `−${formatMoney(-v)}` : formatMoney(v)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-dashed border-ink/30 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatMoney(order.totalCents)}</dd>
          </div>
        </dl>
      </div>

      {addr && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border-2 border-ink/80 bg-paper p-4">
            <h2 className="font-stencil">Ship to</h2>
            <address className="mt-1 text-sm not-italic text-muted-foreground">
              {[addr.name, addr.line1, addr.line2, `${addr.city ?? ""}, ${addr.state ?? ""} ${addr.postal_code ?? ""}`, addr.country].filter(Boolean).map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </address>
          </div>
          <div className="rounded-lg border-2 border-ink/80 bg-paper p-4">
            <h2 className="font-stencil">Tracking</h2>
            {order.trackingNumber ? (
              <p className="mt-1 text-sm">
                {order.trackingUrl ? <a className="font-semibold underline" href={order.trackingUrl} target="_blank" rel="noopener noreferrer">{order.trackingNumber}</a> : order.trackingNumber}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">We&apos;ll email tracking as soon as it ships.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
