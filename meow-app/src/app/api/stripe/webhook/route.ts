import type Stripe from "stripe";
import { db, type MembershipTier, type BillingInterval } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";
import { fulfillOrder, refundOrder } from "@/lib/orders";
import { markCommissionDepositPaid, markTipPaid, stripeStatusToMembership, upsertMembership } from "@/lib/payments";

/**
 * Stripe webhook. Signature-verified and idempotent (StripeEvent table).
 * Local testing: stripe listen --forward-to localhost:3847/api/stripe/webhook
 */
export async function POST(req: Request) {
  const s = stripe();
  if (!s || !env.STRIPE_WEBHOOK_SECRET) return new Response("Stripe webhooks not configured", { status: 501 });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(body, sig ?? "", env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.warn("[stripe] bad webhook signature", e instanceof Error ? e.message : e);
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: skip events we've already processed
  const seen = await db.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen) return Response.json({ received: true, duplicate: true });

  try {
    await handle(s, event);
    await db.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (e) {
    console.error(`[stripe] handler failed for ${event.type} ${event.id}`, e);
    return new Response("Handler error", { status: 500 }); // Stripe will retry
  }
  return Response.json({ received: true });
}

async function handle(s: Stripe, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status !== "paid" && session.mode !== "subscription") return; // async methods finish later
      const kind = session.metadata?.kind;
      if (kind === "order" && session.metadata?.orderId) {
        const sd = session.collected_information?.shipping_details;
        await fulfillOrder(session.metadata.orderId, {
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          shippingAddress: sd ? { name: sd.name, ...sd.address } : null,
        });
      } else if (kind === "tip" && session.metadata?.tipId) {
        await markTipPaid(session.metadata.tipId, session.customer_details?.email);
      } else if (kind === "commission" && session.metadata?.commissionId) {
        await markCommissionDepositPaid(session.metadata.commissionId);
      } else if (kind === "membership" && session.subscription) {
        const sub = await s.subscriptions.retrieve(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
        await syncSubscription(sub);
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      return;
    case "invoice.paid": {
      const inv = event.data.object;
      if (inv.amount_paid > 0) {
        await db.revenueEvent.create({ data: { channel: "MEMBERSHIPS", amountCents: inv.amount_paid, description: `Membership invoice ${inv.number ?? inv.id}` } });
      }
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (!pi || !charge.refunded) return; // partial refunds: handle manually in admin
      const order = await db.order.findFirst({ where: { stripePaymentIntentId: pi } });
      if (order) await refundOrder(order.id);
      return;
    }
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  // Derive tier/interval from the live price so plan switches in the portal are reflected
  const price = sub.items.data[0]?.price;
  const liveInterval: BillingInterval | undefined = price?.recurring?.interval === "year" ? "YEAR" : price?.recurring?.interval === "month" ? "MONTH" : undefined;
  const liveTier = siteConfig.membership.tiers.find((t) => (liveInterval === "YEAR" ? t.annualCents : t.monthlyCents) === price?.unit_amount)?.id;
  const tier = (liveTier ?? sub.metadata?.tier) as MembershipTier | undefined;
  const interval = (liveInterval ?? sub.metadata?.interval) as BillingInterval | undefined;
  if (!userId || !tier || !interval) return;
  const periodEnd = sub.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000);
  await upsertMembership({
    userId,
    tier,
    interval,
    status: stripeStatusToMembership(sub.status),
    currentPeriodEnd: new Date(periodEnd * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    stripeSubscriptionId: sub.id,
  });
}
