import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/media";
import { FileTag, Stamp } from "@/components/brand/stamp";
import { RankBadge } from "@/components/brand/rank-badge";
import { VideoCard } from "@/components/videos/video-card";

export async function generateMetadata({ params }: PageProps<"/crew/[slug]">): Promise<Metadata> {
  const cat = await db.cat.findUnique({ where: { slug: (await params).slug } });
  return cat ? { title: `${cat.rank} ${cat.name}`, description: cat.personality, alternates: { canonical: `/crew/${cat.slug}` } } : {};
}

export default async function CatPage({ params }: PageProps<"/crew/[slug]">) {
  const { slug } = await params;
  const cat = await db.cat.findUnique({ where: { slug }, include: { videos: { orderBy: { publishedAt: "desc" }, include: { template: { select: { slug: true, name: true } } } } } });
  if (!cat) notFound();
  const fields: [string, string][] = [
    ["Rank", cat.rank],
    ["Callsign", cat.callsign ?? "Classified"],
    ["Favorite vehicle", cat.favoriteVehicle],
    ["Missions on file", String(cat.videos.length)],
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/crew" className="text-sm text-muted-foreground hover:underline">← All personnel</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-[360px_1fr]">
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-ink shadow-stamp">
            <Image src={publicUrl(cat.imageKey)} alt={`${cat.rank} ${cat.name}`} fill sizes="360px" className="object-cover" priority />
          </div>
          <Stamp className="absolute -bottom-3 right-4 bg-paper" rotate={-8}>Good kitty</Stamp>
        </div>
        <div className="rounded-xl border-2 border-ink bg-dossier p-6 shadow-stamp">
          <FileTag>Personnel file</FileTag>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-stencil text-4xl text-olive-dark">{cat.name}</h1>
            <RankBadge rank={cat.rank} />
          </div>
          <dl className="mt-4 grid gap-2 font-mono text-sm sm:grid-cols-2">
            {fields.map(([k, v]) => (
              <div key={k} className="border-b border-dashed border-ink/25 pb-1">
                <dt className="text-[0.7rem] uppercase tracking-widest text-muted-foreground">{k}</dt>
                <dd className="font-sans font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-6 font-stencil text-xl">Personality assessment</h2>
          <p className="mt-1">{cat.personality}</p>
          <h2 className="mt-5 font-stencil text-xl">Service history</h2>
          <p className="mt-1 leading-relaxed">{cat.bio}</p>
        </div>
      </div>
      {cat.videos.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-stencil text-2xl text-olive-dark">{cat.name}&apos;s missions</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cat.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
