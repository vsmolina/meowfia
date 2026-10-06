"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    done: ms === 0,
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms / 3_600_000) % 24),
    m: Math.floor((ms / 60_000) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

/** Mission-clock countdown. Renders a stable placeholder on the server to avoid hydration mismatch. */
export function Countdown({
  to,
  className,
  size = "md",
  doneLabel = "DEPLOYED",
}: {
  to: string | Date;
  className?: string;
  size?: "sm" | "md" | "lg";
  doneLabel?: string;
}) {
  const target = new Date(to).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    const tick = () => setT(diff(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (t?.done) {
    return <span className={cn("font-stencil text-olive", className)}>{doneLabel}</span>;
  }

  const units: [string, number | undefined][] = [
    ["Days", t?.d],
    ["Hrs", t?.h],
    ["Min", t?.m],
    ["Sec", t?.s],
  ];
  const box = { sm: "min-w-10 px-1.5 py-1 text-lg", md: "min-w-14 px-2 py-1.5 text-2xl", lg: "min-w-16 px-3 py-2 text-4xl sm:min-w-20 sm:text-5xl" }[size];

  return (
    <div className={cn("flex gap-2", className)} role="timer" aria-live="off" aria-label="Time until release">
      {units.map(([label, v]) => (
        <div key={label} className="text-center">
          <div className={cn("rounded bg-ink font-mono font-medium tabular-nums text-[#e7d27c] shadow-stamp-sm", box)}>
            {v === undefined ? "--" : String(v).padStart(2, "0")}
          </div>
          <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}
