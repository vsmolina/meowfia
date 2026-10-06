"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site-url";

/** Opens the Stripe billing portal (or the local mock portal when Stripe isn't configured) */
export async function openBillingPortalAction() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?callbackUrl=/account/membership");
  const s = stripe();
  const profile = await db.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (!s || !profile?.stripeCustomerId) redirect("/account/membership/portal");
  const session = await s.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: siteUrl("/account/membership"),
  });
  redirect(session.url);
}

/** Mock portal actions (only used when Stripe is not configured) */
export async function mockPortalAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (stripe()) redirect("/account/membership"); // real portal handles this when Stripe is configured
  const op = formData.get("op");
  const m = await db.membership.findUnique({ where: { userId: user.id } });
  if (!m) redirect("/barracks");
  if (op === "cancel") await db.membership.update({ where: { userId: user.id }, data: { cancelAtPeriodEnd: true } });
  if (op === "resume") await db.membership.update({ where: { userId: user.id }, data: { cancelAtPeriodEnd: false } });
  if (op === "end-now") await db.membership.update({ where: { userId: user.id }, data: { status: "CANCELED", currentPeriodEnd: new Date() } });
  redirect("/account/membership");
}
