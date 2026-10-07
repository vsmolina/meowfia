"use client";

import { useActionState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { notifyMeAction } from "@/actions/drops";
import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

export function NotifyForm({ templateId, tone = "light", className }: { templateId: string; tone?: "light" | "dark"; className?: string }) {
  const [state, action, pending] = useActionState(notifyMeAction, initialActionState);
  if (state.ok) return <p role="status" className={cn("font-semibold", tone === "dark" ? "text-[#e7d27c]" : "text-olive-dark", className)}>🔔 {state.message}</p>;
  return (
    <form action={action} className={cn("space-y-2", className)}>
      <input type="hidden" name="templateId" value={templateId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`notify-${templateId}`} className="sr-only">Email address</label>
        <input
          id={`notify-${templateId}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-12 min-w-0 flex-1 rounded-md border-2 border-ink/70 bg-paper px-3 text-base text-ink placeholder:text-ink/50 focus-visible:ring-2 focus-visible:ring-olive focus-visible:outline-none"
        />
        <button type="submit" disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-ink bg-stamp px-5 font-stencil tracking-wider text-paper shadow-stamp-sm transition hover:-translate-y-0.5 disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />} Notify me
        </button>
      </div>
      {state.error && <p role="alert" className={cn("text-sm font-semibold", tone === "dark" ? "text-[#ffd2c8]" : "text-stamp")}>{state.error}</p>}
    </form>
  );
}
