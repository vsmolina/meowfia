import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { db } from "@/lib/db";
import { mockPaymentsEnabled } from "@/lib/env";
import { tierConfig } from "@/lib/access";
import { formatMoney } from "@/lib/format";
import { mockPayAction } from "@/actions/mock-pay";
import { Stamp, FileTag } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Test checkout", robots: { index: false } };

/** Stand-in for Stripe Checkout when no Stripe key is configured (development only) */
export default async function MockCheckoutPage({ searchParams }: PageProps<"/checkout/mock">) {
  if (!mockPaymentsEnabled) notFound();
  const sp = await searchParams;
  const kind = String(sp.kind ?? "");
  const id = String(sp.id ?? "");

  let title = "";
  let amount = 0;
  let lines: { name: string; cents: number }[] = [];
  let needsShipping = false;
  const hidden: Record<string, string> = { kind, id };

  if (kind === "order") {
    const o = await db.order.findUnique({ where: { id }, include: { items: true } });
    if (!o) notFound();
    if (o.status !== "PENDING") return <p className="p-10 text-center">This order is already {o.status.toLowerCase()}.</p>;
    title = `Order #${o.number}`;
    amount = o.totalCents;
    lines = o.items.map((i) => ({ name: `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.name}`, cents: i.totalCents }));
    needsShipping = Boolean(o.shippingRateId);
  } else if (kind === "tip") {
    const t = await db.tip.findUnique({ where: { id } });
    if (!t) notFound();
    title = "Tip";
    amount = t.amountCents;
  } else if (kind === "commission") {
    const c = await db.commission.findUnique({ where: { id } });
    if (!c) notFound();
    title = `Commission deposit (${c.subjectType})`;
    amount = c.depositCents;
  } else if (kind === "membership") {
    const tier = String(sp.tier) as "RECRUIT" | "OFFICER" | "COMMANDER";
    const interval = String(sp.interval) as "MONTH" | "YEAR";
    const cfg = tierConfig(tier);
    if (!cfg) notFound();
    title = `${cfg.name} membership (${interval === "YEAR" ? "annual" : "monthly"})`;
    amount = interval === "YEAR" ? cfg.annualCents : cfg.monthlyCents;
    hidden.tier = tier;
    hidden.interval = interval;
  } else notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="relative rounded-xl border-2 border-ink bg-paper p-6 shadow-stamp">
        <Stamp className="absolute -right-3 -top-4" color="olive" size="sm" rotate={6}>
          Test mode
        </Stamp>
        <FileTag>Mock payment terminal</FileTag>
        <h1 className="font-stencil text-2xl text-olive-dark">{title}</h1>
        <p className="mt-2 rounded-md border-2 border-dashed border-olive p-3 text-sm">
          No <code>STRIPE_SECRET_KEY</code> is set, so this simulates Stripe Checkout. Clicking pay runs the exact same fulfillment the Stripe webhook would.
        </p>
        {lines.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {lines.map((l, i) => (
              <li key={i} className="flex justify-between">
                <span>{l.name}</span>
                <span>{formatMoney(l.cents)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex justify-between border-t-2 border-dashed border-ink/25 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatMoney(amount)}</span>
        </p>
        <form action={mockPayAction} className="mt-5 space-y-3">
          {Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          {needsShipping && (
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-semibold">Shipping address (test)</legend>
              <Input name="name" defaultValue="Test Recruit" aria-label="Name" />
              <Input name="line1" defaultValue="123 Cardboard Ave" aria-label="Address" />
              <div className="grid grid-cols-3 gap-2">
                <Input name="city" defaultValue="Boxford" aria-label="City" />
                <Input name="state" defaultValue="MA" aria-label="State" />
                <Input name="postal_code" defaultValue="01921" aria-label="ZIP" />
              </div>
              <input type="hidden" name="country" value="US" />
            </fieldset>
          )}
          <Button type="submit" size="lg" className="h-14 w-full font-stencil text-lg tracking-wider">
            <CreditCard /> Pay {formatMoney(amount)} (test)
          </Button>
        </form>
      </div>
    </div>
  );
}
