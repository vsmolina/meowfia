"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mockPaymentsEnabled } from "@/lib/env";
import { getSessionUser } from "@/lib/auth-helpers";
import { fulfillOrder } from "@/lib/orders";
import { markCommissionDepositPaid, markTipPaid, upsertMembership } from "@/lib/payments";
import { tierConfig } from "@/lib/access";

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("order"), id: z.string().cuid(), name: z.string().max(80).optional(), line1: z.string().max(120).optional(), city: z.string().max(60).optional(), state: z.string().max(40).optional(), postal_code: z.string().max(20).optional(), country: z.string().max(2).optional() }),
  z.object({ kind: z.literal("tip"), id: z.string().cuid() }),
  z.object({ kind: z.literal("commission"), id: z.string().cuid() }),
  z.object({ kind: z.literal("membership"), id: z.string(), tier: z.enum(["RECRUIT", "OFFICER", "COMMANDER"]), interval: z.enum(["MONTH", "YEAR"]) }),
]);

/** Simulates a successful Stripe payment. Refuses to run when real payments are configured. */
export async function mockPayAction(formData: FormData) {
  if (!mockPaymentsEnabled) throw new Error("Mock payments are disabled");
  const parsed = schema.parse(Object.fromEntries(formData));
  revalidatePath("/", "layout"); // refresh header cart count

  switch (parsed.kind) {
    case "order": {
      const order = await db.order.findUnique({ where: { id: parsed.id }, select: { shippingRateId: true } });
      if (!order) throw new Error("Order not found");
      await fulfillOrder(parsed.id, {
        stripePaymentIntentId: `pi_mock_${Date.now()}`,
        shippingAddress: order.shippingRateId ? { name: parsed.name, line1: parsed.line1, city: parsed.city, state: parsed.state, postal_code: parsed.postal_code, country: parsed.country ?? "US" } : null,
      });
      redirect(`/checkout/success?order=${parsed.id}`);
    }
    case "tip":
      await markTipPaid(parsed.id);
      redirect(`/support/thanks?tip=${parsed.id}`);
    case "commission":
      await markCommissionDepositPaid(parsed.id);
      redirect(`/shop/commissions/thanks?id=${parsed.id}`);
    case "membership": {
      const user = await getSessionUser();
      if (!user || user.id !== parsed.id) throw new Error("Sign in as the subscribing user");
      const cfg = tierConfig(parsed.tier);
      const days = parsed.interval === "YEAR" ? 365 : 30;
      await upsertMembership({ userId: user.id, tier: parsed.tier, interval: parsed.interval, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + days * 86_400_000), cancelAtPeriodEnd: false });
      await db.revenueEvent.create({ data: { channel: "MEMBERSHIPS", amountCents: parsed.interval === "YEAR" ? cfg.annualCents : cfg.monthlyCents, description: `${cfg.name} membership (mock)` } });
      redirect("/barracks/welcome");
    }
  }
}
