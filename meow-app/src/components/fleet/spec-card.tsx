import { Clock, Package, Users } from "lucide-react";
import type { Template } from "@/lib/db";
import { formatBuildTime } from "@/lib/format";
import { CAT_SIZE_HINTS, CAT_SIZE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_LEVEL, VEHICLE_LABELS } from "@/lib/labels";
import { Stamp } from "@/components/brand/stamp";
import { DifficultyPips } from "@/components/fleet/template-card";
import { cn } from "@/lib/utils";

function CatSizeMeter({ size }: { size: Template["catSize"] }) {
  const sizes = ["KITTEN", "STANDARD", "CHONK"] as const;
  return (
    <span className="flex items-end gap-1.5" aria-label={`Cat size: ${CAT_SIZE_LABELS[size]}`}>
      {sizes.map((s, i) => (
        <svg key={s} viewBox="0 0 24 24" className={cn(["size-4", "size-5", "size-7"][i], s === size ? "text-olive" : "text-ink/15")} fill="currentColor" aria-hidden="true">
          <path d="M4 10 L6 3 L10 7.5 H14 L18 3 L20 10 Q21 20 12 21 Q3 20 4 10 Z" />
        </svg>
      ))}
    </span>
  );
}

/** Military vehicle dossier for a template */
export function SpecCard({
  template: t,
  recruits,
  fileNo,
  className,
}: {
  template: Pick<Template, "name" | "codename" | "vehicleType" | "difficulty" | "catSize" | "buildTimeMinutes" | "materials">;
  recruits: number;
  fileNo: string;
  className?: string;
}) {
  const materials = (t.materials as string[]) ?? [];
  const rows: [string, React.ReactNode][] = [
    ["Designation", <span key="d" className="font-stencil text-base">{t.name}</span>],
    ["Codename", t.codename ?? "-"],
    ["Class", VEHICLE_LABELS[t.vehicleType]],
    [
      "Difficulty",
      <span key="df" className="inline-flex items-center gap-2">
        <DifficultyPips level={DIFFICULTY_LEVEL[t.difficulty]} /> {DIFFICULTY_LABELS[t.difficulty]}
      </span>,
    ],
    [
      "Build time",
      <span key="bt" className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5" aria-hidden="true" /> {formatBuildTime(t.buildTimeMinutes)}
      </span>,
    ],
    [
      "Cat size",
      <span key="cs" className="inline-flex items-center gap-2">
        <CatSizeMeter size={t.catSize} /> {CAT_SIZE_LABELS[t.catSize]} <span className="text-muted-foreground">({CAT_SIZE_HINTS[t.catSize]})</span>
      </span>,
    ],
    [
      "Deployed",
      <span key="rc" className="inline-flex items-center gap-1.5">
        <Users className="size-3.5" aria-hidden="true" /> {recruits} recruit{recruits === 1 ? "" : "s"} built this
      </span>,
    ],
  ];

  return (
    <section aria-label="Vehicle specifications" className={cn("relative overflow-hidden rounded-xl border-2 border-ink bg-dossier shadow-stamp", className)}>
      <div className="flex items-center justify-between border-b-2 border-ink bg-olive px-4 py-2 text-paper">
        <p className="font-mono text-xs uppercase tracking-[0.25em]">Vehicle dossier</p>
        <p className="font-mono text-xs tracking-[0.2em] text-[#e7d27c]">FILE NO. {fileNo}</p>
      </div>
      <Stamp className="pointer-events-none absolute right-4 top-14 hidden sm:inline-block" color="red" size="sm" rotate={-10}>
        Approved for issue
      </Stamp>
      <dl className="divide-y divide-dashed divide-ink/25 px-4 font-mono text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] items-center gap-3 py-2.5">
            <dt className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{k}</dt>
            <dd className="font-sans">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t-2 border-ink/80 px-4 py-3">
        <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          <Package className="size-3.5" aria-hidden="true" /> Materials manifest
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {materials.map((m) => (
            <li key={m} className="flex gap-2">
              <span aria-hidden="true" className="mt-1 inline-block size-3 shrink-0 rounded-[2px] border-2 border-ink/60" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
