"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight TikTok embed: shows a poster (oEmbed thumbnail when available,
 * otherwise a styled card) and only loads TikTok's player iframe on tap.
 * This keeps third-party JS off the page until the visitor asks for it.
 */
export function TikTokEmbed({
  videoId,
  url,
  title,
  thumbnailUrl,
  className,
  autoLoad = false,
  priority = false,
}: {
  videoId: string | null;
  url: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  className?: string;
  autoLoad?: boolean;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(autoLoad);
  const label = title || "Watch on TikTok";

  return (
    <div className={cn("relative aspect-[9/16] w-full overflow-hidden rounded-lg bg-ink shadow-stamp", className)}>
      {loaded && videoId ? (
        <iframe
          src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1&music_info=0&description=0&rel=0`}
          title={label}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => (videoId ? setLoaded(true) : window.open(url, "_blank", "noopener"))}
          className="group absolute inset-0 flex flex-col items-center justify-center text-paper"
          aria-label={`Play video: ${label}`}
        >
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 360px"
              className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 bg-olive-camo" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/20" />
          <span className="relative grid size-16 place-items-center rounded-full bg-paper/95 text-olive-dark shadow-stamp transition group-hover:scale-110">
            <Play className="ml-1 size-7 fill-current" />
          </span>
          <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-4 text-left text-sm font-medium">{label}</span>
          <span className="absolute left-3 top-3 rounded bg-ink/70 px-2 py-0.5 font-mono text-[0.65rem] tracking-widest">TIKTOK</span>
        </button>
      )}
    </div>
  );
}
