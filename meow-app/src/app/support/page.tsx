import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, HeartHandshake } from "lucide-react";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/auth-helpers";
import { formatDate, formatMoney } from "@/lib/format";
import { SectionHeading, FileTag } from "@/components/brand/stamp";
import { TipForm } from "@/components/site/tip-form";

export const metadata: Metadata = { title: "Support the Mission", description: `Tip ${siteConfig.creator.firstName} and the crew to keep the cardboard coming.`, alternates: { canonical: "/support" } };

export default async function SupportPage() {
  const [user, wall, totals] = await Promise.all([
    getSessionUser(),
    db.tip.findMany({ where: { paid: true, showOnWall: true }, orderBy: { paidAt: "desc" }, take: 30 }),
    db.tip.aggregate({ where: { paid: true }, _count: { _all: true } }),
  ]);
  const { kofi, patreon } = siteConfig.social;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="War bonds" title="Support the Mission" description="Every tip buys tape, glue, cardboard, and the occasional bribe treat. It's how free templates and videos keep happening." />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp">
          <FileTag>One-time tip</FileTag>
          <h2 className="mt-1 mb-5 font-stencil text-2xl text-olive-dark">Buy the crew a box</h2>
          <TipForm presets={siteConfig.commerce.tipPresetsCents} defaultEmail={user?.email} />
        </section>
        <aside className="space-y-4">
          {(kofi || patreon) && (
            <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-stamp-sm">
              <h2 className="font-stencil text-xl">Other ways to support</h2>
              <ul className="mt-3 space-y-2">
                {kofi && (
                  <li>
                    <a href={kofi} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border-2 border-ink/50 px-3 py-2 font-semibold hover:bg-muted">
                      <Coffee className="size-5" /> Ko-fi
                    </a>
                  </li>
                )}
                {patreon && (
                  <li>
                    <a href={patreon} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border-2 border-ink/50 px-3 py-2 font-semibold hover:bg-muted">
                      <HeartHandshake className="size-5" /> Patreon
                    </a>
                  </li>
                )}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">Want perks too? <Link href="/barracks" className="font-semibold underline">{siteConfig.membership.name}</Link> includes monthly templates.</p>
            </div>
          )}
          <div className="rounded-2xl border-2 border-ink bg-olive-camo p-5 text-paper shadow-stamp-sm">
            <p className="font-stencil text-3xl text-[#e7d27c]">{totals._count._all}</p>
            <p className="text-sm text-paper/80">supporters have sent tips. Thank you!</p>
          </div>
        </aside>
      </div>

      <section id="wall" aria-labelledby="wall-h" className="mt-14 scroll-mt-24">
        <h2 id="wall-h" className="mb-5 font-stencil text-2xl text-olive-dark">Supporters Wall</h2>
        {wall.length === 0 ? (
          <p className="text-muted-foreground">Be the first name on the wall!</p>
        ) : (
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {wall.map((t, i) => (
              <li key={t.id} className="mb-4 break-inside-avoid rounded-lg border-2 border-ink/70 bg-paper p-4" style={{ rotate: `${((i % 5) - 2) * 0.4}deg` }}>
                <p className="flex items-center justify-between gap-2">
                  <span className="font-stencil">{t.name ?? "Anonymous recruit"}</span>
                  <span className="rounded bg-[#e7d27c] px-2 text-sm font-bold">{formatMoney(t.amountCents)}</span>
                </p>
                {t.message && <p className="mt-1 text-sm">&ldquo;{t.message}&rdquo;</p>}
                {t.paidAt && <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{formatDate(t.paidAt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
