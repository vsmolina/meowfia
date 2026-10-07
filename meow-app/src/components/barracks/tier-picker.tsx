"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { startMembershipAction } from "@/actions/membership";
import { initialActionState } from "@/lib/action-state";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tier = { id: "RECRUIT" | "OFFICER" | "COMMANDER"; name: string; monthlyCents: number; annualCents: number; perks: readonly string[]; highlight?: boolean };

export function TierPicker({ tiers, currentTier }: { tiers: readonly Tier[]; currentTier: string | null }) {
  const [annual, setAnnual] = useState(true);
  const [state, action, pending] = useActionState(startMembershipAction, initialActionState);
  return (
    <div>
      <div className="mx-auto mb-8 flex w-fit items-center gap-1 rounded-full border-2 border-ink bg-paper p-1" role="radiogroup" aria-label="Billing interval">
        {[
          { v: false, l: "Monthly" },
          { v: true, l: "Annual · 2 months free" },
        ].map((o) => (
          <button key={o.l} type="button" role="radio" aria-checked={annual === o.v} onClick={() => setAnnual(o.v)} className={cn("rounded-full px-4 py-2 text-sm font-bold transition", annual === o.v ? "bg-olive text-paper" : "hover:bg-muted")}>
            {o.l}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => {
          const cents = annual ? t.annualCents : t.monthlyCents;
          const current = currentTier === t.id;
          return (
            <form
              key={t.id}
              action={action}
              onSubmit={() => track("Subscribe", { value: cents / 100, content_name: t.name })}
              className={cn("relative flex flex-col rounded-2xl border-2 border-ink bg-paper p-6 shadow-stamp", t.highlight && "bg-olive-camo text-paper lg:-translate-y-3")}
            >
              <input type="hidden" name="tier" value={t.id} />
              <input type="hidden" name="interval" value={annual ? "YEAR" : "MONTH"} />
              {t.highlight && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-[#e7d27c] px-3 py-0.5 font-stencil text-sm text-ink">Most enlisted</span>}
              <h3 className="font-stencil text-3xl">{t.name}</h3>
              <p className="mt-3 font-stencil text-4xl">
                {formatMoney(cents)}
                <span className="font-sans text-base font-normal opacity-70">/{annual ? "year" : "month"}</span>
              </p>
              {annual && <p className="text-sm opacity-75">That&apos;s {formatMoney(Math.round(t.annualCents / 12))}/month</p>}
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {t.perks.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className={cn("mt-0.5 size-4 shrink-0", t.highlight ? "text-[#e7d27c]" : "text-olive")} aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <Button type="submit" size="lg" variant={t.highlight ? "kraft" : "default"} disabled={pending || current} className="mt-6 h-12 w-full font-stencil tracking-wider">
                {pending && <Loader2 className="animate-spin" />}
                {current ? "Your current rank" : `Enlist as ${t.name}`}
              </Button>
            </form>
          );
        })}
      </div>
      {state.error && <p role="alert" className="mt-4 text-center font-semibold text-stamp">{state.error}</p>}
    </div>
  );
}
