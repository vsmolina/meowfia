"use client";

import { useActionState, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { tipAction } from "@/actions/support";
import { initialActionState } from "@/lib/action-state";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function TipForm({ presets, defaultEmail }: { presets: readonly number[]; defaultEmail?: string | null }) {
  const [state, action, pending] = useActionState(tipAction, initialActionState);
  const [amount, setAmount] = useState<number | "custom">(presets[1] ?? presets[0]);
  return (
    <form action={action} className="space-y-4">
      <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Choose an amount</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {presets.map((c) => (
            <button key={c} type="button" onClick={() => setAmount(c)} aria-pressed={amount === c} className={cn("rounded-md border-2 py-3 font-stencil text-lg", amount === c ? "border-ink bg-stamp text-paper shadow-stamp-sm" : "border-ink/40 bg-paper")}>
              {formatMoney(c)}
            </button>
          ))}
          <button type="button" onClick={() => setAmount("custom")} aria-pressed={amount === "custom"} className={cn("rounded-md border-2 py-3 font-semibold", amount === "custom" ? "border-ink bg-stamp text-paper shadow-stamp-sm" : "border-ink/40 bg-paper")}>
            Custom
          </button>
        </div>
        {amount === "custom" ? (
          <label className="mt-3 flex items-center gap-2">
            <span className="font-stencil text-xl">$</span>
            <Input name="customAmount" inputMode="decimal" placeholder="15" className="h-11 w-32 bg-paper" aria-label="Custom tip in dollars" />
          </label>
        ) : (
          <input type="hidden" name="amountCents" value={amount} />
        )}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" placeholder="Name for the wall (optional)" maxLength={60} className="h-11 bg-paper" aria-label="Your name" />
        <Input name="email" type="email" placeholder="Email for a thank-you (optional)" defaultValue={defaultEmail ?? ""} className="h-11 bg-paper" aria-label="Your email" />
      </div>
      <Textarea name="message" placeholder="Leave a note for the crew (optional)" maxLength={280} rows={2} className="bg-paper" aria-label="Message" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="showOnWall" defaultChecked className="size-4 accent-[var(--olive)]" /> Show my name and note on the Supporters Wall
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      <Button type="submit" variant="stamp" size="lg" disabled={pending} className="h-14 w-full font-stencil text-lg tracking-wider">
        {pending ? <Loader2 className="animate-spin" /> : <Heart className="fill-current" />} Send tip
      </Button>
    </form>
  );
}
