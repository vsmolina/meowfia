import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/brand/stamp";
import { VideoCard } from "@/components/videos/video-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Videos", description: "Every cardboard tank, plane, and warship build from TikTok, organized by series.", alternates: { canonical: "/videos" } };

export default async function VideosPage({ searchParams }: PageProps<"/videos">) {
  const sp = await searchParams;
  const series = typeof sp.series === "string" ? sp.series : null;
  const videos = await db.video.findMany({ orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }], include: { template: { select: { slug: true, name: true } } } });
  const allSeries = [...new Set(videos.map((v) => v.series))];
  const groups = (series ? [series] : allSeries).map((s) => ({ s, items: videos.filter((v) => v.series === s) })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading as="h1" eyebrow="Recon footage" title="Videos" description="Tap any video to play. Most link straight to the template so your cat can be next." />
        <Button asChild variant="outline">
          <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer">Follow @{siteConfig.social.tiktokHandle}</a>
        </Button>
      </div>
      <nav aria-label="Series" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {[null, ...allSeries].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/videos?series=${encodeURIComponent(s)}` : "/videos"}
            aria-current={series === s ? "page" : undefined}
            className={cn("shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold", series === s ? "bg-olive text-paper" : "bg-paper hover:bg-muted")}
          >
            {s ?? "All series"}
          </Link>
        ))}
      </nav>
      <div className="mt-8 space-y-12">
        {groups.map((g) => (
          <section key={g.s} aria-labelledby={`s-${g.s}`}>
            <h2 id={`s-${g.s}`} className="mb-4 font-stencil text-2xl text-olive-dark">{g.s}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {g.items.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
