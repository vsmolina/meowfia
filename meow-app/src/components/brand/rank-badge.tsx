import { cn } from "@/lib/utils";

import type { RankName } from "@/lib/ranks";
export { rankFor, type RankName } from "@/lib/ranks";

function Chevron({ y }: { y: number }) {
  return <path d={`M8 ${y} L32 ${y + 12} L56 ${y} L56 ${y + 7} L32 ${y + 19} L8 ${y + 7} Z`} />;
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} />;
}

/** SVG insignia: chevrons (enlisted), bars (lieutenant/captain), stars (general) */
export function RankInsignia({ rank, className }: { rank: RankName | string; className?: string }) {
  let shape: React.ReactNode;
  switch (rank) {
    case "Private":
      shape = <Chevron y={22} />;
      break;
    case "Corporal":
      shape = (
        <>
          <Chevron y={14} />
          <Chevron y={30} />
        </>
      );
      break;
    case "Sergeant":
      shape = (
        <>
          <Chevron y={8} />
          <Chevron y={22} />
          <Chevron y={36} />
        </>
      );
      break;
    case "Lieutenant":
      shape = <rect x="26" y="10" width="12" height="44" rx="2" />;
      break;
    case "Captain":
      shape = (
        <>
          <rect x="16" y="10" width="11" height="44" rx="2" />
          <rect x="37" y="10" width="11" height="44" rx="2" />
        </>
      );
      break;
    case "General":
    default:
      shape = (
        <>
          <Star cx={18} cy={32} r={12} />
          <Star cx={46} cy={32} r={12} />
        </>
      );
  }
  return (
    <svg viewBox="0 0 64 64" className={cn("size-6", className)} fill="currentColor" aria-hidden="true">
      {shape}
    </svg>
  );
}

const RANK_STYLES: Record<string, string> = {
  Private: "bg-khaki text-ink",
  Corporal: "bg-khaki text-olive-dark",
  Sergeant: "bg-olive-light text-paper",
  Lieutenant: "bg-olive text-[#e7d27c]",
  Captain: "bg-olive-dark text-[#e7d27c]",
  General: "bg-ink text-[#f0c84b]",
};

export function RankBadge({
  rank,
  size = "md",
  showLabel = true,
  className,
}: {
  rank: RankName | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const dims = { sm: "size-6 p-1", md: "size-9 p-1.5", lg: "size-16 p-2.5" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)} title={`Rank: ${rank}`}>
      <span className={cn("grid place-items-center rounded-full shadow-stamp-sm ring-2 ring-ink/80", dims, RANK_STYLES[rank] ?? RANK_STYLES.Private)}>
        <RankInsignia rank={rank} className="size-full" />
      </span>
      {showLabel && <span className="font-stencil text-sm uppercase tracking-wider">{rank}</span>}
    </span>
  );
}
