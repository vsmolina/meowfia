"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { addVariantToCart } from "@/actions/cart";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = { id: string; name: string; priceCents: number | null; inventory: number | null };

export function ProductAddToCart({ name, basePriceCents, variants, memberDiscountPercent }: { name: string; basePriceCents: number; variants: Variant[]; memberDiscountPercent: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const firstAvailable = variants.find((v) => v.inventory !== 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const v = variants.find((x) => x.id === variantId) ?? variants[0];
  const price = v?.priceCents ?? basePriceCents;
  const soldOut = v?.inventory === 0;
  const maxQty = v?.inventory ?? 20;

  const add = (go: boolean) =>
    start(async () => {
      const r = await addVariantToCart({ variantId: v.id, quantity: qty });
      if (!r.ok) return void toast.error(r.error);
      track("AddToCart", { value: (price * qty) / 100, content_name: name });
      if (go) router.push("/cart");
      else toast.success(r.message, { action: { label: "View cart", onClick: () => router.push("/cart") } });
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <p className="font-stencil text-4xl">
        {formatMoney(price)}
        {memberDiscountPercent > 0 && <span className="ml-3 align-middle font-sans text-sm font-semibold text-olive">Member price {formatMoney(Math.round(price * (1 - memberDiscountPercent / 100)))} at checkout</span>}
      </p>
      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => {
                  setVariantId(x.id);
                  setQty(1);
                }}
                aria-pressed={x.id === variantId}
                disabled={x.inventory === 0}
                className={cn(
                  "rounded-md border-2 px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40",
                  x.id === variantId ? "border-ink bg-olive text-paper shadow-stamp-sm" : "border-ink/40 bg-paper hover:border-ink",
                )}
              >
                {x.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {v?.inventory != null && v.inventory > 0 && v.inventory <= 5 && <p className="text-sm font-semibold text-stamp">Only {v.inventory} left in stock</p>}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-md border-2 border-ink/70 bg-paper">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center">
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="grid size-11 place-items-center">
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">{v?.inventory === null ? "Printed on demand" : soldOut ? "Sold out" : "In stock"}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" variant="outline" className="h-12" disabled={pending || soldOut} onClick={() => add(false)}>
          {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />} Add to cart
        </Button>
        <Button size="lg" className="h-12 font-stencil tracking-wider" disabled={pending || soldOut} onClick={() => add(true)}>
          <Zap /> {soldOut ? "Sold out" : "Buy now"}
        </Button>
      </div>
    </div>
  );
}

/** "Frequently bought together": add all in one tap */
export function AddAllButton({ variantIds, totalCents }: { variantIds: string[]; totalCents: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="kraft"
      disabled={pending}
      onClick={() =>
        start(async () => {
          for (const id of variantIds) {
            const r = await addVariantToCart({ variantId: id, quantity: 1 });
            if (!r.ok) return void toast.error(r.error);
          }
          toast.success("Added to cart");
          router.push("/cart");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />} Add all · {formatMoney(totalCents)}
    </Button>
  );
}
