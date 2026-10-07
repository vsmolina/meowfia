import { describe, expect, it } from "vitest";
import { priceCart, bundlePriceCents, type PricingLine } from "./pricing";

const tpl = (id: string, price: number, extra: Partial<PricingLine> = {}): PricingLine => ({
  id: `l-${id}`,
  kind: "TEMPLATE",
  channel: "TEMPLATES",
  name: id,
  quantity: 1,
  unitPriceCents: price,
  templateId: id,
  ...extra,
});
const kit = (id: string, price: number, qty = 1): PricingLine => ({
  id: `k-${id}`,
  kind: "PRODUCT",
  channel: "KITS",
  name: id,
  quantity: qty,
  unitPriceCents: price,
  shippable: true,
  memberDiscountEligible: true,
});
const gift = (amount: number): PricingLine => ({ id: "g", kind: "GIFT_CARD", channel: "GIFT_CARDS", name: "Gift", quantity: 1, unitPriceCents: amount });

describe("priceCart", () => {
  it("sums lines with license upgrades and quantities", () => {
    const r = priceCart({ lines: [tpl("a", 800, { licenseUpgradeCents: 1500 }), kit("k", 3900, 2)] });
    expect(r.subtotalCents).toBe(800 + 1500 + 7800);
    expect(r.totalCents).toBe(r.subtotalCents);
  });

  it("applies the automatic bundle discount only when all templates are present", () => {
    const bundles = [{ id: "b", name: "Armored", discountPercent: 20, templateIds: ["a", "b"] }];
    expect(priceCart({ lines: [tpl("a", 800)], bundles }).bundleDiscountCents).toBe(0);
    const r = priceCart({ lines: [tpl("a", 800), tpl("b", 1200)], bundles });
    expect(r.bundleDiscountCents).toBe(400);
    expect(r.totalCents).toBe(1600);
  });

  it("does not double-count templates across overlapping bundles (picks the bigger saving)", () => {
    const bundles = [
      { id: "small", name: "Small", discountPercent: 10, templateIds: ["a", "b"] },
      { id: "big", name: "Big", discountPercent: 30, templateIds: ["a", "b", "c"] },
    ];
    const r = priceCart({ lines: [tpl("a", 1000), tpl("b", 1000), tpl("c", 1000)], bundles });
    expect(r.bundleDiscounts.map((d) => d.bundleId)).toEqual(["big"]);
    expect(r.bundleDiscountCents).toBe(900);
  });

  it("member discount applies to kits/merch only", () => {
    const r = priceCart({ lines: [tpl("a", 1000), kit("k", 4000)], memberDiscountPercent: 10 });
    expect(r.memberDiscountCents).toBe(400);
  });

  it("percent coupon applies after bundle/member discounts and never to gift cards", () => {
    const r = priceCart({ lines: [tpl("a", 2000), gift(5000)], coupon: { code: "X", percentOff: 10 } });
    expect(r.couponDiscountCents).toBe(200);
    expect(r.totalCents).toBe(6800);
  });

  it("amount coupon respects minimum and caps at the discountable amount", () => {
    expect(priceCart({ lines: [tpl("a", 1000)], coupon: { code: "W", amountOffCents: 500, minSubtotalCents: 2500 } }).couponError).toBeTruthy();
    expect(priceCart({ lines: [tpl("a", 300)], coupon: { code: "W", amountOffCents: 500 } }).couponDiscountCents).toBe(300);
  });

  it("charges shipping for physical items unless over the free threshold", () => {
    const rate = { priceCents: 595, freeOverCents: 7500 };
    expect(priceCart({ lines: [tpl("a", 800)], shippingRate: rate }).shippingCents).toBe(0);
    expect(priceCart({ lines: [kit("k", 3900)], shippingRate: rate }).shippingCents).toBe(595);
    expect(priceCart({ lines: [kit("k", 3900, 2)], shippingRate: rate }).shippingCents).toBe(0);
  });

  it("applies store credit then gift card balance, never below zero", () => {
    const r = priceCart({ lines: [kit("k", 3900)], shippingRate: { priceCents: 595 }, storeCreditCents: 1000, giftCardBalanceCents: 99999 });
    expect(r.creditAppliedCents).toBe(1000);
    expect(r.giftCardAppliedCents).toBe(3900 + 595 - 1000);
    expect(r.totalCents).toBe(0);
  });

  it("store credit and gift cards cannot buy gift cards", () => {
    const r = priceCart({ lines: [gift(5000)], storeCreditCents: 5000, giftCardBalanceCents: 5000 });
    expect(r.creditAppliedCents).toBe(0);
    expect(r.giftCardAppliedCents).toBe(0);
    expect(r.totalCents).toBe(5000);
  });
});

describe("bundlePriceCents", () => {
  it("uses suggested price for PWYW and ignores free templates", () => {
    const r = bundlePriceCents(
      [
        { pricingMode: "FIXED", priceCents: 1000, suggestedPriceCents: null },
        { pricingMode: "PWYW", priceCents: 300, suggestedPriceCents: 600 },
        { pricingMode: "FREE", priceCents: 0, suggestedPriceCents: null },
      ],
      25,
    );
    expect(r).toEqual({ fullCents: 1600, priceCents: 1200 });
  });
});
