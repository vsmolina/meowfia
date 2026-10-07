"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    key: "type",
    label: "Vehicle type",
    multi: true,
    options: [
      { value: "TANK", label: "Tank" },
      { value: "PLANE", label: "Plane" },
      { value: "BOAT", label: "Warship" },
      { value: "OTHER", label: "Other" },
    ],
  },
  {
    key: "difficulty",
    label: "Difficulty",
    multi: true,
    options: [
      { value: "RECRUIT", label: "Recruit" },
      { value: "SOLDIER", label: "Soldier" },
      { value: "VETERAN", label: "Veteran" },
      { value: "ELITE", label: "Elite" },
    ],
  },
  {
    key: "size",
    label: "Cat size",
    multi: true,
    options: [
      { value: "KITTEN", label: "Kitten" },
      { value: "STANDARD", label: "Standard" },
      { value: "CHONK", label: "Chonk" },
    ],
  },
  {
    key: "price",
    label: "Price",
    multi: false,
    options: [
      { value: "free", label: "Free" },
      { value: "paid", label: "Paid" },
      { value: "under10", label: "Under $10" },
      { value: "10plus", label: "$10+" },
    ],
  },
] as const;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most built" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const values = (key: string) => (params.get(key)?.split(",").filter(Boolean) ?? []) as string[];
  const update = (mut: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mut(next);
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const toggle = (key: string, value: string, multi: boolean) =>
    update((p) => {
      const cur = p.get(key)?.split(",").filter(Boolean) ?? [];
      const has = cur.includes(value);
      const next = multi ? (has ? cur.filter((v) => v !== value) : [...cur, value]) : has ? [] : [value];
      if (next.length) p.set(key, next.join(","));
      else p.delete(key);
    });
  const clear = () => update((p) => GROUPS.forEach((g) => p.delete(g.key)));
  const activeCount = GROUPS.reduce((n, g) => n + values(g.key).length, 0);
  return { values, toggle, clear, update, pending, activeCount, params };
}

function FilterGroups({ className }: { className?: string }) {
  const { values, toggle } = useFilterState();
  return (
    <div className={cn("space-y-6", className)}>
      {GROUPS.map((g) => (
        <fieldset key={g.key}>
          <legend className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">{g.label}</legend>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => {
              const active = values(g.key).includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(g.key, o.value, g.multi)}
                  className={cn(
                    "rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-semibold transition",
                    active ? "bg-olive text-paper shadow-stamp-sm" : "bg-paper hover:bg-muted",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export function FleetFilterSidebar() {
  const { clear, activeCount } = useFilterState();
  return (
    <div className="rounded-xl border-2 border-ink bg-paper p-5 shadow-stamp-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-stencil text-lg">Filters</p>
        {activeCount > 0 && (
          <button type="button" onClick={clear} className="text-sm font-semibold underline">
            Clear all
          </button>
        )}
      </div>
      <FilterGroups />
    </div>
  );
}

export function FleetToolbar({ count }: { count: number }) {
  const { params, update, pending, activeCount, clear } = useFilterState();
  const sort = params.get("sort") ?? "featured";
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md border-2 border-ink bg-paper px-4 font-semibold shadow-stamp-sm lg:hidden">
            <SlidersHorizontal className="size-4" /> Filters
            {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-olive text-xs text-paper">{activeCount}</span>}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-sand">
          <SheetHeader>
            <SheetTitle className="font-stencil text-xl">Filter the fleet</SheetTitle>
          </SheetHeader>
          <FilterGroups className="px-4 pb-8" />
        </SheetContent>
      </Sheet>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {pending ? <Loader2 className="inline size-4 animate-spin" /> : `${count} vehicle${count === 1 ? "" : "s"}`}
      </p>
      {activeCount > 0 && (
        <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-sm font-semibold underline lg:hidden">
          <X className="size-3.5" /> Clear
        </button>
      )}
      <label className="ml-auto flex items-center gap-2 text-sm">
        <span className="hidden sm:inline">Sort</span>
        <select
          value={sort}
          onChange={(e) => update((p) => (e.target.value === "featured" ? p.delete("sort") : p.set("sort", e.target.value)))}
          className="h-10 rounded-md border-2 border-ink bg-paper px-2 font-semibold"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
