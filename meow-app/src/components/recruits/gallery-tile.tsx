import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { publicUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type GalleryTileData = {
  id: string;
  catName: string;
  imageKey: string;
  width: number;
  height: number;
  likesCount: number;
  featuredAt?: Date | null;
  template?: { name: string } | null;
  user?: { name: string | null; handle: string | null } | null;
};

export function GalleryTile({ post, className, sizes = "(max-width: 640px) 50vw, 25vw", priority }: { post: GalleryTileData; className?: string; sizes?: string; priority?: boolean }) {
  const rotate = (post.id.charCodeAt(post.id.length - 1) % 5) - 2;
  return (
    <Link
      href={`/recruits/${post.id}`}
      className={cn("group block rounded-sm border-2 border-ink bg-paper p-1.5 pb-2 shadow-stamp-sm transition hover:z-10 hover:-translate-y-1 hover:rotate-0", className)}
      style={{ rotate: `${rotate * 0.5}deg` }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: `${post.width} / ${post.height}` }}>
        <Image src={publicUrl(post.imageKey)} alt={`${post.catName} in a ${post.template?.name ?? "cardboard"} build`} fill sizes={sizes} className="object-cover transition duration-500 group-hover:scale-105" priority={priority} />
        {post.featuredAt && (
          <span className="absolute left-1.5 top-1.5 rounded bg-[#e7d27c] px-1.5 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-ink">★ Recruit of the week</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-0.5 pt-1.5">
        <p className="truncate font-stencil text-sm">{post.catName}</p>
        <p className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Heart className="size-3" aria-hidden="true" />
          {post.likesCount}
        </p>
      </div>
      {post.template && <p className="truncate px-0.5 text-[0.7rem] text-muted-foreground">{post.template.name}</p>}
    </Link>
  );
}
