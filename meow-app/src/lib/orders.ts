import "server-only";
import { randomBytes } from "node:crypto";
import { db, type Channel, type Prisma } from "@/lib/db";
import type { CartView } from "@/lib/cart";
import { grantEntitlement } from "@/lib/entitlements";
import { emailDownloadPageUrl } from "@/lib/downloads";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { createPrintfulOrder } from "@/lib/printful";
import { siteConfig } from "@/config/site";
import { ReceiptEmail } from "@/emails/receipt";
import { GiftCardEmail } from "@/emails/gift-card";

async function nextOrderNumber(tx: Prisma.TransactionClient) {
  const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
  return (last?.number ?? 1000) + 1;
}

/** Snapshot the priced cart into a PENDING order (what Stripe/mock checkout will pay for) */
export async function createPendingOrder(view: CartView, args: { email: string; userId: string | null; referrerId: string | null; couponId: string | null }) {
  const { cart, pricing } = view;
  if (!cart || pricing.lines.length === 0) throw new Error("Cart is empty");
  const byId = new Map(cart.items.map((i) => [i.id, i]));

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const number = await nextOrderNumber(tx);
        return tx.order.create({
          data: {
            number,
            email: args.email.toLowerCase(),
            userId: args.userId,
            status: "PENDING",
            subtotalCents: pricing.subtotalCents,
            discountCents: pricing.bundleDiscountCents + pricing.couponDiscountCents,
            memberDiscountCents: pricing.memberDiscountCents,
            shippingCents: pricing.shippingCents,
            creditAppliedCents: pricing.creditAppliedCents,
            giftCardAppliedCents: pricing.giftCardAppliedCents,
            totalCents: pricing.totalCents,
            couponId: args.couponId,
            giftCardCode: pricing.giftCardAppliedCents > 0 ? cart.giftCardCode : null,
            shippingRateId: pricing.needsShipping ? view.selectedShippingRateId : null,
            fulfillmentStatus: pricing.needsShipping ? "UNFULFILLED" : "NOT_REQUIRED",
            referrerId: args.referrerId,
            cartId: cart.id,
            items: {
              create: pricing.lines.map((l) => {
                const ci = byId.get(l.id)!;
                return {
                  kind: l.kind,
                  channel: l.channel as Channel,
                  name: l.name,
                  templateId: ci.templateId,
                  bundleId: ci.bundleId,
                  variantId: ci.variantId,
                  quantity: l.quantity,
                  unitPriceCents: Math.round(l.lineTotalCents / l.quantity),
                  totalCents: l.lineTotalCents,
                  license: ci.license,
                  giftRecipientEmail: ci.giftRecipientEmail,
                  giftRecipientName: ci.giftRecipientName,
                  giftMessage: ci.giftMessage,
                };
              }),
            },
          },
          include: { items: true },
        });
      });
    } catch (e) {
      // Unique order number race: retry
      if (attempt < 4 && e instanceof Error && e.message.includes("Unique constraint")) continue;
      throw e;
    }
  }
  throw new Error("Could not create order");
}

function giftCode() {
  const chunk = () => randomBytes(3).toString("hex").toUpperCase();
  return `MEOW-${chunk()}-${chunk()}`;
}

type ShippingAddress = { name?: string | null; line1?: string | null; line2?: string | null; city?: string | null; state?: string | null; postal_code?: string | null; country?: string | null };

/**
 * Mark an order paid and deliver everything. Idempotent: safe to call from both the
 * Stripe webhook and the success page / mock checkout.
 */
export async function fulfillOrder(orderId: string, payment: { stripePaymentIntentId?: string | null; shippingAddress?: ShippingAddress | null; email?: string | null } = {}) {
  // Atomically claim the order so concurrent webhook retries can't double-fulfill
  const claimed = await db.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: payment.stripePaymentIntentId ?? undefined,
      ...(payment.shippingAddress ? { shippingAddress: payment.shippingAddress as Prisma.InputJsonValue } : {}),
    },
  });
  if (claimed.count === 0) return { alreadyFulfilled: true };

  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { bundle: { include: { items: true } }, variant: { include: { product: true } }, template: true } }, coupon: true },
  });
  const email = order.email;

  // Digital delivery
  const downloads: { name: string; url: string }[] = [];
  for (const item of order.items) {
    const templateIds = item.kind === "TEMPLATE" && item.templateId ? [item.templateId] : item.kind === "BUNDLE" && item.bundle ? item.bundle.items.map((b) => b.templateId) : [];
    for (const templateId of templateIds) {
      const ent = await grantEntitlement({ email, templateId, source: "PURCHASE", license: item.license, orderId: order.id });
      const t = await db.template.findUnique({ where: { id: templateId }, select: { name: true } });
      downloads.push({ name: t?.name ?? item.name, url: emailDownloadPageUrl(ent.id) });
    }
  }

  // Inventory
  for (const item of order.items) {
    if (item.kind === "PRODUCT" && item.variantId && item.variant?.inventory != null) {
      await db.productVariant.update({ where: { id: item.variantId }, data: { inventory: { decrement: Math.min(item.quantity, item.variant.inventory) } } });
    }
  }

  // Gift cards: create codes and email recipients
  const buyerName = order.userId ? (await db.user.findUnique({ where: { id: order.userId }, select: { name: true } }))?.name : null;
  for (const item of order.items.filter((i) => i.kind === "GIFT_CARD")) {
    const code = giftCode();
    await db.giftCard.create({
      data: { code, initialCents: item.totalCents, balanceCents: item.totalCents, purchaserEmail: email, recipientEmail: item.giftRecipientEmail!, recipientName: item.giftRecipientName, message: item.giftMessage, orderId: order.id },
    });
    await sendEmail({
      to: item.giftRecipientEmail!,
      subject: `🎁 You've received a ${siteConfig.name} gift card`,
      template: "gift-card",
      react: GiftCardEmail({ code, amountCents: item.totalCents, fromName: buyerName ?? "A friend", recipientName: item.giftRecipientName, message: item.giftMessage, shopUrl: siteUrl("/fleet") }),
    });
  }

  // Coupons, credit, gift card balances
  if (order.couponId) await db.coupon.update({ where: { id: order.couponId }, data: { redemptions: { increment: 1 } } });
  if (order.creditAppliedCents > 0 && order.userId) {
    const u = await db.user.findUnique({ where: { id: order.userId }, select: { storeCreditCents: true } });
    await db.user.update({ where: { id: order.userId }, data: { storeCreditCents: Math.max(0, (u?.storeCreditCents ?? 0) - order.creditAppliedCents) } });
  }
  if (order.giftCardAppliedCents > 0 && order.giftCardCode) {
    const gc = await db.giftCard.findUnique({ where: { code: order.giftCardCode } });
    if (gc) await db.giftCard.update({ where: { id: gc.id }, data: { balanceCents: Math.max(0, gc.balanceCents - order.giftCardAppliedCents) } });
  }

  // Revenue ledger: allocate the cash actually paid across channels, pro rata
  const gross = order.items.reduce((a, i) => a + i.totalCents, 0) + order.shippingCents;
  const factor = gross > 0 ? order.totalCents / gross : 0;
  const byChannel = new Map<Channel, number>();
  for (const i of order.items) byChannel.set(i.channel, (byChannel.get(i.channel) ?? 0) + i.totalCents);
  const physical = order.items.find((i) => i.channel === "KITS" || i.channel === "MERCH")?.channel;
  if (physical && order.shippingCents) byChannel.set(physical, (byChannel.get(physical) ?? 0) + order.shippingCents);
  for (const [channel, cents] of byChannel) {
    const amount = Math.round(cents * factor);
    if (amount > 0) await db.revenueEvent.create({ data: { channel, amountCents: amount, description: `Order #${order.number}`, orderId: order.id, referred: Boolean(order.referrerId) } });
  }

  // Referral reward on the referred customer's first paid order
  if (order.referrerId && order.totalCents > 0) {
    const referrer = await db.user.findUnique({ where: { id: order.referrerId }, select: { id: true, email: true } });
    const priorPaid = await db.order.count({ where: { email, status: "PAID", id: { not: order.id } } });
    if (referrer && referrer.email !== email && priorPaid === 0) {
      const reward = Math.round((order.totalCents * siteConfig.commerce.referral.rewardPercent) / 100);
      await db.referralConversion.create({ data: { referrerId: referrer.id, orderId: order.id, referredEmail: email, orderTotalCents: order.totalCents, rewardCents: reward } });
      await db.user.update({ where: { id: referrer.id }, data: { storeCreditCents: { increment: reward } } });
    }
  }

  // Print-on-demand items to Printful
  const pod = order.items.filter((i) => i.variant?.printfulVariantId);
  const addr = (payment.shippingAddress ?? (order.shippingAddress as ShippingAddress | null)) || null;
  if (pod.length && addr?.line1) {
    try {
      const pf = await createPrintfulOrder({
        externalId: `order-${order.number}`,
        recipient: { name: addr.name ?? email, address1: addr.line1, address2: addr.line2, city: addr.city ?? "", state_code: addr.state, country_code: addr.country ?? "US", zip: addr.postal_code ?? "", email },
        items: pod.map((i) => ({ syncVariantId: i.variant!.printfulVariantId!, quantity: i.quantity })),
      });
      await db.order.update({ where: { id: order.id }, data: { printfulOrderId: pf.id, fulfillmentStatus: "PROCESSING" } });
    } catch (e) {
      console.error(`[printful] order #${order.number} failed. Fulfill manually.`, e);
    }
  }

  if (order.cartId) await db.cart.update({ where: { id: order.cartId }, data: { convertedAt: new Date() } }).catch(() => {});

  // Receipt
  const totals: { label: string; cents: number }[] = [
    { label: "Subtotal", cents: order.subtotalCents },
    ...(order.discountCents ? [{ label: "Discounts", cents: -order.discountCents }] : []),
    ...(order.memberDiscountCents ? [{ label: "Member discount", cents: -order.memberDiscountCents }] : []),
    ...(order.shippingRateId ? [{ label: "Shipping", cents: order.shippingCents }] : []),
    ...(order.creditAppliedCents ? [{ label: "Store credit", cents: -order.creditAppliedCents }] : []),
    ...(order.giftCardAppliedCents ? [{ label: "Gift card", cents: -order.giftCardAppliedCents }] : []),
    { label: "Total", cents: order.totalCents },
  ];
  await sendEmail({
    to: email,
    subject: `Order #${order.number} confirmed${downloads.length ? ". Your templates are ready" : ""}`,
    template: "receipt",
    react: ReceiptEmail({
      orderNumber: order.number,
      lines: order.items.map((i) => ({ name: i.name, quantity: i.quantity, totalCents: i.totalCents })),
      totals,
      downloads,
      shipping: order.shippingRateId !== null,
      accountUrl: siteUrl("/account/downloads"),
    }),
  });

  return { alreadyFulfilled: false, order };
}

/** Mark an order refunded (from Stripe charge.refunded) and revoke purchased access */
export async function refundOrder(orderId: string) {
  const order = await db.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  await db.entitlement.deleteMany({ where: { orderId: order.id, source: "PURCHASE" } });
  await db.revenueEvent.deleteMany({ where: { orderId: order.id } });
  return order;
}
