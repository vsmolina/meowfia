"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Swipeable on phones (scroll-snap), thumbnail strip on larger screens */
export function ImageGallery({ images, alt, aspect = "4/3" }: { images: string[]; alt: string; aspect?: string }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const go = (i: number) => {
    setActive(i);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border-2 border-ink bg-kraft shadow-stamp">
        <div
          ref={track}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
          aria-roledescription="carousel"
        >
          {images.map((src, i) => (
            <div key={src} className="relative w-full shrink-0 snap-center" style={{ aspectRatio: aspect }} aria-roledescription="slide" aria-label={`${i + 1} of ${images.length}`}>
              <Image src={src} alt={i === 0 ? alt : `${alt}, photo ${i + 1}`} fill sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" priority={i === 0} />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full bg-paper/70 transition-all", i === active ? "w-5 bg-paper" : "w-1.5")} />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="hidden grid-cols-5 gap-2 sm:grid">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={cn("relative aspect-[4/3] overflow-hidden rounded-md border-2 transition", i === active ? "border-ink shadow-stamp-sm" : "border-ink/20 opacity-70 hover:opacity-100")}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
