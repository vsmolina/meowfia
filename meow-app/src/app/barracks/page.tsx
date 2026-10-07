import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Percent, Sparkles, Vote } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership } from "@/lib/access";
import { SectionHeading } from "@/components/brand/stamp";
import { TierPicker } from "@/components/barracks/tier-picker";
import { ManageBillingButton } from "@/components/barracks/manage-billing-button";

export const metadata: Metadata = {
  title: `${siteConfig.membership.name}: membership`,
  description: "Monthly members-only templates, early access to drops, shop discounts, and a vote on the next build.",
  alternates: { canonical: "/barracks" },
};

const FAQ = [
  ["Can I cancel anytime?", "Yes. Cancel from your account in two taps. You keep your perks until the end of the period you've paid for."],
  ["Do I keep the templates if I cancel?", "Members-only templates you've downloaded are yours to build. Access to the files in your armory continues while you're a member, and anything you bought separately is yours forever."],
  ["How does voting work?", "Each month there's a poll for the next build. Officers' votes count double and Commanders' triple."],
  ["Is it a good gift?", "Absolutely. Grab a gift card and they can enlist themselves."],
];

export default async function BarracksPage() {
  const user = await getSessionUser();
  const m = await getActiveMembership(user?.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" align="center" eyebrow="Membership" title={siteConfig.membership.name} description="Support the motor pool every month and get the good stuff first." />
      <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Sparkles, t: "Monthly exclusive", d: "A members-only template every month" },
          { icon: CalendarClock, t: "Early access", d: "New drops 48 hours before everyone" },
          { icon: Vote, t: "Vote", d: "Decide what gets built next" },
          { icon: Percent, t: "Shop discount", d: "Up to 15% off kits & merch" },
        ].map((x) => (
          <li key={x.t} className="rounded-xl border-2 border-ink/70 bg-paper p-4 text-center">
            <x.icon className="mx-auto size-7 text-olive" aria-hidden="true" />
            <p className="mt-2 font-stencil">{x.t}</p>
            <p className="text-sm text-muted-foreground">{x.d}</p>
          </li>
        ))}
      </ul>
      <section className="mt-14" aria-label="Membership tiers">
        {m ? (
          <div className="mx-auto mb-8 flex max-w-xl flex-col items-center gap-3 rounded-xl border-2 border-olive bg-olive/10 p-5 text-center">
            <p className="font-semibold">You&apos;re enlisted. Thank you! Switch plans or manage billing anytime.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <ManageBillingButton />
              <Link href="/barracks/vote" className="inline-flex h-10 items-center rounded-md border-2 border-ink px-4 font-semibold">Go vote</Link>
            </div>
          </div>
        ) : null}
        <TierPicker tiers={siteConfig.membership.tiers} currentTier={m?.tier ?? null} />
        {!user && <p className="mt-4 text-center text-sm text-muted-foreground">You&apos;ll sign in (no password) before checkout.</p>}
      </section>
      <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="faq-h">
        <h2 id="faq-h" className="mb-4 font-stencil text-2xl text-olive-dark">Briefing Q&amp;A</h2>
        <dl className="space-y-3">
          {FAQ.map(([q, a]) => (
            <div key={q} className="rounded-lg border-2 border-ink/60 bg-paper p-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
