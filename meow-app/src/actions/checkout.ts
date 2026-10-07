"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCart, loadCartView, resolveCoupon } from "@/lib/cart";
import { getSessionUser } from "@/lib/auth-helpers";
import { createPendingOrder, fulfillOrder } from "@/lib/orders";
import { orderCheckoutUrl, PaymentsUnavailableError } from "@/lib/payments";
import { subscribe } from "@/lib/subscribe";
import { checkRateLimit } from "@/lib/rate-limit";
import { REF_COOKIE } from "@/lib/referral-cookie";
import { emailField, firstError } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

export async function checkoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = await checkRateLimit("checkout");
  if (limited) return { error: limited };
  const user = await getSessionUser();
  const parsedEmail = emailField.safeParse(user?.email ?? formData.get("email"));
  if (!parsedEmail.success) return { error: firstError(parsedEmail.error) };
  const email = parsedEmail.data;

  const cart = await getCart();
  const view = await loadCartView(cart);
  if (!cart || view.pricing.lines.length === 0) return { error: "Your cart is empty." };

  // Re-validate stock right before paying
  for (const item of cart.items) {
    if (item.variant?.inventory != null && item.quantity > item.variant.inventory) {
      return { error: `${item.variant.product.name} only has ${item.variant.inventory} left. Please update your cart.` };
    }
  }
  const total = view.pricing.totalCents;
  if (total > 0 && total < 50) return { error: "Card payments need to be at least $0.50. Add something small or remove a discount." };

  // Referral attribution: cookie, else who referred this account
  let referrerId: string | null = null;
  const code = (await cookies()).get(REF_COOKIE)?.value;
  if (code) referrerId = (await db.user.findUnique({ where: { referralCode: code }, select: { id: true } }))?.id ?? null;
  if (!referrerId && user) referrerId = (await db.user.findUnique({ where: { id: user.id }, select: { referredById: true } }))?.referredById ?? null;
  if (referrerId === user?.id) referrerId = null;

  const { coupon } = await resolveCoupon(cart.couponCode, email);
  await db.cart.update({ where: { id: cart.id }, data: { email } });
  if (formData.get("optIn") === "on") await subscribe({ email, name: user?.name ?? null, source: "checkout" });

  const order = await createPendingOrder(view, { email, userId: user?.id ?? null, referrerId, couponId: coupon?.id ?? null });

  let url: string;
  if (order.totalCents === 0) {
    await fulfillOrder(order.id);
    url = `/checkout/success?order=${order.id}`;
  } else {
    try {
      url = await orderCheckoutUrl(order, view.pricing);
    } catch (e) {
      console.error("[checkout] could not start payment", e);
      return { error: e instanceof PaymentsUnavailableError ? "Checkout is temporarily offline. Please try again soon!" : "We couldn't reach the payment processor. Please try again." };
    }
  }
  redirect(url);
}

/** Capture the email early for abandoned-cart reminders */
export async function captureCartEmailAction(email: string) {
  const parsed = z.string().trim().toLowerCase().pipe(z.email()).safeParse(email);
  if (!parsed.success) return;
  const cart = await getCart();
  if (cart && !cart.email) await db.cart.update({ where: { id: cart.id }, data: { email: parsed.data } });
}
