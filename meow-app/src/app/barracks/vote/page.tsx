import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { SectionHeading, Stamp } from "@/components/brand/stamp";
import { Countdown } from "@/components/brand/countdown";
import { VoteForm } from "@/components/barracks/vote-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vote on the next build", robots: { index: false } };

export default async function VotePage() {
  const user = await getSessionUser();
  const m = await getActiveMembership(user?.id);
  const polls = (await db.poll.findMany({ where: { status: { in: ["OPEN", "CLOSED"] } }, orderBy: { createdAt: "desc" }, take: 6, include: { options: true, votes: true } })).sort(
    (a, b) => Number(b.status === "OPEN") - Number(a.status === "OPEN"),
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow={`${siteConfig.membership.name} · War room`} title="Vote on the next build" description="Members decide what rolls off the line next. Officers vote ×2, Commanders ×3." />
      {!m && (
        <div className="mt-8 rounded-xl border-2 border-ink bg-[#e7d27c]/40 p-5">
          <p className="font-semibold">Voting is a member perk.</p>
          <Button asChild className="mt-3"><Link href="/barracks">Join {siteConfig.membership.name}</Link></Button>
        </div>
      )}
      <div className="mt-8 space-y-8">
        {polls.map((p) => {
          const open = p.status === "OPEN" && (!p.closesAt || p.closesAt > new Date());
          const totals: Record<string, number> = {};
          for (const v of p.votes) totals[v.optionId] = (totals[v.optionId] ?? 0) + v.weight;
          const myVote = user ? (p.votes.find((v) => v.userId === user.id)?.optionId ?? null) : null;
          return (
            <section key={p.id} className="relative rounded-2xl border-2 border-ink bg-paper p-6 shadow-stamp">
              {!open && <Stamp className="absolute right-4 top-4" color="ink" size="sm">Closed</Stamp>}
              <h2 className="font-stencil text-2xl">{p.title}</h2>
              {p.description && <p className="mt-1 text-muted-foreground">{p.description}</p>}
              {open && p.closesAt && (
                <div className="mt-3 flex items-center gap-3 text-sm">
                  Closes in <Countdown to={p.closesAt.toISOString()} size="sm" />
                </div>
              )}
              {!open && p.closesAt && <p className="mt-1 text-sm text-muted-foreground">Closed {formatDate(p.closesAt)}</p>}
              <div className="mt-5">
                {open && m ? (
                  <VoteForm pollId={p.id} options={p.options} myVote={myVote} showResults={Boolean(myVote)} totals={totals} />
                ) : (
                  <ul className="space-y-2">
                    {p.options.map((o) => {
                      const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
                      const pct = m || !open ? Math.round(((totals[o.id] ?? 0) / sum) * 100) : null;
                      return (
                        <li key={o.id} className="relative overflow-hidden rounded-lg border-2 border-ink/25 p-3">
                          {pct !== null && <span className="absolute inset-y-0 left-0 bg-olive/15" style={{ width: `${pct}%` }} aria-hidden="true" />}
                          <span className="relative flex justify-between">
                            <span className="font-semibold">{o.label}</span>
                            {pct !== null && <span className="font-stencil">{pct}%</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
