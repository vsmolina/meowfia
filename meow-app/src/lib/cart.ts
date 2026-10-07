import "server-only";
import { cookies } from "next/headers";
import { db, type License, type Prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership, tierConfig } from "@/lib/access";
import { bundlePriceCents, priceCart, type PricingLine, type PricingResult, type PricingCoupon } from "@/lib/pricing";
import { siteConfig } from "@/config/site";

export const CART_COOKIE = "mf_cart";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      template: true,
      bundle: { include: { items: { include: { template: true } } } },
      variant: { include: { product: true } },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

/**
 * Finds the active cart: the signed-in user's cart, else the guest cart from the cookie.
 * On sign-in, a guest cart is merged into the user's cart. With `create`, a cart is created
 * (and the cookie set), which only works inside Server Actions / Route Handlers.
 */
export async function getCart({ create = false } = {}): Promise<CartWithItems | null> {
  const jar = await cookies();
  const cookieId = jar.get(CART_COOKIE)?.value;
  const user = await getSessionUser();
  const guest = cookieId ? await db.cart.findFirst({ where: { id: cookieId, convertedAt: null }, include: cartInclude }) : null;

  if (user) {
    let mine = await db.cart.findFirst({ where: { userId: user.id, convertedAt: null }, orderBy: { updatedAt: "desc" }, include: cartInclude });
    if (guest && guest.userId !== user.id) {
      if (!guest.userId && mine && guest.id !== mine.id) {
        // Merge guest items into the user's cart
        await db.cartItem.updateMany({ where: { cartId: guest.id }, data: { cartId: mine.id } });
        await db.cart.delete({ where: { id: guest.id } });
        mine = await db.cart.findUniqueOrThrow({ where: { id: mine.id }, include: cartInclude });
      } else if (!guest.userId && !mine) {
        mine = await db.cart.update({ where: { id: guest.id }, data: { userId: user.id, email: user.email }, include: cartInclude });
      }
    }
    if (!mine && create) {
      mine = await db.cart.create({ data: { userId: user.id, email: user.email }, include: cartInclude });
    }
    if (mine && cookieId !== mine.id) trySetCookie(jar, mine.id);
    return mine;
  }

  if (guest && !guest.userId) return guest;
  if (!create) return null;
  const cart = await db.cart.create({ data: {}, include: cartInclude });
  trySetCookie(jar, cart.id);
  return cart;
}

function trySetCookie(jar: Awaited<ReturnType<typeof cookies>>, id: string) {
  try {
    jar.set(CART_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60, secure: process.env.NODE_ENV === "production" });
  } catch {
    /* Server Components can't set cookies. Fine, the next action will. */
  }
}

export async function getCartCount(): Promise<number> {
  const jar = await cookies();
  const user = await getSessionUser();
  const cookieId = jar.get(CART_COOKIE)?.value;
  if (!user && !cookieId) return 0;
  const agg = await db.cartItem.aggregate({
    where: { cart: { convertedAt: null, OR: [...(user ? [{ userId: user.id }] : []), ...(cookieId ? [{ id: cookieId }] : [])] } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

function licenseUpgrade(t: { commercialUpgradeCents: number; classroomUpgradeCents: number }, license: License) {
  return license === "COMMERCIAL" ? t.commercialUpgradeCents : license === "CLASSROOM" ? t.classroomUpgradeCents : 0;
}

/** Turn DB cart items into pricing-engine lines */
export function toPricingLines(cart: CartWithItems, ownedTemplateIds: Set<string> = new Set()): PricingLine[] {
  return cart.items.flatMap<PricingLine>((i) => {
    if (i.kind === "TEMPLATE" && i.template) {
      const t = i.template;
      // Already-owned template + higher license = upgrade-only line
      const owned = ownedTemplateIds.has(t.id);
      const base = owned ? 0 : t.pricingMode === "FREE" ? 0 : t.pricingMode === "PWYW" ? Math.max(t.priceCents, i.customPriceCents ?? t.suggestedPriceCents ?? t.priceCents) : t.priceCents;
      return [{ id: i.id, kind: "TEMPLATE", channel: "TEMPLATES", name: owned ? `${t.name} (license upgrade)` : t.name, quantity: 1, unitPriceCents: base, licenseUpgradeCents: licenseUpgrade(t, i.license), templateId: t.id }];
    }
    if (i.kind === "BUNDLE" && i.bundle) {
      const ts = i.bundle.items.map((bi) => bi.template);
      const { priceCents } = bundlePriceCents(ts, i.bundle.discountPercent);
      const upgrade = ts.reduce((a, t) => a + licenseUpgrade(t, i.license), 0);
      return [{ id: i.id, kind: "BUNDLE", channel: "TEMPLATES", name: `${i.bundle.name} bundle`, quantity: 1, unitPriceCents: priceCents, licenseUpgradeCents: upgrade }];
    }
    if (i.kind === "PRODUCT" && i.variant) {
      const p = i.variant.product;
      return [{ id: i.id, kind: "PRODUCT", channel: p.type === "KIT" ? "KITS" : "MERCH", name: `${p.name}${p.type === "MERCH" || i.variant.name !== "Standard" ? ` (${i.variant.name})` : ""}`, quantity: i.quantity, unitPriceCents: i.variant.priceCents ?? p.priceCents, shippable: true, memberDiscountEligible: true }];
    }
    if (i.kind === "GIFT_CARD" && i.customPriceCents) {
      return [{ id: i.id, kind: "GIFT_CARD", channel: "GIFT_CARDS", name: `Gift card for ${i.giftRecipientName || i.giftRecipientEmail}`, quantity: 1, unitPriceCents: i.customPriceCents }];
    }
    return [];
  });
}

/** Validate a coupon code for this customer. Returns the coupon or an error message. */
export async function resolveCoupon(code: string | null | undefined, email: string | null | undefined): Promise<{ coupon: (PricingCoupon & { id: string }) | null; error?: string }> {
  if (!code) return { coupon: null };
  const c = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!c || !c.active) return { coupon: null, error: "That code isn't valid." };
  if (c.expiresAt && c.expiresAt < new Date()) return { coupon: null, error: "That code has expired." };
  if (c.maxRedemptions != null && c.redemptions >= c.maxRedemptions) return { coupon: null, error: "That code has been fully redeemed." };
  // The referral welcome code is for first orders only
  if (c.code === siteConfig.commerce.referral.newCustomerCouponCode && email) {
    const prior = await db.order.count({ where: { email: email.toLowerCase(), status: "PAID" } });
    if (prior > 0) return { coupon: null, error: "That code is for first orders only." };
  }
  return { coupon: { id: c.id, code: c.code, percentOff: c.percentOff, amountOffCents: c.amountOffCents, minSubtotalCents: c.minSubtotalCents } };
}

export type CartView = {
  cart: CartWithItems | null;
  pricing: PricingResult;
  couponError?: string;
  giftCardError?: string;
  memberDiscountPercent: number;
  storeCreditCents: number;
  shippingRates: { id: string; name: string; priceCents: number; minDays: number; maxDays: number; freeOverCents: number | null }[];
  selectedShippingRateId: string | null;
  ownedTemplateIds: Set<string>;
};

/** Everything the cart page and checkout need, priced consistently */
export async function loadCartView(cart?: CartWithItems | null): Promise<CartView> {
  cart = cart === undefined ? await getCart() : cart;
  const user = await getSessionUser();
  const [membership, profile, bundles, shippingRates] = await Promise.all([
    getActiveMembership(user?.id),
    user ? db.user.findUnique({ where: { id: user.id }, select: { storeCreditCents: true } }) : null,
    db.bundle.findMany({ where: { active: true }, include: { items: { select: { templateId: true } } } }),
    db.shippingRate.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const email = user?.email ?? cart?.email ?? null;
  const owned = email
    ? new Set((await db.entitlement.findMany({ where: { OR: [{ email }, ...(user ? [{ userId: user.id }] : [])] }, select: { templateId: true } })).map((e) => e.templateId))
    : new Set<string>();

  const { coupon, error: couponError } = await resolveCoupon(cart?.couponCode, email);
  let giftCardBalanceCents = 0;
  let giftCardError: string | undefined;
  if (cart?.giftCardCode) {
    const gc = await db.giftCard.findUnique({ where: { code: cart.giftCardCode } });
    if (!gc || gc.balanceCents <= 0) giftCardError = "That gift card has no balance.";
    else giftCardBalanceCents = gc.balanceCents;
  }
  const memberDiscountPercent = membership ? tierConfig(membership.tier).shopDiscountPercent : 0;
  const selected = shippingRates.find((r) => r.id === cart?.shippingRateId) ?? shippingRates[0] ?? null;

  const pricing = priceCart({
    lines: cart ? toPricingLines(cart, owned) : [],
    bundles: bundles.map((b) => ({ id: b.id, name: b.name, discountPercent: b.discountPercent, templateIds: b.items.map((i) => i.templateId) })),
    coupon,
    memberDiscountPercent,
    shippingRate: selected,
    storeCreditCents: profile?.storeCreditCents ?? 0,
    giftCardBalanceCents,
  });

  return {
    cart,
    pricing,
    couponError: couponError ?? pricing.couponError,
    giftCardError,
    memberDiscountPercent,
    storeCreditCents: profile?.storeCreditCents ?? 0,
    shippingRates,
    selectedShippingRateId: selected?.id ?? null,
    ownedTemplateIds: owned,
  };
}
