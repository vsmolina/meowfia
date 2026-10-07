import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/orders";
import { downloadUrl } from "@/lib/downloads";
import { formatMoney, isWithin } from "@/lib/format";
import { Stamp, FileTag } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";
import { PurchaseTracker } from "@/components/site/purchase-tracker";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const sp = await searchParams;
  const orderId = typeof sp.order === "string" ? sp.order : "";
  let order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) notFound();

  // If the webhook hasn't arrived yet, verify directly with Stripe and fulfill (idempotent)
  const s = stripe();
  if (order.status === "PENDING" && s && typeof sp.session_id === "string" && sp.session_id === order.stripeSessionId) {
    const session = await s.checkout.sessions.retrieve(sp.session_id);
    if (session.payment_status === "paid" && session.metadata?.orderId === order.id) {
      const sd = session.collected_information?.shipping_details;
      await fulfillOrder(order.id, { stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null, shippingAddress: sd ? { name: sd.name, ...sd.address } : null });
      order = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
    }
  }

  const paid = order.status === "PAID";
  // Only show direct download buttons for 24h after purchase (the link may get shared)
  const fresh = paid && order.paidAt && isWithin(order.paidAt, 86_400_000);
  const ents = fresh ? await db.entitlement.findMany({ where: { orderId: order.id }, include: { template: { select: { name: true } } } }) : [];

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      {paid && <PurchaseTracker value={order.totalCents / 100} orderId={order.id} />}
      <div className="relative rounded-xl border-2 border-ink bg-dossier p-6 shadow-stamp sm:p-8">
        {paid ? (
          <>
            <Stamp className="absolute -right-3 -top-5" color="olive" rotate={8}>Approved</Stamp>
            <CheckCircle2 className="size-12 text-olive" aria-hidden="true" />
            <FileTag className="mt-4 block">Requisition #{order.number}</FileTag>
            <h1 className="font-stencil text-3xl text-olive-dark">Mission accomplished!</h1>
            <p className="mt-2 text-muted-foreground">
              A receipt is on its way to <b className="text-ink">{order.email}</b>. Total paid: {formatMoney(order.totalCents)}.
            </p>
          </>
        ) : (
          <>
            <Loader2 className="size-10 animate-spin text-olive" aria-hidden="true" />
            <h1 className="mt-4 font-stencil text-3xl text-olive-dark">Confirming payment…</h1>
            <p className="mt-2 text-muted-foreground">This usually takes a few seconds. Refresh shortly, or watch your email for your receipt.</p>
          </>
        )}

        {ents.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="font-stencil text-lg">Your downloads</h2>
            {ents.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border-2 border-ink/30 bg-paper p-3">
                <p className="font-semibold">{e.template.name}</p>
                <div className="flex gap-2">
                  <Button asChild size="sm"><a href={downloadUrl(e.id, "letter")}><Download /> Letter</a></Button>
                  <Button asChild size="sm" variant="kraft"><a href={downloadUrl(e.id, "a4")}><Download /> A4</a></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {paid && order.shippingRateId && <p className="mt-6 text-sm">📦 Physical items ship in 2–4 business days. Tracking will be emailed.</p>}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link href="/account/downloads">Go to my armory</Link></Button>
          <Button asChild variant="outline"><Link href="/recruits/new">Post your cat&apos;s build</Link></Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No account yet? Sign in with {order.email} and everything will be waiting.</p>
      </div>
    </div>
  );
}
