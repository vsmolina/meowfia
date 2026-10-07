"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, Gift, Loader2, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { addTemplateToCart } from "@/actions/cart";
import { claimFreeTemplateAction } from "@/actions/claim";
import { initialActionState } from "@/lib/action-state";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type License = "PERSONAL" | "COMMERCIAL" | "CLASSROOM";
const LICENSE_RANK: Record<License, number> = { PERSONAL: 0, COMMERCIAL: 1, CLASSROOM: 2 };

export type PurchasePanelProps = {
  template: {
    id: string;
    name: string;
    pricingMode: "FREE" | "FIXED" | "PWYW";
    priceCents: number;
    suggestedPriceCents: number | null;
    commercialUpgradeCents: number;
    classroomUpgradeCents: number;
    membersOnly: boolean;
  };
  ownedLicense: License | null;
  memberIncluded: boolean;
  signedIn: boolean;
  membershipName: string;
};

function ClaimFree({ templateId, signedIn }: { templateId: string; signedIn: boolean }) {
  const [state, action, pending] = useActionState(claimFreeTemplateAction, initialActionState);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      track("Lead", { content_name: "free_template" });
      if (state.redirectTo) router.push(state.redirectTo);
    }
  }, [state, router]);
  if (state.ok && !state.redirectTo) {
    return <p role="status" className="rounded-md border-2 border-dashed border-olive p-4 font-semibold text-olive-dark">✅ {state.message}</p>;
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {!signedIn && (
        <>
          <label htmlFor="claim-email" className="text-sm font-semibold">
            Where should we send it?
          </label>
          <input id="claim-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-12 w-full rounded-md border-2 border-ink/70 bg-paper px-3 text-base focus-visible:ring-2 focus-visible:ring-olive focus-visible:outline-none" />
        </>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="optIn" defaultChecked className="mt-1 size-4 accent-[var(--olive)]" />
        Send me new templates and drop alerts (unsubscribe anytime)
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      <Button type="submit" size="lg" className="h-14 w-full font-stencil text-lg tracking-wider" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Gift />} Claim free template
      </Button>
    </form>
  );
}

export function PurchasePanel({ template: t, ownedLicense, memberIncluded, signedIn, membershipName }: PurchasePanelProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [license, setLicense] = useState<License>(ownedLicense && ownedLicense !== "CLASSROOM" ? (ownedLicense === "PERSONAL" ? "COMMERCIAL" : "CLASSROOM") : "PERSONAL");
  const suggested = t.suggestedPriceCents ?? t.priceCents;
  const [pwyw, setPwyw] = useState((suggested / 100).toFixed(2));
  const pwywCents = Math.round(parseFloat(pwyw || "0") * 100);
  const pwywTooLow = t.pricingMode === "PWYW" && (!Number.isFinite(pwywCents) || pwywCents < t.priceCents);

  const owned = ownedLicense !== null;
  const base = owned ? 0 : t.pricingMode === "PWYW" ? pwywCents : t.priceCents;
  const upgrade = license === "COMMERCIAL" ? t.commercialUpgradeCents : license === "CLASSROOM" ? t.classroomUpgradeCents : 0;
  const total = (Number.isFinite(base) ? base : 0) + upgrade;

  const add = (thenCheckout: boolean) =>
    start(async () => {
      const res = await addTemplateToCart({ templateId: t.id, license, customPriceCents: t.pricingMode === "PWYW" ? pwywCents : null });
      if (!res.ok) return void toast.error(res.error);
      track("AddToCart", { value: total / 100, content_name: t.name });
      if (thenCheckout) router.push("/cart");
      else toast.success(res.message, { action: { label: "View cart", onClick: () => router.push("/cart") } });
    });

  const licenses: { id: License; label: string; price: number; blurb: string }[] = [
    { id: "PERSONAL", label: "Personal", price: 0, blurb: "Build for your own cats, gifts, and fun." },
    { id: "COMMERCIAL", label: "Commercial", price: t.commercialUpgradeCents, blurb: "Sell finished builds, use in paid content." },
    { id: "CLASSROOM", label: "Classroom", price: t.classroomUpgradeCents, blurb: "Print for a class, library, or workshop." },
  ];
  const availableLicenses = owned ? licenses.filter((l) => LICENSE_RANK[l.id] > LICENSE_RANK[ownedLicense!]) : licenses;

  return (
    <div className="space-y-5 rounded-xl border-2 border-ink bg-paper p-5 shadow-stamp">
      {owned && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-olive/10 p-3">
          <p className="flex items-center gap-2 font-semibold text-olive-dark">
            <Check className="size-5" /> In your armory ({ownedLicense!.toLowerCase()} license)
          </p>
          <Button asChild size="sm">
            <Link href="/account/downloads"><Download /> Download</Link>
          </Button>
        </div>
      )}

      {!owned && memberIncluded && (
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-semibold text-olive-dark">
            <Sparkles className="size-5" /> Included with your {membershipName} membership
          </p>
          <Button asChild size="lg" className="h-14 w-full font-stencil text-lg tracking-wider">
            <Link href="/account/downloads"><Download /> Get it in your armory</Link>
          </Button>
        </div>
      )}

      {!owned && !memberIncluded && t.pricingMode === "FREE" && <ClaimFree templateId={t.id} signedIn={signedIn} />}

      {!owned && !memberIncluded && t.membersOnly && (
        <p className="rounded-md border-2 border-dashed border-[#c9a227] bg-[#e7d27c]/30 p-3 text-sm">
          <b>Free for Officer &amp; Commander members.</b> <Link href="/barracks" className="font-semibold underline">Join {membershipName}</Link> or buy it outright below.
        </p>
      )}

      {(t.pricingMode !== "FREE" || owned) && availableLicenses.length > 0 && !(memberIncluded && !owned) && (
        <>
          {!owned && t.pricingMode === "PWYW" && (
            <div className="space-y-2">
              <label htmlFor="pwyw" className="flex items-baseline justify-between text-sm font-semibold">
                Name your price
                <span className="font-normal text-muted-foreground">min {formatMoney(t.priceCents)} · suggested {formatMoney(suggested)}</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="font-stencil text-2xl">$</span>
                <input
                  id="pwyw"
                  inputMode="decimal"
                  value={pwyw}
                  onChange={(e) => setPwyw(e.target.value.replace(/[^0-9.]/g, ""))}
                  className={cn("h-12 w-32 rounded-md border-2 bg-paper px-3 font-stencil text-2xl", pwywTooLow ? "border-stamp" : "border-ink/70")}
                  aria-invalid={pwywTooLow}
                />
                <div className="flex flex-wrap gap-1.5">
                  {[suggested, Math.round(suggested * 1.5), suggested * 2].map((c) => (
                    <button key={c} type="button" onClick={() => setPwyw((c / 100).toFixed(2))} className="rounded-full border-2 border-ink/60 px-2.5 py-1 text-xs font-bold hover:bg-muted">
                      {formatMoney(c)}
                    </button>
                  ))}
                </div>
              </div>
              {pwywTooLow && <p className="text-sm text-stamp">Minimum is {formatMoney(t.priceCents)}.</p>}
              <p className="text-xs text-muted-foreground">Paying more directly funds new templates. Thank you! 🫡</p>
            </div>
          )}

          <fieldset id="license" className="scroll-mt-24 space-y-2">
            <legend className="mb-1 text-sm font-semibold">{owned ? "Upgrade your license" : "License"}</legend>
            {availableLicenses.map((l) => (
              <label key={l.id} className={cn("flex cursor-pointer items-start gap-3 rounded-md border-2 p-3 transition", license === l.id ? "border-ink bg-[#e7d27c]/30" : "border-ink/20 hover:border-ink/50")}>
                <input type="radio" name="license" value={l.id} checked={license === l.id} onChange={() => setLicense(l.id)} className="mt-1 size-4 accent-[var(--olive)]" />
                <span className="flex-1">
                  <span className="flex justify-between font-semibold">
                    {l.label} <span>{l.price ? `+${formatMoney(l.price)}` : "Included"}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{l.blurb}</span>
                </span>
              </label>
            ))}
            <Link href="/legal/license" className="inline-block text-xs underline">Compare licenses</Link>
          </fieldset>

          <div className="flex items-baseline justify-between border-t-2 border-dashed border-ink/25 pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-stencil text-3xl">{formatMoney(total)}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" variant="outline" disabled={pending || pwywTooLow} onClick={() => add(false)} className="h-12">
              {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />} Add to cart
            </Button>
            <Button size="lg" disabled={pending || pwywTooLow} onClick={() => add(true)} className="h-12 font-stencil tracking-wider">
              <Zap /> Buy now
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Instant download · US Letter + A4 · yours forever</p>
        </>
      )}
    </div>
  );
}
