import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveMembership, tierConfig } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { PageTitle, EmptyState } from "@/components/account/page-title";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";
import { ManageBillingButton } from "@/components/barracks/manage-billing-button";

export const metadata: Metadata = { title: "Membership" };

export default async function MembershipPage() {
  const user = await requireUser("/account/membership");
  const m = await getActiveMembership(user.id);

  if (!m) {
    return (
      <div>
        <PageTitle eyebrow={siteConfig.membership.name} title="Membership" />
        <EmptyState title="You haven't enlisted yet" action={<Button asChild><Link href="/barracks">See membership tiers</Link></Button>}>
          Members get exclusive monthly templates, early access to drops, shop discounts, and a vote on the next build.
        </EmptyState>
      </div>
    );
  }
  const tier = tierConfig(m.tier);
  return (
    <div className="space-y-6">
      <PageTitle eyebrow={siteConfig.membership.name} title="Membership" />
      <div className="rounded-xl border-2 border-ink bg-olive-camo p-6 text-paper shadow-stamp">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-stencil text-3xl">{tier.name}</p>
          <StatusBadge status={m.status} className="bg-paper text-ink" />
        </div>
        <p className="mt-1 text-paper/85">
          Billed {m.interval === "YEAR" ? "annually" : "monthly"} · {m.cancelAtPeriodEnd ? "Ends" : "Renews"} on {formatDate(m.currentPeriodEnd, "long")}
        </p>
        <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
          {tier.perks.map((p) => (
            <li key={p}>✔ {p}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <ManageBillingButton />
          <Button asChild variant="outline" className="border-paper bg-transparent text-paper hover:bg-paper hover:text-ink">
            <Link href="/barracks/vote">Vote on the next build</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
