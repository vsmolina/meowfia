import Image from "next/image";
import Link from "next/link";
import { Clock, Star, Users } from "lucide-react";
import type { TemplateCardData } from "@/lib/catalog";
import { publicUrl } from "@/lib/media";
import { formatBuildTime, formatMoney } from "@/lib/format";
import { CAT_SIZE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_LEVEL, VEHICLE_LABELS } from "@/lib/labels";
import { Stamp } from "@/components/brand/stamp";
import { FavoriteButton } from "@/components/fleet/favorite-button";
import { cn } from "@/lib/utils";

export function priceLabel(t: Pick<TemplateCardData, "pricingMode" | "priceCents" | "suggestedPriceCents">) {
  if (t.pricingMode === "FREE") return "Free";
  if (t.pricingMode === "PWYW") return `Pay what you want · from ${formatMoney(t.priceCents)}`;
  return formatMoney(t.priceCents);
}

export function DifficultyPips({ level, className }: { level: 1 | 2 | 3 | 4; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`Difficulty ${level} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={cn("h-2.5 w-1.5 -skew-x-12 rounded-[1px]", i <= level ? "bg-olive" : "bg-ink/15")} />
      ))}
    </span>
  );
}

export function TemplateCard({
  template: t,
  rating,
  favorited,
  priority = false,
  className,
}: {
  template: TemplateCardData;
  rating?: { avg: number; count: number };
  favorited?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const recruits = t._count.galleryPosts;
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-paper shadow-stamp transition duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0_0_var(--ink)]", className)}>
      <Link href={`/fleet/${t.slug}`} className="absolute inset-0 z-10" aria-label={`${t.name}: view dossier`} />
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink bg-kraft">
        <Image
          src={publicUrl(t.coverImageKey)}
          alt={`${t.name} cardboard ${VEHICLE_LABELS[t.vehicleType].toLowerCase()} template`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          priority={priority}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded bg-ink/85 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-paper">{VEHICLE_LABELS[t.vehicleType]}</span>
          {t.membersOnly && <span className="rounded bg-[#e7d27c] px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-ink">Members</span>}
        </div>
        {t.pricingMode === "FREE" && (
          <Stamp className="absolute bottom-3 right-3 bg-paper/80" color="olive" size="sm" rotate={-8}>
            Free issue
          </Stamp>
        )}
        <div className="absolute right-2 top-2 z-20">
          <FavoriteButton templateId={t.id} initial={Boolean(favorited)} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          {t.codename && <p className="truncate font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{t.codename}</p>}
          <h3 className="font-stencil text-xl leading-tight text-olive-dark">{t.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.tagline}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 border-y border-dashed border-ink/25 py-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Difficulty</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
              <DifficultyPips level={DIFFICULTY_LEVEL[t.difficulty]} />
              <span className="sr-only">{DIFFICULTY_LABELS[t.difficulty]}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cat size</dt>
            <dd className="mt-0.5 font-semibold">{CAT_SIZE_LABELS[t.catSize]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Build</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-semibold">
              <Clock className="size-3" aria-hidden="true" />
              {formatBuildTime(t.buildTimeMinutes)}
            </dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {rating && rating.count > 0 && (
              <span className="mr-3 inline-flex items-center gap-1">
                <Star className="size-3.5 fill-[#d4a72c] text-[#d4a72c]" aria-hidden="true" />
                <span className="font-semibold text-ink">{rating.avg.toFixed(1)}</span> ({rating.count})
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {recruits} recruit{recruits === 1 ? "" : "s"}
            </span>
          </div>
          <p className={cn("text-right font-stencil", t.pricingMode === "PWYW" ? "text-sm" : "text-xl", t.pricingMode === "FREE" ? "text-olive" : "text-ink")}>{priceLabel(t)}</p>
        </div>
      </div>
    </article>
  );
}
