import type { Metadata } from "next";
import Link from "next/link";
import { Camera } from "lucide-react";
import { db, type Prisma } from "@/lib/db";
import { rankFor } from "@/lib/ranks";
import { SectionHeading, FileTag } from "@/components/brand/stamp";
import { RankBadge } from "@/components/brand/rank-badge";
import { GalleryTile } from "@/components/recruits/gallery-tile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Recruits: community builds", description: "Cats in cardboard tanks, planes, and warships, built by the community. Post yours and earn rank.", alternates: { canonical: "/recruits" } };

const PER_PAGE = 24;

export default async function RecruitsPage({ searchParams }: PageProps<"/recruits">) {
  const sp = await searchParams;
  const templateSlug = typeof sp.template === "string" ? sp.template : null;
  const sort = sp.sort === "top" ? "top" : "new";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.GalleryPostWhereInput = { status: "APPROVED", ...(templateSlug ? { template: { slug: templateSlug } } : {}) };

  const [posts, total, featured, templates, leaders] = await Promise.all([
    db.galleryPost.findMany({ where, orderBy: sort === "top" ? [{ likesCount: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, include: { template: { select: { name: true } } } }),
    db.galleryPost.count({ where }),
    db.galleryPost.findFirst({ where: { status: "APPROVED", featuredAt: { not: null } }, orderBy: { featuredAt: "desc" }, include: { template: { select: { name: true, slug: true } }, user: { select: { name: true, handle: true } } } }),
    db.template.findMany({ where: { galleryPosts: { some: { status: "APPROVED" } } }, select: { slug: true, name: true }, orderBy: { name: "asc" } }),
    db.galleryPost.groupBy({ by: ["userId"], where: { status: "APPROVED" }, _count: { _all: true }, orderBy: { _count: { userId: "desc" } }, take: 5 }),
  ]);
  const leaderUsers = await db.user.findMany({ where: { id: { in: leaders.map((l) => l.userId) } }, select: { id: true, name: true, handle: true } });
  const pages = Math.ceil(total / PER_PAGE);
  const qs = (o: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const merged = { template: templateSlug, sort: sort === "top" ? "top" : null, ...o };
    Object.entries(merged).forEach(([k, v]) => v !== null && v !== "" && p.set(k, String(v)));
    const s = p.toString();
    return s ? `/recruits?${s}` : "/recruits";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading as="h1" eyebrow="Field reports from the community" title="Recruits" description="Every approved build earns your cat rank, from Private all the way to General." />
        <Button asChild size="lg" variant="stamp">
          <Link href="/recruits/new"><Camera /> Post your build</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {["new", "top"].map((s) => (
              <Link key={s} href={qs({ sort: s === "top" ? "top" : null, page: null })} aria-current={sort === s ? "page" : undefined} className={cn("rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold", sort === s ? "bg-olive text-paper" : "bg-paper")}>
                {s === "new" ? "Newest" : "Most saluted"}
              </Link>
            ))}
            <form action="/recruits" className="ml-auto">
              {sort === "top" && <input type="hidden" name="sort" value="top" />}
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only">Filter by template</span>
                <select name="template" defaultValue={templateSlug ?? ""} className="h-10 rounded-md border-2 border-ink bg-paper px-2 font-semibold">
                  <option value="">All vehicles</option>
                  {templates.map((t) => (
                    <option key={t.slug} value={t.slug}>{t.name}</option>
                  ))}
                </select>
                <Button type="submit" variant="outline" size="sm">Filter</Button>
              </label>
            </form>
          </div>
          <div className="columns-2 gap-4 sm:columns-3 xl:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
            {posts.map((p, i) => (
              <GalleryTile key={p.id} post={p} priority={i < 4} />
            ))}
          </div>
          {posts.length === 0 && <p className="text-muted-foreground">No recruits here yet. Be the first!</p>}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && <Button asChild variant="outline"><Link href={qs({ page: page - 1 })}>← Newer</Link></Button>}
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              {page < pages && <Button asChild variant="outline"><Link href={qs({ page: page + 1 })}>Older →</Link></Button>}
            </nav>
          )}
        </div>

        <aside className="space-y-6">
          {featured && (
            <div className="rounded-xl border-2 border-ink bg-[#e7d27c] p-4 shadow-stamp">
              <FileTag className="text-ink/70">Commendation</FileTag>
              <p className="font-stencil text-xl">Recruit of the Week</p>
              <GalleryTile post={featured} className="mt-3" sizes="300px" />
            </div>
          )}
          <div className="rounded-xl border-2 border-ink bg-paper p-4 shadow-stamp-sm">
            <p className="font-stencil text-xl">Top brass</p>
            <ol className="mt-3 space-y-2">
              {leaders.map((l, i) => {
                const u = leaderUsers.find((x) => x.id === l.userId);
                const rank = rankFor(l._count._all);
                return (
                  <li key={l.userId} className="flex items-center gap-3">
                    <span className="w-4 font-mono text-sm text-muted-foreground">{i + 1}</span>
                    <RankBadge rank={rank.name} size="sm" showLabel={false} />
                    {u?.handle ? (
                      <Link href={`/recruits/u/${u.handle}`} className="flex-1 truncate font-semibold hover:underline">@{u.handle}</Link>
                    ) : (
                      <span className="flex-1 truncate font-semibold">{u?.name ?? "Recruit"}</span>
                    )}
                    <span className="text-sm text-muted-foreground">{l._count._all}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
