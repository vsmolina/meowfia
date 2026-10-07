/**
 * Pure pricing engine (no DB, no I/O) so it's easy to unit test and identical
 * for the cart page, checkout session creation, and order records.
 *
 * Order of operations:
 *   1. line totals (unit price + license upgrade) × qty
 *   2. automatic bundle discounts (when every template in a bundle is in the cart individually)
 *   3. member discount (kits + merch only)
 *   4. coupon (on the discounted merchandise subtotal, gift cards excluded)
 *   5. shipping (free over threshold)
 *   6. store credit, then gift card balance (can cover shipping too)
 */

export type Channel = "TEMPLATES" | "KITS" | "MERCH" | "GIFT_CARDS";

export type PricingLine = {
  id: string;
  kind: "TEMPLATE" | "BUNDLE" | "PRODUCT" | "GIFT_CARD";
  channel: Channel;
  name: string;
  quantity: number;
  /** Base unit price (PWYW amount, variant price, bundle price, gift card value) */
  unitPriceCents: number;
  /** Extra per unit for commercial/classroom license */
  licenseUpgradeCents?: number;
  templateId?: string;
  shippable?: boolean;
  /** Eligible for the membership shop discount (kits, merch) */
  memberDiscountEligible?: boolean;
};

export type PricingBundle = { id: string; name: string; discountPercent: number; templateIds: string[] };

export type PricingCoupon = { code: string; percentOff?: number | null; amountOffCents?: number | null; minSubtotalCents?: number | null };

export type PricingInput = {
  lines: PricingLine[];
  bundles?: PricingBundle[];
  coupon?: PricingCoupon | null;
  memberDiscountPercent?: number;
  shippingRate?: { priceCents: number; freeOverCents?: number | null } | null;
  storeCreditCents?: number;
  giftCardBalanceCents?: number;
};

export type PricedLine = PricingLine & { lineTotalCents: number };

export type PricingResult = {
  lines: PricedLine[];
  subtotalCents: number;
  bundleDiscounts: { bundleId: string; name: string; amountCents: number }[];
  bundleDiscountCents: number;
  memberDiscountCents: number;
  couponDiscountCents: number;
  couponError?: string;
  discountCents: number;
  needsShipping: boolean;
  shippingCents: number;
  creditAppliedCents: number;
  giftCardAppliedCents: number;
  totalCents: number;
};

const pct = (amount: number, percent: number) => Math.round((amount * percent) / 100);

export function priceCart(input: PricingInput): PricingResult {
  const lines: PricedLine[] = input.lines.map((l) => ({
    ...l,
    quantity: Math.max(1, Math.floor(l.quantity)),
    lineTotalCents: Math.max(0, (l.unitPriceCents + (l.licenseUpgradeCents ?? 0)) * Math.max(1, Math.floor(l.quantity))),
  }));
  const subtotalCents = lines.reduce((a, l) => a + l.lineTotalCents, 0);

  // 2. Automatic bundle discounts: greedy by biggest saving, no template counted twice
  const templateLines = new Map(lines.filter((l) => l.kind === "TEMPLATE" && l.templateId).map((l) => [l.templateId!, l]));
  const candidates = (input.bundles ?? [])
    .filter((b) => b.templateIds.length > 1 && b.templateIds.every((id) => templateLines.has(id)))
    .map((b) => ({ b, amount: pct(b.templateIds.reduce((a, id) => a + templateLines.get(id)!.unitPriceCents, 0), b.discountPercent) }))
    .sort((x, y) => y.amount - x.amount);
  const used = new Set<string>();
  const bundleDiscounts: PricingResult["bundleDiscounts"] = [];
  for (const { b, amount } of candidates) {
    if (b.templateIds.some((id) => used.has(id))) continue;
    b.templateIds.forEach((id) => used.add(id));
    bundleDiscounts.push({ bundleId: b.id, name: b.name, amountCents: amount });
  }
  const bundleDiscountCents = bundleDiscounts.reduce((a, d) => a + d.amountCents, 0);

  // 3. Member discount on kits/merch
  const memberBase = lines.filter((l) => l.memberDiscountEligible).reduce((a, l) => a + l.lineTotalCents, 0);
  const memberDiscountCents = input.memberDiscountPercent ? pct(memberBase, input.memberDiscountPercent) : 0;

  // 4. Coupon (gift cards are cash-equivalent and never discounted)
  const giftCardTotal = lines.filter((l) => l.kind === "GIFT_CARD").reduce((a, l) => a + l.lineTotalCents, 0);
  const discountable = Math.max(0, subtotalCents - giftCardTotal - bundleDiscountCents - memberDiscountCents);
  let couponDiscountCents = 0;
  let couponError: string | undefined;
  if (input.coupon) {
    const c = input.coupon;
    if (c.minSubtotalCents && discountable < c.minSubtotalCents) {
      couponError = `Code ${c.code} needs a ${(c.minSubtotalCents / 100).toFixed(0)}+ dollar order`;
    } else if (c.percentOff) {
      couponDiscountCents = pct(discountable, Math.min(100, c.percentOff));
    } else if (c.amountOffCents) {
      couponDiscountCents = Math.min(discountable, c.amountOffCents);
    }
  }

  const discountCents = bundleDiscountCents + memberDiscountCents + couponDiscountCents;
  const afterDiscounts = Math.max(0, subtotalCents - discountCents);

  // 5. Shipping
  const needsShipping = lines.some((l) => l.shippable);
  const shippableTotal = lines.filter((l) => l.shippable).reduce((a, l) => a + l.lineTotalCents, 0);
  let shippingCents = 0;
  if (needsShipping && input.shippingRate) {
    const free = input.shippingRate.freeOverCents != null && shippableTotal >= input.shippingRate.freeOverCents;
    shippingCents = free ? 0 : input.shippingRate.priceCents;
  }

  // 6. Store credit, then gift card (credit can't buy gift cards: stops credit → cash laundering)
  let due = afterDiscounts + shippingCents;
  const creditable = Math.max(0, due - giftCardTotal);
  const creditAppliedCents = Math.min(input.storeCreditCents ?? 0, creditable);
  due -= creditAppliedCents;
  const giftCardAppliedCents = Math.min(input.giftCardBalanceCents ?? 0, Math.max(0, due - giftCardTotal));
  due -= giftCardAppliedCents;

  return {
    lines,
    subtotalCents,
    bundleDiscounts,
    bundleDiscountCents,
    memberDiscountCents,
    couponDiscountCents,
    couponError,
    discountCents,
    needsShipping,
    shippingCents,
    creditAppliedCents,
    giftCardAppliedCents,
    totalCents: Math.max(0, due),
  };
}

/** Price of a bundle bought as one item */
export function bundlePriceCents(templates: { pricingMode: string; priceCents: number; suggestedPriceCents: number | null }[], discountPercent: number) {
  const full = templates.reduce((a, t) => a + (t.pricingMode === "PWYW" ? (t.suggestedPriceCents ?? t.priceCents) : t.pricingMode === "FREE" ? 0 : t.priceCents), 0);
  return { fullCents: full, priceCents: full - pct(full, discountPercent) };
}
