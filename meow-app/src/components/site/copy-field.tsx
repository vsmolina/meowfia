"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyField({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };
  const share = async () => {
    if (navigator.share) await navigator.share({ url: value }).catch(() => {});
    else copy();
  };
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</label>
      <div className="flex gap-2">
        <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="h-11 min-w-0 flex-1 rounded-md border-2 border-ink/70 bg-paper px-3 font-mono text-sm text-ink" aria-label={label} />
        <button type="button" onClick={copy} className="inline-flex h-11 items-center gap-1.5 rounded-md border-2 border-ink bg-[#e7d27c] px-3 text-sm font-bold text-ink shadow-stamp-sm">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <button type="button" onClick={share} className="inline-flex h-11 items-center rounded-md border-2 border-ink bg-paper px-3 text-ink shadow-stamp-sm sm:hidden" aria-label="Share">
          <Share2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
