import "server-only";
import type Stripe from "stripe";
import { db, type MembershipTier, type BillingInterval, type MembershipStatus } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { mockPaymentsEnabled } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email";
import { tierConfig } from "@/lib/access";
import { siteConfig } from "@/config/site";
import { SimpleEmail } from "@/emails/simple";
import type { PricingResult } from "@/lib/pricing";

/**
 * Checkout session creation for every payment type. Returns a URL to redirect to:
 * Stripe Checkout when configured, otherwise the local /checkout/mock page.
 * `metadata.kind` routes webhook handling: order | tip | commission | membership.
 */
export type CheckoutKind = "order" | "tip" | "commission" | "membership";

const SHIP_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = ["US", "CA", "GB", "AU", "NZ", "IE", "DE", "FR", "NL", "SE", "DK", "NO", "FI", "BE", "AT", "ES", "IT", "JP"];

export class PaymentsUnavailableError extends Error {
  constructor() {
    super("Payments are not configured. Set STRIPE_SECRET_KEY.");
  }
}

function mockUrl(kind: CheckoutKind, id: string, extra = "") {
  if (!mockPaymentsEnabled) throw new PaymentsUnavailableError();
  return siteUrl(`/checkout/mock?kind=${kind}&id=${id}${extra}`);
}

async function getOrCreateCustomer(s: Stripe, user: { id: string; email: string; name?: string | null }) {
  const u = await db.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (u?.stripeCustomerId) return u.stripeCustomerId;
  const c = await s.customers.create({ email: user.email, name: user.name ?? undefined, metadata: { userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: c.id } });
  return c.id;
}

export async function orderCheckoutUrl(order: { id: string; number: number; email: string; totalCents: number }, pricing: PricingResult) {
  const s = stripe();
  if (!s) return mockUrl("order", order.id);

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = pricing.lines.map((l) => ({
    quantity: l.quantity,
    price_data: { currency: siteConfig.commerce.currency, unit_amount: Math.round(l.lineTotalCents / l.quantity), product_data: { name: l.name } },
  }));
  if (pricing.shippingCents > 0) {
    line_items.push({ quantity: 1, price_data: { currency: siteConfig.commerce.currency, unit_amount: pricing.shippingCents, product_data: { name: "Shipping" } } });
  }
  // All discounts, credit, and gift card balance become one single-use coupon so Stripe's total matches ours exactly
  const reductions = pricing.discountCents + pricing.creditAppliedCents + pricing.giftCardAppliedCents;
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (reductions > 0) {
    const coupon = await s.coupons.create({ amount_off: reductions, currency: siteConfig.commerce.currency, duration: "once", max_redemptions: 1, name: "Discounts & credits" });
    discounts = [{ coupon: coupon.id }];
  }
  const session = await s.checkout.sessions.create({
    mode: "payment",
    line_items,
    discounts,
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { kind: "order", orderId: order.id },
    payment_intent_data: { metadata: { kind: "order", orderId: order.id } },
    ...(pricing.needsShipping ? { shipping_address_collection: { allowed_countries: SHIP_COUNTRIES }, phone_number_collection: { enabled: true } } : {}),
    success_url: siteUrl(`/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: siteUrl("/cart?canceled=1"),
  });
  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  return session.url!;
}

export async function tipCheckoutUrl(tip: { id: string; amountCents: number; email?: string | null }) {
  const s = stripe();
  if (!s) return mockUrl("tip", tip.id);
  const session = await s.checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    line_items: [{ quantity: 1, price_data: { currency: siteConfig.commerce.currency, unit_amount: tip.amountCents, product_data: { name: `Tip for ${siteConfig.name}`, description: "Thank you for supporting the mission!" } } }],
    customer_email: tip.email ?? undefined,
    metadata: { kind: "tip", tipId: tip.id },
    success_url: siteUrl(`/support/thanks?tip=${tip.id}`),
    cancel_url: siteUrl("/support"),
  });
  await db.tip.update({ where: { id: tip.id }, data: { stripeSessionId: session.id } });
  return session.url!;
}

export async function commissionCheckoutUrl(c: { id: string; depositCents: number; email: string; subjectType: string }) {
  const s = stripe();
  if (!s) return mockUrl("commission", c.id);
  const session = await s.checkout.sessions.create({
    mode: "payment",
    line_items: [{ quantity: 1, price_data: { currency: siteConfig.commerce.currency, unit_amount: c.depositCents, product_data: { name: `Custom commission deposit (${c.subjectType})`, description: "Credited toward your final quote. Refundable if we can't take the commission." } } }],
    customer_email: c.email,
    metadata: { kind: "commission", commissionId: c.id },
    success_url: siteUrl(`/shop/commissions/thanks?id=${c.id}`),
    cancel_url: siteUrl("/shop/commissions"),
  });
  await db.commission.update({ where: { id: c.id }, data: { stripeSessionId: session.id } });
  return session.url!;
}

export async function membershipCheckoutUrl(user: { id: string; email: string; name: string | null }, tier: MembershipTier, interval: BillingInterval) {
  const s = stripe();
  const cfg = tierConfig(tier);
  if (!s) return mockUrl("membership", user.id, `&tier=${tier}&interval=${interval}`);
  const customer = await getOrCreateCustomer(s, user);
  // Inline prices: no need to pre-create Products/Prices in the Stripe dashboard.
  // (For reporting, she can later create real Prices and swap these for price IDs.)
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: siteConfig.commerce.currency,
          unit_amount: interval === "YEAR" ? cfg.annualCents : cfg.monthlyCents,
          recurring: { interval: interval === "YEAR" ? "year" : "month" },
          product_data: { name: `${siteConfig.membership.name}: ${cfg.name}` },
        },
      },
    ],
    metadata: { kind: "membership", userId: user.id, tier, interval },
    subscription_data: { metadata: { userId: user.id, tier, interval } },
    allow_promotion_codes: true,
    success_url: siteUrl("/barracks/welcome?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: siteUrl("/barracks"),
  });
  return session.url!;
}

// ───────────── Completion handlers (webhook + mock) ─────────────

export async function markTipPaid(tipId: string, email?: string | null) {
  const claimed = await db.tip.updateMany({ where: { id: tipId, paid: false }, data: { paid: true, paidAt: new Date(), ...(email ? { email } : {}) } });
  if (!claimed.count) return;
  const tip = await db.tip.findUniqueOrThrow({ where: { id: tipId } });
  await db.revenueEvent.create({ data: { channel: "TIPS", amountCents: tip.amountCents, description: `Tip${tip.name ? ` from ${tip.name}` : ""}` } });
  if (tip.email) {
    await sendEmail({
      to: tip.email,
      subject: "Thank you for supporting the mission 🫡",
      template: "tip-thanks",
      react: SimpleEmail({
        preview: "Your tip just bought a lot of packing tape",
        heading: "Salute, soldier!",
        paragraphs: [
          `Your $${(tip.amountCents / 100).toFixed(2)} tip goes straight to cardboard, glue, and treats for the crew. It genuinely keeps the motor pool running.`,
          tip.showOnWall ? "Your name is on the Supporters Wall. Go take a look!" : "",
          `With gratitude, ${siteConfig.creator.firstName} & the crew`,
        ].filter(Boolean),
        cta: { label: "See the Supporters Wall", href: siteUrl("/support#wall") },
      }),
    });
  }
}

export async function markCommissionDepositPaid(commissionId: string) {
  const claimed = await db.commission.updateMany({ where: { id: commissionId, status: "REQUESTED" }, data: { status: "DEPOSIT_PAID", depositPaidAt: new Date() } });
  if (!claimed.count) return;
  const c = await db.commission.findUniqueOrThrow({ where: { id: commissionId } });
  await db.revenueEvent.create({ data: { channel: "COMMISSIONS", amountCents: c.depositCents, description: `Commission deposit (${c.subjectType})` } });
  await Promise.all([
    sendEmail({
      to: c.email,
      subject: "Commission request received 📐",
      template: "commission-received",
      react: SimpleEmail({
        preview: "Your deposit is in. Here's what happens next",
        heading: "Blueprints received",
        paragraphs: [
          `Thanks ${c.name}! Your deposit is in and your ${c.subjectType} request is in the queue.`,
          "Within 3 business days, you'll get a quote and an estimated ship date. The deposit is credited toward the final price, and it's fully refunded if we can't take the job.",
        ],
        cta: { label: "Track your commission", href: siteUrl("/account") },
      }),
    }),
    sendEmail({
      to: siteConfig.creator.email,
      subject: `New commission request: ${c.subjectType} from ${c.name}`,
      template: "admin-commission",
      react: SimpleEmail({ preview: "New commission", heading: "New commission request", paragraphs: [c.description], details: [["From", `${c.name} <${c.email}>`], ["Subject", c.subjectType], ["Cats", String(c.catCount)]], cta: { label: "Open in admin", href: siteUrl("/admin/commissions") } }),
    }),
  ]);
}

/** Create/update the local membership row from subscription state */
export async function upsertMembership(args: {
  userId: string;
  tier: MembershipTier;
  interval: BillingInterval;
  status: MembershipStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string | null;
}) {
  const existing = await db.membership.findUnique({ where: { userId: args.userId } });
  const isNew = !existing || existing.status === "CANCELED";
  const data = {
    tier: args.tier,
    interval: args.interval,
    status: args.status,
    currentPeriodEnd: args.currentPeriodEnd,
    cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    stripeSubscriptionId: args.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
  };
  await db.membership.upsert({ where: { userId: args.userId }, create: { userId: args.userId, ...data }, update: data });
  if (isNew && (args.status === "ACTIVE" || args.status === "TRIALING")) {
    const user = await db.user.findUnique({ where: { id: args.userId }, select: { email: true, name: true } });
    const cfg = tierConfig(args.tier);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `Welcome to ${siteConfig.membership.name}, ${cfg.name} 🎖️`,
        template: "membership-welcome",
        react: SimpleEmail({
          preview: "Your membership is active. Here's how to use your perks",
          heading: `Welcome, ${cfg.name}${user.name ? ` ${user.name.split(" ")[0]}` : ""}`,
          paragraphs: [
            `You're officially enlisted in ${siteConfig.membership.name}. Here's what's unlocked:`,
            cfg.perks.map((p) => `• ${p}`).join("\n"),
            "Your members-only templates are already waiting in your armory, and your shop discount applies automatically at checkout.",
          ],
          cta: { label: "Open your armory", href: siteUrl("/account/downloads") },
        }),
      });
    }
  }
}

export function stripeStatusToMembership(status: Stripe.Subscription.Status): MembershipStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "PAST_DUE";
    default:
      return "CANCELED";
  }
}
