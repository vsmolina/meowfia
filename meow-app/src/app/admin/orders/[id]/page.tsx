import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { LICENSE_LABELS } from "@/lib/labels";
import { refundOrderAction, updateFulfillmentAction } from "@/actions/admin/operations";
import { AdminPage, Section } from "@/components/admin/ui";
import { AdminForm, Checkbox, ConfirmButton, SelectInput, TextInput } from "@/components/admin/form";
import { StatusBadge } from "@/components/site/status-badge";

export const metadata = { title: "Order" };

export default async function AdminOrder({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, include: { items: true, coupon: true, shippingRate: true, referralConversion: { include: { referrer: { select: { email: true } } } } } });
  if (!o) notFound();
  const a = (o.shippingAddress ?? null) as Record<string, string> | null;
  return (
    <AdminPage title={`Order #${o.number}`} description={`${o.email} · ${formatDate(o.paidAt ?? o.createdAt, "long")}`} actions={<><StatusBadge status={o.status} /><StatusBadge status={o.fulfillmentStatus} /></>}>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Section title="Items">
            <ul className="divide-y divide-dashed divide-ink/20 text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {i.quantity}× {i.name}
                    {(i.kind === "TEMPLATE" || i.kind === "BUNDLE") && <span className="text-muted-foreground"> · {LICENSE_LABELS[i.license]}</span>}
                    {i.giftRecipientEmail && <span className="text-muted-foreground"> · gift to {i.giftRecipientEmail}</span>}
                  </span>
                  <span>{formatMoney(i.totalCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-1 border-t-2 border-ink/30 pt-2 text-sm">
              <dt>Subtotal</dt><dd className="text-right">{formatMoney(o.subtotalCents)}</dd>
              <dt>Discounts{o.coupon ? ` (${o.coupon.code})` : ""}</dt><dd className="text-right">−{formatMoney(o.discountCents + o.memberDiscountCents)}</dd>
              <dt>Shipping</dt><dd className="text-right">{formatMoney(o.shippingCents)}</dd>
              <dt>Credit / gift card</dt><dd className="text-right">−{formatMoney(o.creditAppliedCents + o.giftCardAppliedCents)}</dd>
              <dt className="font-bold">Total paid</dt><dd className="text-right font-bold">{formatMoney(o.totalCents)}</dd>
            </dl>
          </Section>
          <Section title="Payment">
            <dl className="grid grid-cols-[140px_1fr] gap-1 text-sm">
              <dt className="text-muted-foreground">Stripe payment</dt><dd className="font-mono text-xs">{o.stripePaymentIntentId ?? "-"}</dd>
              <dt className="text-muted-foreground">Printful order</dt><dd className="font-mono text-xs">{o.printfulOrderId ?? "-"}</dd>
              <dt className="text-muted-foreground">Referred by</dt><dd>{o.referralConversion ? `${o.referralConversion.referrer.email} (+${formatMoney(o.referralConversion.rewardCents)} credit)` : "-"}</dd>
            </dl>
            {o.status === "PAID" && <ConfirmButton action={refundOrderAction.bind(null, o.id)} label="Refund in full" confirmLabel="Confirm full refund" />}
          </Section>
        </div>
        <div className="space-y-6">
          {a && (
            <Section title="Ship to">
              <address className="text-sm not-italic">
                {[a.name, a.line1, a.line2, `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`, a.country].filter(Boolean).map((l) => <span key={l} className="block">{l}</span>)}
              </address>
              <p className="text-xs text-muted-foreground">{o.shippingRate?.name}</p>
            </Section>
          )}
          <Section title="Fulfillment">
            <AdminForm action={updateFulfillmentAction.bind(null, o.id)} submitLabel="Update">
              <SelectInput label="Status" name="fulfillmentStatus" defaultValue={o.fulfillmentStatus} options={["UNFULFILLED", "PROCESSING", "SHIPPED", "DELIVERED", "NOT_REQUIRED"].map((s) => ({ value: s, label: s.replace("_", " ").toLowerCase() }))} />
              <TextInput label="Tracking number" name="trackingNumber" defaultValue={o.trackingNumber} />
              <TextInput label="Tracking URL" name="trackingUrl" defaultValue={o.trackingUrl} />
              <Checkbox label="Email customer when marked shipped" name="notify" defaultChecked />
            </AdminForm>
          </Section>
        </div>
      </div>
    </AdminPage>
  );
}
