import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { publicUrl } from "@/lib/media";
import { formatCompact } from "@/lib/format";
import { SectionHeading, FileTag, Stamp } from "@/components/brand/stamp";
import { RankBadge } from "@/components/brand/rank-badge";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = { title: "Meet the Crew", description: `Meet ${siteConfig.creator.name} and the feline crew of ${siteConfig.name}.`, alternates: { canonical: "/crew" } };

export default async function CrewPage() {
  const cats = await db.cat.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { videos: true } } } });
  const c = siteConfig.creator;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Personnel files" title="Meet the Crew" description="The humans and cats behind every cardboard war machine." />

      <section className="mt-10 grid gap-8 rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp md:grid-cols-[280px_1fr] md:p-8">
        <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-ink">
          <Image src={publicUrl(c.imageKey)} alt={`${c.name}, ${c.title}`} fill sizes="280px" className="object-cover" priority />
        </div>
        <div>
          <FileTag>Commanding officer</FileTag>
          <h2 className="font-stencil text-3xl text-olive-dark">{c.name}</h2>
          <p className="font-semibold text-muted-foreground">{c.title} · {c.location}</p>
          <p className="mt-4 text-lg leading-relaxed">{c.bio}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded border-2 border-ink/60 px-3 py-1 font-semibold">{formatCompact(siteConfig.stats.tiktokFollowers)} TikTok followers</span>
            <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer" className="rounded border-2 border-ink bg-ink px-3 py-1 font-semibold text-paper">
              @{siteConfig.social.tiktokHandle}
            </a>
          </div>
        </div>
      </section>

      <h2 className="mt-16 font-stencil text-3xl text-olive-dark">The feline unit</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {cats.map((cat, i) => (
          <Reveal key={cat.id} delay={i * 0.05}>
            <Link href={`/crew/${cat.slug}`} className="group relative flex gap-4 overflow-hidden rounded-xl border-2 border-ink bg-paper p-4 shadow-stamp transition hover:-translate-y-1">
              <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border-2 border-ink sm:size-36">
                <Image src={publicUrl(cat.imageKey)} alt={`${cat.rank} ${cat.name}`} fill sizes="144px" className="object-cover transition group-hover:scale-105" />
              </div>
              <div className="min-w-0">
                <RankBadge rank={cat.rank} size="sm" />
                <h3 className="mt-1 font-stencil text-2xl">{cat.name}</h3>
                {cat.callsign && <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Callsign: {cat.callsign}</p>}
                <p className="mt-2 line-clamp-3 text-sm">{cat.personality}</p>
              </div>
              <Stamp className="absolute -right-2 bottom-3 hidden sm:inline-block" size="sm" color="olive" rotate={-12}>
                {cat._count.videos} missions
              </Stamp>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
