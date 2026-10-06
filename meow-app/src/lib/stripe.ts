import "server-only";
import Stripe from "stripe";
import { env, features } from "@/lib/env";

/**
 * Stripe client, or null when STRIPE_SECRET_KEY is missing. In that case checkout
 * flows redirect to the local /checkout/mock page, which runs the same
 * fulfillment code the webhook would.
 */
let client: Stripe | null | undefined;

export function stripe(): Stripe | null {
  if (client === undefined) {
    client = features.stripe ? new Stripe(env.STRIPE_SECRET_KEY!, { appInfo: { name: "meowfia" } }) : null;
    if (client && env.STRIPE_SECRET_KEY!.startsWith("sk_live") && env.NODE_ENV !== "production") {
      console.warn("⚠️  Using a LIVE Stripe key outside production.");
    }
  }
  return client;
}

export const isStripeMock = () => !features.stripe;
