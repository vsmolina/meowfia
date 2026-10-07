"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { addGiftCardToCart, type CartActionResult } from "@/actions/cart";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function GiftCardForm({ presets }: { presets: readonly number[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addGiftCardToCart, { ok: false } as CartActionResult);
  const [amount, setAmount] = useState<number | "custom">(presets[1] ?? presets[0]);
  useEffect(() => {
    if (state.ok) router.push("/cart");
  }, [state.ok, router]);
  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Amount</legend>
        <div className="flex flex-wrap gap-2">
          {presets.map((c) => (
            <button key={c} type="button" onClick={() => setAmount(c)} aria-pressed={amount === c} className={cn("rounded-md border-2 px-4 py-2 font-stencil text-lg", amount === c ? "border-ink bg-olive text-paper shadow-stamp-sm" : "border-ink/40 bg-paper")}>
              {formatMoney(c)}
            </button>
          ))}
          <button type="button" onClick={() => setAmount("custom")} aria-pressed={amount === "custom"} className={cn("rounded-md border-2 px-4 py-2 font-semibold", amount === "custom" ? "border-ink bg-olive text-paper shadow-stamp-sm" : "border-ink/40 bg-paper")}>
            Custom
          </button>
        </div>
        {amount === "custom" ? (
          <label className="mt-3 flex items-center gap-2">
            <span className="font-stencil text-xl">$</span>
            <Input name="customAmount" inputMode="decimal" placeholder="40" className="h-11 w-32 bg-paper" aria-label="Custom amount in dollars" />
            <span className="text-xs text-muted-foreground">$5–$500</span>
          </label>
        ) : (
          <input type="hidden" name="amountCents" value={amount} />
        )}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="g-name">Recipient name</Label>
          <Input id="g-name" name="recipientName" className="h-11 bg-paper" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="g-email">Recipient email *</Label>
          <Input id="g-email" name="recipientEmail" type="email" required className="h-11 bg-paper" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="g-msg">Message (optional)</Label>
          <Textarea id="g-msg" name="message" rows={3} maxLength={300} placeholder="Happy birthday! Your cat deserves a tank." className="bg-paper" />
        </div>
      </div>
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="h-12">
        {pending ? <Loader2 className="animate-spin" /> : <Gift />} Add gift card to cart
      </Button>
      <p className="text-xs text-muted-foreground">Delivered by email right after checkout with a unique code. Never expires.</p>
    </form>
  );
}
