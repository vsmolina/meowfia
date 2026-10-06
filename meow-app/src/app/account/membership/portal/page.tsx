import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { tierConfig } from "@/lib/access";
import { formatDate, formatMoney } from "@/lib/format";
import { mockPortalAction } from "@/actions/billing";
import { PageTitle } from "@/components/account/page-title";
import { Stamp } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Billing portal (test mode)" };

/** Local stand-in for the Stripe Customer Portal when STRIPE_SECRET_KEY isn't set */
export default async function MockPortalPage() {
  const user = await requireUser("/account/membership/portal");
  if (stripe()) redirect("/account/membership");
  const m = await db.membership.findUnique({ where: { userId: user.id } });
  if (!m) redirect("/barracks");
  const tier = tierConfig(m.tier);
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Test mode" title="Billing portal">
        <Stamp color="olive" size="sm">Mock</Stamp>
      </PageTitle>
      <p className="rounded-md border-2 border-dashed border-olive p-3 text-sm">
        Stripe isn&apos;t configured, so this page simulates the Stripe Customer Portal. With a Stripe key, members are sent to Stripe&apos;s hosted portal to update cards, switch plans, view invoices, and cancel.
      </p>
      <div className="rounded-lg border-2 border-ink/80 bg-paper p-5">
        <p className="font-stencil text-xl">{tier.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatMoney(m.interval === "YEAR" ? tier.annualCents : tier.monthlyCents)} / {m.interval === "YEAR" ? "year" : "month"} · {m.status.toLowerCase()} · {m.cancelAtPeriodEnd ? "ends" : "renews"} {formatDate(m.currentPeriodEnd)}
        </p>
        <form action={mockPortalAction} className="mt-4 flex flex-wrap gap-2">
          {m.cancelAtPeriodEnd ? (
            <Button name="op" value="resume" type="submit">Resume membership</Button>
          ) : (
            <Button name="op" value="cancel" type="submit" variant="outline">Cancel at period end</Button>
          )}
          <Button name="op" value="end-now" type="submit" variant="destructive">End immediately (test)</Button>
        </form>
      </div>
    </div>
  );
}
