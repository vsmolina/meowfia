import Link from "next/link";
import { ArrowRight, Download, Package, Coins, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveMembership, tierConfig } from "@/lib/access";
import { rankFor } from "@/lib/ranks";
import { siteConfig } from "@/config/site";
import { formatDate, formatMoney } from "@/lib/format";
import { RankBadge } from "@/components/brand/rank-badge";
import { PageTitle } from "@/components/account/page-title";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default async function AccountOverview() {
  const user = await requireUser();
  const [profile, approved, downloads, orders, membership, referrals] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { storeCreditCents: true, referralCode: true, createdAt: true } }),
    db.galleryPost.count({ where: { userId: user.id, status: "APPROVED" } }),
    db.entitlement.count({ where: { OR: [{ userId: user.id }, { email: user.email }] } }),
    db.order.findMany({ where: { OR: [{ userId: user.id }, { email: user.email }], status: "PAID" }, orderBy: { createdAt: "desc" }, take: 3, include: { items: true } }),
    getActiveMembership(user.id),
    db.referralConversion.count({ where: { referrerId: user.id } }),
  ]);
  const rank = rankFor(approved);
  const floor = siteConfig.ranks[rank.index].min;
  const ceiling = rank.next ? approved + rank.next.needed : approved;
  const progress = rank.next ? ((approved - floor) / Math.max(1, ceiling - floor)) * 100 : 100;

  const stats = [
    { label: "Templates", value: downloads, href: "/account/downloads", icon: Download },
    { label: "Orders", value: orders.length, href: "/account/orders", icon: Package },
    { label: "Store credit", value: formatMoney(profile.storeCreditCents), href: "/account/referrals", icon: Coins },
    { label: "Referrals", value: referrals, href: "/account/referrals", icon: Users },
  ];

  return (
    <div className="space-y-8">
      <PageTitle eyebrow={`Enlisted ${formatDate(profile.createdAt)}`} title={`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`} />

      <section className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border-2 border-ink bg-dossier p-5 shadow-stamp">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Current rank</p>
          <div className="mt-3 flex items-center gap-4">
            <RankBadge rank={rank.name} size="lg" showLabel={false} />
            <div className="flex-1">
              <p className="font-stencil text-2xl">{rank.name}</p>
              <p className="text-sm text-muted-foreground">
                {approved} approved build{approved === 1 ? "" : "s"}
                {rank.next ? ` · ${rank.next.needed} more to ${rank.next.name}` : " · Highest rank achieved 🎖️"}
              </p>
              {rank.next && <Progress value={progress} className="mt-2 h-2" aria-label="Progress to next rank" />}
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/recruits/new">Post a build</Link>
          </Button>
        </div>
        <div className="rounded-xl border-2 border-ink bg-olive-camo p-5 text-paper shadow-stamp">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#e7d27c]">The Barracks</p>
          {membership ? (
            <>
              <p className="mt-2 font-stencil text-2xl">{tierConfig(membership.tier).name}</p>
              <p className="text-sm text-paper/80">
                {membership.cancelAtPeriodEnd ? "Ends" : "Renews"} {formatDate(membership.currentPeriodEnd)}
              </p>
              <Button asChild variant="kraft" className="mt-4">
                <Link href="/account/membership">Manage membership</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 font-stencil text-2xl">Not enlisted</p>
              <p className="text-sm text-paper/80">Monthly exclusive templates, early access, shop discounts, and a vote on the next build.</p>
              <Button asChild variant="kraft" className="mt-4">
                <Link href="/barracks">Join The Barracks</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-lg border-2 border-ink/80 bg-paper p-4 transition hover:-translate-y-0.5 hover:shadow-stamp-sm">
            <s.icon className="size-5 text-olive" aria-hidden="true" />
            <p className="mt-2 font-stencil text-2xl">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-stencil text-xl">Recent orders</h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
            All orders <ArrowRight className="size-4" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet. <Link href="/fleet" className="font-semibold underline">Browse the Fleet</Link>.</p>
        ) : (
          <ul className="divide-y-2 divide-dashed divide-ink/20 rounded-lg border-2 border-ink/80 bg-paper">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/60">
                  <div className="min-w-0">
                    <p className="font-semibold">Order #{o.number}</p>
                    <p className="truncate text-sm text-muted-foreground">{o.items.map((i) => i.name).join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(o.totalCents)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
