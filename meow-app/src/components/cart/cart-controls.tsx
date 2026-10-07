"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Minus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  addVariantToCart,
  applyCouponAction,
  applyGiftCardAction,
  removeCartItem,
  removeCouponAction,
  removeGiftCardAction,
  setItemLicense,
  setShippingRateAction,
  toggleOrderBumpAction,
  updateCartItemQuantity,
  updatePwywPrice,
  type CartActionResult,
} from "@/actions/cart";
import { checkoutAction, captureCartEmailAction } from "@/actions/checkout";
import { initialActionState } from "@/lib/action-state";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useCartMutation() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<CartActionResult>, success?: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Something went wrong");
      else if (success ?? r.message) toast.success(success ?? r.message);
      router.refresh();
    });
  return { pending, run };
}

export function QuantityStepper({ itemId, quantity }: { itemId: string; quantity: number }) {
  const { pending, run } = useCartMutation();
  return (
    <div className="inline-flex items-center rounded-md border-2 border-ink/70 bg-paper">
      <button type="button" aria-label="Decrease quantity" disabled={pending} onClick={() => run(() => updateCartItemQuantity(itemId, quantity - 1))} className="grid size-9 place-items-center disabled:opacity-50">
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {pending ? <Loader2 className="mx-auto size-4 animate-spin" /> : quantity}
      </span>
      <button type="button" aria-label="Increase quantity" disabled={pending} onClick={() => run(() => updateCartItemQuantity(itemId, quantity + 1))} className="grid size-9 place-items-center disabled:opacity-50">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function RemoveButton({ itemId, name }: { itemId: string; name: string }) {
  const { pending, run } = useCartMutation();
  return (
    <button type="button" onClick={() => run(() => removeCartItem(itemId), `Removed ${name}`)} disabled={pending} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-stamp" aria-label={`Remove ${name}`}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      <span className="hidden sm:inline">Remove</span>
    </button>
  );
}

export function LicenseSelect({ itemId, value, options }: { itemId: string; value: string; options: { value: string; label: string }[] }) {
  const { pending, run } = useCartMutation();
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">License</span>
      <select value={value} disabled={pending} onChange={(e) => run(() => setItemLicense(itemId, e.target.value))} className="h-8 rounded border-2 border-ink/50 bg-paper px-1.5 text-sm font-semibold">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PwywEditor({ itemId, cents, minCents }: { itemId: string; cents: number; minCents: number }) {
  const { pending, run } = useCartMutation();
  const [val, setVal] = useState((cents / 100).toFixed(2));
  const commit = () => {
    const c = Math.round(parseFloat(val || "0") * 100);
    if (c !== cents) run(() => updatePwywPrice(itemId, c));
  };
  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">Your price $</span>
      <input
        value={val}
        inputMode="decimal"
        onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        disabled={pending}
        className="h-8 w-20 rounded border-2 border-ink/50 bg-paper px-2 font-semibold"
        aria-describedby={`min-${itemId}`}
      />
      <span id={`min-${itemId}`} className="text-xs text-muted-foreground">min {formatMoney(minCents)}</span>
    </label>
  );
}

export function UpsellButton({ variantId, label }: { variantId: string; label: string }) {
  const { pending, run } = useCartMutation();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => addVariantToCart({ variantId, quantity: 1 }))}>
      {pending ? <Loader2 className="animate-spin" /> : <Plus />} {label}
    </Button>
  );
}

export function OrderBump({ checked, headline, blurb, priceCents }: { checked: boolean; headline: string; blurb: string; priceCents: number }) {
  const { pending, run } = useCartMutation();
  return (
    <label className={cn("flex cursor-pointer gap-3 rounded-lg border-2 border-dashed p-4 transition", checked ? "border-olive bg-olive/10" : "border-stamp bg-[#e7d27c]/25 hover:bg-[#e7d27c]/40")}>
      <input type="checkbox" checked={checked} disabled={pending} onChange={(e) => run(() => toggleOrderBumpAction(e.target.checked))} className="mt-1 size-5 shrink-0 accent-[var(--olive)]" />
      <span>
        <span className="block font-bold">
          {pending && <Loader2 className="mr-1 inline size-4 animate-spin" />}
          {headline} <span className="text-stamp">+{formatMoney(priceCents)}</span>
        </span>
        <span className="block text-sm text-muted-foreground">{blurb}</span>
      </span>
    </label>
  );
}

function CodeForm({
  label,
  placeholder,
  action,
  applied,
  onRemove,
}: {
  label: string;
  placeholder: string;
  action: (prev: CartActionResult, fd: FormData) => Promise<CartActionResult>;
  applied: string | null;
  onRemove: () => Promise<CartActionResult>;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (prev: CartActionResult, fd: FormData) => {
    const r = await action(prev, fd);
    if (r.ok) {
      toast.success(r.message);
      router.refresh();
    }
    return r;
  }, { ok: false } as CartActionResult);
  const { pending: removing, run } = useCartMutation();

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border-2 border-olive/60 bg-olive/10 px-3 py-2 text-sm">
        <span>
          {label}: <b className="font-mono">{applied}</b>
        </span>
        <button type="button" onClick={() => run(onRemove)} disabled={removing} aria-label={`Remove ${label.toLowerCase()}`}>
          <X className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <form action={formAction} className="space-y-1">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`code-${label}`}>
          {label}
        </label>
        <input id={`code-${label}`} name="code" placeholder={placeholder} autoCapitalize="characters" className="h-10 min-w-0 flex-1 rounded-md border-2 border-ink/50 bg-paper px-3 font-mono text-sm uppercase" />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : "Apply"}
        </Button>
      </div>
      {state.error && <p className="text-xs font-semibold text-stamp">{state.error}</p>}
    </form>
  );
}

export function CouponForm({ applied }: { applied: string | null }) {
  return <CodeForm label="Promo code" placeholder="Promo code" action={applyCouponAction} applied={applied} onRemove={removeCouponAction} />;
}

export function GiftCardForm({ applied }: { applied: string | null }) {
  return <CodeForm label="Gift card" placeholder="MEOW-XXXXXX-XXXXXX" action={applyGiftCardAction} applied={applied} onRemove={removeGiftCardAction} />;
}

export function ShippingSelect({ rates, selected }: { rates: { id: string; name: string; priceCents: number; minDays: number; maxDays: number; freeOverCents: number | null }[]; selected: string | null }) {
  const { pending, run } = useCartMutation();
  return (
    <fieldset className="space-y-2" disabled={pending}>
      <legend className="mb-1 text-sm font-semibold">Shipping</legend>
      {rates.map((r) => (
        <label key={r.id} className={cn("flex cursor-pointer items-center gap-3 rounded-md border-2 px-3 py-2 text-sm", selected === r.id ? "border-ink bg-paper" : "border-ink/20")}>
          <input type="radio" name="shipping" checked={selected === r.id} onChange={() => run(() => setShippingRateAction(r.id))} className="accent-[var(--olive)]" />
          <span className="flex-1">
            {r.name}
            <span className="block text-xs text-muted-foreground">
              {r.minDays}–{r.maxDays} business days{r.freeOverCents ? ` · free over ${formatMoney(r.freeOverCents)}` : ""}
            </span>
          </span>
          <span className="font-semibold">{formatMoney(r.priceCents)}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function CheckoutForm({ signedInEmail, defaultEmail, totalCents, isMock }: { signedInEmail: string | null; defaultEmail: string | null; totalCents: number; isMock: boolean }) {
  const [state, action, pending] = useActionState(checkoutAction, initialActionState);
  return (
    <form action={action} onSubmit={() => track("InitiateCheckout", { value: totalCents / 100 })} className="space-y-3">
      {signedInEmail ? (
        <p className="text-sm text-muted-foreground">
          Receipt and downloads go to <b className="text-ink">{signedInEmail}</b>
        </p>
      ) : (
        <div className="space-y-1">
          <label htmlFor="checkout-email" className="text-sm font-semibold">
            Email for receipt &amp; downloads
          </label>
          <input
            id="checkout-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaultEmail ?? ""}
            onBlur={(e) => captureCartEmailAction(e.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-md border-2 border-ink/70 bg-paper px-3 text-base"
          />
        </div>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="optIn" defaultChecked className="mt-1 size-4 accent-[var(--olive)]" />
        Email me about new templates and drops
      </label>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-stamp">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="h-14 w-full font-stencil text-lg tracking-wider">
        {pending ? <Loader2 className="animate-spin" /> : <Lock />}
        {totalCents === 0 ? "Complete order" : `Checkout · ${formatMoney(totalCents)}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {isMock ? "Test mode: no real payment is taken." : "Secure checkout by Stripe. Cards, Apple Pay, Google Pay."}
      </p>
    </form>
  );
}
