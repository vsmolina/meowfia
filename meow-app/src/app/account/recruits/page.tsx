import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { publicUrl } from "@/lib/media";
import { rankFor } from "@/lib/ranks";
import { PageTitle, EmptyState } from "@/components/account/page-title";
import { RankBadge } from "@/components/brand/rank-badge";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Recruits" };

export default async function MyRecruitsPage() {
  const user = await requireUser("/account/recruits");
  const posts = await db.galleryPost.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { template: { select: { name: true } } } });
  const approved = posts.filter((p) => p.status === "APPROVED").length;
  const rank = rankFor(approved);

  return (
    <div>
      <PageTitle eyebrow="Service record" title="My Recruits">
        <Button asChild>
          <Link href="/recruits/new"><Plus /> Post a build</Link>
        </Button>
      </PageTitle>
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border-2 border-ink/80 bg-paper p-4">
        <RankBadge rank={rank.name} size="lg" />
        <p className="text-sm text-muted-foreground">
          {approved} approved build{approved === 1 ? "" : "s"}. {rank.next ? `${rank.next.needed} more to make ${rank.next.name}.` : "You've reached General. Salute!"}
          {user.handle && (
            <>
              {" "}
              <Link className="font-semibold underline" href={`/recruits/u/${user.handle}`}>View public profile</Link>
            </>
          )}
        </p>
      </div>
      {posts.length === 0 ? (
        <EmptyState title="No builds posted yet" action={<Button asChild><Link href="/recruits/new">Post your first build</Link></Button>}>
          Share a photo of your cat in their vehicle. Every approved build counts toward your rank.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {posts.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-lg border-2 border-ink/80 bg-paper">
              <Link href={p.status === "APPROVED" ? `/recruits/${p.id}` : "#"} className="block">
                <div className="relative aspect-[4/5]">
                  <Image src={publicUrl(p.imageKey)} alt={`${p.catName} in a cardboard build`} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
                </div>
                <div className="space-y-1 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{p.catName}</p>
                    <StatusBadge status={p.status} label={p.status === "PENDING" ? "In review" : undefined} />
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="size-3" /> {p.likesCount} · {p.template?.name ?? "Custom build"}
                  </p>
                  {p.status === "REJECTED" && p.rejectReason && <p className="text-xs text-stamp">{p.rejectReason}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
