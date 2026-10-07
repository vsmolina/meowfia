import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveMembership, tierConfig } from "@/lib/access";
import { rankFor } from "@/lib/ranks";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/format";
import { FileTag, Stamp } from "@/components/brand/stamp";
import { RankBadge } from "@/components/brand/rank-badge";
import { GalleryTile } from "@/components/recruits/gallery-tile";
import { Progress } from "@/components/ui/progress";

export async function generateMetadata({ params }: PageProps<"/recruits/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle}: recruit profile` };
}

export default async function ProfilePage({ params }: PageProps<"/recruits/u/[handle]">) {
  const { handle } = await params;
  const user = await db.user.findUnique({ where: { handle: handle.toLowerCase() }, select: { id: true, name: true, handle: true, bio: true, createdAt: true } });
  if (!user) notFound();
  const [posts, m] = await Promise.all([
    db.galleryPost.findMany({ where: { userId: user.id, status: "APPROVED" }, orderBy: { createdAt: "desc" }, include: { template: { select: { name: true } } } }),
    getActiveMembership(user.id),
  ]);
  const rank = rankFor(posts.length);
  const floor = siteConfig.ranks[rank.index].min;
  const ceiling = rank.next ? posts.length + rank.next.needed : posts.length;
  const likes = posts.reduce((a, p) => a + p.likesCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="relative grid gap-6 rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp sm:grid-cols-[auto_1fr] sm:items-center">
        <RankBadge rank={rank.name} size="lg" showLabel={false} className="[&>span]:size-24 [&>span]:p-4" />
        <div>
          <FileTag>Service record · enlisted {formatDate(user.createdAt)}</FileTag>
          <h1 className="font-stencil text-4xl text-olive-dark">@{user.handle}</h1>
          <p className="font-semibold">
            {rank.name}
            {m && <span className="ml-2 rounded bg-[#e7d27c] px-2 py-0.5 text-sm">{siteConfig.membership.name} · {tierConfig(m.tier).name}</span>}
          </p>
          {user.bio && <p className="mt-2 text-muted-foreground">{user.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <span><b className="font-stencil text-xl">{posts.length}</b> builds</span>
            <span><b className="font-stencil text-xl">{likes}</b> salutes</span>
          </div>
          {rank.next && (
            <div className="mt-3 max-w-sm">
              <Progress value={((posts.length - floor) / Math.max(1, ceiling - floor)) * 100} className="h-2" aria-label="Progress to next rank" />
              <p className="mt-1 text-xs text-muted-foreground">{rank.next.needed} more approved build{rank.next.needed === 1 ? "" : "s"} to {rank.next.name}</p>
            </div>
          )}
        </div>
        {rank.name === "General" && <Stamp className="absolute right-4 top-4" rotate={8}>Top brass</Stamp>}
      </section>
      <h2 className="mt-12 mb-5 font-stencil text-2xl text-olive-dark">Deployments</h2>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No approved builds yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((p) => (
            <GalleryTile key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
