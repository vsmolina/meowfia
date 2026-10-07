import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/media";
import { SectionHeading } from "@/components/brand/stamp";

export const metadata: Metadata = { title: "Field Manual: build guides", description: "Step-by-step cardboard build guides, cardboard sourcing tips, and cat-safe glues and tapes.", alternates: { canonical: "/guides" } };

const CATEGORY_LABELS = { BUILD: "Build guides", SOURCING: "Sourcing", ADHESIVES: "Glues & tapes", TECHNIQUE: "Techniques" } as const;

export default async function GuidesPage() {
  const guides = await db.guide.findMany({ where: { published: true }, orderBy: [{ category: "asc" }, { createdAt: "asc" }], include: { _count: { select: { steps: true } } } });
  const cats = (Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map((c) => ({ c, items: guides.filter((g) => g.category === c) })).filter((x) => x.items.length);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="FM 3-21 · Cardboard operations" title="The Field Manual" description="Everything you need to build sturdy, safe, cat-approved vehicles. Free guides are open to all; premium guides unlock with a template purchase or membership." />
      <Link href="/cat-safety" className="mt-8 flex items-center gap-3 rounded-xl border-2 border-stamp bg-stamp/10 p-4 font-semibold transition hover:bg-stamp/15">
        <ShieldCheck className="size-8 shrink-0 text-stamp" aria-hidden="true" />
        <span>
          Read the Cat Safety briefing first
          <span className="block text-sm font-normal text-muted-foreground">No staples, safe adhesives, sizing, and supervision. Two minutes that matter.</span>
        </span>
      </Link>
      {cats.map(({ c, items }) => (
        <section key={c} className="mt-12">
          <h2 className="mb-4 font-stencil text-2xl text-olive-dark">{CATEGORY_LABELS[c]}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((g) => (
              <Link key={g.id} href={`/guides/${g.slug}`} className="group overflow-hidden rounded-xl border-2 border-ink bg-paper shadow-stamp transition hover:-translate-y-1">
                <div className="relative aspect-[16/9] border-b-2 border-ink">
                  <Image src={publicUrl(g.coverImageKey)} alt="" fill sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />
                  {g.premium && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-[#e7d27c] px-2 py-0.5 text-xs font-bold text-ink">
                      <Lock className="size-3" /> Premium
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-stencil text-lg leading-tight">{g.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.summary}</p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">{g._count.steps} steps</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
