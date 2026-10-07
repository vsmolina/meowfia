"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { voteAction } from "@/actions/membership";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoteForm({ pollId, options, myVote, showResults, totals }: { pollId: string; options: { id: string; label: string; description: string | null }[]; myVote: string | null; showResults: boolean; totals: Record<string, number> }) {
  const [state, action, pending] = useActionState(voteAction, initialActionState);
  const [choice, setChoice] = useState(myVote);
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="pollId" value={pollId} />
      {options.map((o) => {
        const pct = Math.round(((totals[o.id] ?? 0) / sum) * 100);
        return (
          <label key={o.id} className={cn("relative block cursor-pointer overflow-hidden rounded-lg border-2 p-4 transition", choice === o.id ? "border-ink" : "border-ink/25 hover:border-ink/60")}>
            {showResults && <span className="absolute inset-y-0 left-0 bg-olive/15" style={{ width: `${pct}%` }} aria-hidden="true" />}
            <span className="relative flex items-center gap-3">
              <input type="radio" name="optionId" value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} className="size-5 accent-[var(--olive)]" />
              <span className="flex-1">
                <span className="font-semibold">{o.label}</span>
                {o.description && <span className="block text-sm text-muted-foreground">{o.description}</span>}
              </span>
              {showResults && <span className="font-stencil">{pct}%</span>}
            </span>
          </label>
        );
      })}
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm font-semibold text-olive">✅ {state.message}</p>}
      <Button type="submit" disabled={pending || !choice}>
        {pending && <Loader2 className="animate-spin" />} {myVote ? "Change vote" : "Cast vote"}
      </Button>
    </form>
  );
}
