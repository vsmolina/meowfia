"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth-helpers";
import { fd, zodMessage } from "@/lib/admin-form";
import { sendEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { refundOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/site-url";
import { formatMoney } from "@/lib/format";
import { COMMISSION_STATUS_LABELS } from "@/lib/labels";
import { SimpleEmail } from "@/emails/simple";
import type { ActionState } from "@/lib/action-state";

export async function updateFulfillmentAction(orderId: string, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const status = z.enum(["UNFULFILLED", "PROCESSING", "SHIPPED", "DELIVERED", "NOT_REQUIRED"]).parse(fd.str(f, "fulfillmentStatus"));
    const trackingNumber = fd.opt(f, "trackingNumber");
    const trackingUrl = fd.opt(f, "trackingUrl");
    if (trackingUrl) z.string().url().parse(trackingUrl);
    const before = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    const order = await db.order.update({ where: { id: orderId }, data: { fulfillmentStatus: status, trackingNumber, trackingUrl } });
    if (status === "SHIPPED" && before.fulfillmentStatus !== "SHIPPED" && fd.bool(f, "notify")) {
      await sendEmail({
        to: order.email,
        subject: `📦 Order #${order.number} has shipped!`,
        template: "order-shipped",
        react: SimpleEmail({
          preview: "Your supplies are on the move",
          heading: "Your supplies have deployed",
          paragraphs: [`Order #${order.number} is on its way.${trackingNumber ? ` Tracking: ${trackingNumber}` : ""}`, "Tag us when your recruit takes it for a spin!"],
          cta: trackingUrl ? { label: "Track package", href: trackingUrl } : { label: "View order", href: siteUrl(`/account/orders/${order.id}`) },
        }),
      });
    }
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, message: "Order updated" };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

/** Full refund: through Stripe when configured, then revoke access + remove revenue */
export async function refundOrderAction(orderId: string) {
  await assertAdmin();
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "PAID") throw new Error("Only paid orders can be refunded");
  const s = stripe();
  if (s && order.stripePaymentIntentId && !order.stripePaymentIntentId.startsWith("pi_mock")) {
    await s.refunds.create({ payment_intent: order.stripePaymentIntentId });
  }
  await refundOrder(orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { refunded: true };
}

export async function updateCommissionAction(id: string, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const status = z.enum(["REQUESTED", "DEPOSIT_PAID", "QUOTED", "ACCEPTED", "IN_PROGRESS", "SHIPPED", "COMPLETED", "DECLINED"]).parse(fd.str(f, "status"));
    const quoteCents = fd.cents(f, "quote");
    const adminNotes = fd.opt(f, "adminNotes");
    const before = await db.commission.findUniqueOrThrow({ where: { id } });
    const c = await db.commission.update({ where: { id }, data: { status, quoteCents, adminNotes } });
    if (fd.bool(f, "notify") && status !== before.status) {
      const paragraphs =
        status === "QUOTED" && quoteCents
          ? [`Great news, ${c.name.split(" ")[0]}! We'd love to build your ${c.subjectType}.`, `Your quote is ${formatMoney(quoteCents)} total. Your ${formatMoney(c.depositCents)} deposit is already credited, so the balance is ${formatMoney(Math.max(0, quoteCents - c.depositCents))}.`, "Reply to this email to accept and we'll send the balance invoice and a ship date."]
          : status === "DECLINED"
            ? [`Thanks so much for thinking of us, ${c.name.split(" ")[0]}. Unfortunately we can't take this commission right now. Your deposit will be refunded in full within 5–10 business days.`]
            : [`Your ${c.subjectType} commission is now: ${COMMISSION_STATUS_LABELS[status]}.`];
      await sendEmail({ to: c.email, subject: `Commission update: ${COMMISSION_STATUS_LABELS[status]}`, template: `commission-${status.toLowerCase()}`, react: SimpleEmail({ preview: `Your commission is ${COMMISSION_STATUS_LABELS[status].toLowerCase()}`, heading: COMMISSION_STATUS_LABELS[status], paragraphs }) });
    }
    revalidatePath(`/admin/commissions/${id}`);
    return { ok: true, message: "Commission updated" };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}
