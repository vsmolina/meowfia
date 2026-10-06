import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { siteUrl } from "@/lib/site-url";
import { formatDate, formatMoney } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { PageTitle } from "@/components/account/page-title";
import { CopyField } from "@/components/site/copy-field";
import { StatusBadge } from "@/components/site/status-badge";

export const metadata: Metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const user = await requireUser("/account/referrals");
  const [profile, clicks, conversions, signups] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { referralCode: true, storeCreditCents: true } }),
    db.referralClick.count({ where: { referrerId: user.id } }),
    db.referralConversion.findMany({ where: { referrerId: user.id }, orderBy: { createdAt: "desc" } }),
    db.user.count({ where: { referredById: user.id } }),
  ]);
  const link = siteUrl(`/r/${profile.referralCode}`);
  const earned = conversions.filter((c) => c.status !== "VOID").reduce((a, c) => a + c.rewardCents, 0);
  const { rewardPercent, newCustomerCouponCode } = siteConfig.commerce.referral;

  const stats = [
    { label: "Link clicks", value: clicks },
    { label: "Sign-ups", value: signups },
    { label: "Orders", value: conversions.length },
    { label: "Credit earned", value: formatMoney(earned) },
  ];

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Recruitment office" title="Referral program" />
      <div className="rounded-xl border-2 border-ink bg-olive-camo p-5 text-paper shadow-stamp">
        <p className="font-stencil text-xl">Recruit a friend, earn {rewardPercent}% in store credit</p>
        <p className="mt-1 text-sm text-paper/85">
          Share your link. Friends get {newCustomerCouponCode === "RECRUIT10" ? "10% off" : "a discount"} with code <b>{newCustomerCouponCode}</b>, and you earn {rewardPercent}% of every order they place in the first {siteConfig.commerce.referral.cookieDays} days as store credit. Credit applies automatically at checkout.
        </p>
        <CopyField value={link} className="mt-4" label="Your referral link" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border-2 border-ink/80 bg-paper p-4">
            <p className="font-stencil text-2xl">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border-2 border-ink/80 bg-paper p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-stencil text-lg">Store credit balance</h2>
          <p className="font-stencil text-2xl text-olive">{formatMoney(profile.storeCreditCents)}</p>
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-stencil text-lg">Referred orders</h2>
        {conversions.length === 0 ? (
          <p className="text-muted-foreground">No referred orders yet. Share your link in your bio, a group chat, or under a build video!</p>
        ) : (
          <ul className="divide-y divide-dashed divide-ink/20 rounded-lg border-2 border-ink/80 bg-paper">
            {conversions.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span>{c.referredEmail.replace(/^(.).*(@.*)$/, "$1•••$2")}</span>
                <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>
                <StatusBadge status={c.status} />
                <span className="font-semibold">+{formatMoney(c.rewardCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
