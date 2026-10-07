import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership } from "@/lib/access";
import { rankFor } from "@/lib/ranks";
import { publicUrl } from "@/lib/media";
import { siteUrl } from "@/lib/site-url";
import { formatDate } from "@/lib/format";
import { FileTag, Stamp } from "@/components/brand/stamp";
import { RankBadge } from "@/components/brand/rank-badge";
import { LikeButton } from "@/components/recruits/like-button";
import { ShareButton } from "@/components/site/share-button";
import { GalleryTile } from "@/components/recruits/gallery-tile";
import { Button } from "@/components/ui/button";

async function getPost(id: string) {
  return db.galleryPost.findFirst({ where: { id, status: "APPROVED" }, include: { template: { select: { slug: true, name: true } }, user: { select: { id: true, name: true, handle: true } } } });
}

export async function generateMetadata({ params }: PageProps<"/recruits/[id]">): Promise<Metadata> {
  const p = await getPost((await params).id);
  if (!p) return {};
  const title = `${p.catName} reporting for duty${p.template ? ` in the ${p.template.name}` : ""}`;
  return { title, description: p.caption ?? "A cardboard build from the Recruits gallery.", openGraph: { title, description: p.caption ?? undefined } };
}

export default async function RecruitPostPage({ params }: PageProps<"/recruits/[id]">) {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) notFound();
  const viewer = await getSessionUser();
  const [liked, approved, member, more] = await Promise.all([
    viewer ? db.like.findUnique({ where: { postId_userId: { postId: p.id, userId: viewer.id } } }) : null,
    db.galleryPost.count({ where: { userId: p.userId, status: "APPROVED" } }),
    getActiveMembership(p.userId),
    db.galleryPost.findMany({ where: { status: "APPROVED", id: { not: p.id }, ...(p.templateId ? { templateId: p.templateId } : {}) }, orderBy: { likesCount: "desc" }, take: 4, include: { template: { select: { name: true } } } }),
  ]);
  const rank = rankFor(approved);
  const shareTitle = `${p.catName} in the ${p.template?.name ?? "motor pool"}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/recruits" className="text-sm text-muted-foreground hover:underline">← All recruits</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative">
          <div className="relative overflow-hidden rounded-xl border-2 border-ink bg-paper p-2 shadow-stamp" style={{ rotate: "-0.6deg" }}>
            <div className="relative" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
              <Image src={publicUrl(p.imageKey)} alt={`${p.catName} in a ${p.template?.name ?? "cardboard"} build`} fill priority sizes="(max-width: 768px) 100vw, 560px" className="object-cover" />
            </div>
          </div>
          {p.featuredAt && <Stamp className="absolute -left-3 -top-3 bg-[#e7d27c]" color="ink" rotate={-10}>★ Recruit of the week</Stamp>}
        </div>
        <div className="space-y-5">
          <div>
            <FileTag>Field report · {formatDate(p.createdAt)}</FileTag>
            <h1 className="font-stencil text-4xl text-olive-dark">{p.catName}</h1>
            {p.template && (
              <p className="mt-1">
                Deployed in the <Link href={`/fleet/${p.template.slug}`} className="font-semibold underline">{p.template.name}</Link>
              </p>
            )}
          </div>
          {p.caption && <p className="rounded-lg border-2 border-dashed border-ink/40 bg-paper p-4 text-lg">&ldquo;{p.caption}&rdquo;</p>}
          <div className="flex flex-wrap gap-3">
            <LikeButton postId={p.id} initialLiked={Boolean(liked)} initialCount={p.likesCount} />
            <ShareButton url={siteUrl(`/recruits/${p.id}`)} title={shareTitle} text="Look at this cardboard war machine 🐈‍⬛" />
          </div>
          <div className="flex items-center gap-3 rounded-lg border-2 border-ink/70 bg-paper p-3">
            <RankBadge rank={rank.name} showLabel={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {p.user.handle ? <Link href={`/recruits/u/${p.user.handle}`} className="hover:underline">@{p.user.handle}</Link> : (p.user.name ?? "Recruit")}
                {member && <span className="ml-2 rounded bg-[#e7d27c] px-1.5 text-xs font-bold">Barracks</span>}
              </p>
              <p className="text-sm text-muted-foreground">{rank.name} · {approved} approved build{approved === 1 ? "" : "s"}</p>
            </div>
          </div>
          {p.template && (
            <Button asChild size="lg" className="w-full">
              <Link href={`/fleet/${p.template.slug}`}>Build this for your cat</Link>
            </Button>
          )}
        </div>
      </div>
      {more.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-stencil text-2xl text-olive-dark">More recruits{p.template ? ` in the ${p.template.name}` : ""}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {more.map((x) => (
              <GalleryTile key={x.id} post={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
