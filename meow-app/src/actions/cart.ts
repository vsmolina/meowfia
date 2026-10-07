"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCart, getCartCount, resolveCoupon } from "@/lib/cart";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership, isAvailableTo } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";
import { emailField, firstError, optionalText } from "@/lib/validation";

export type CartActionResult = { ok: boolean; error?: string; count?: number; message?: string };

const license = z.enum(["PERSONAL", "COMMERCIAL", "CLASSROOM"]).default("PERSONAL");
const MAX_QTY = 20;
const MAX_LINES = 50;

async function done(message?: string): Promise<CartActionResult> {
  revalidatePath("/", "layout");
  return { ok: true, count: await getCartCount(), message };
}

async function cartWithRoom() {
  const cart = await getCart({ create: true });
  if (!cart) throw new Error("Could not create cart");
  if (cart.items.length >= MAX_LINES) throw new Error("Your cart is full. Check out first!");
  return cart;
}

export async function addTemplateToCart(input: { templateId: string; license?: string; customPriceCents?: number | null }): Promise<CartActionResult> {
  const parsed = z
    .object({ templateId: z.string().cuid(), license, customPriceCents: z.number().int().min(0).max(100_000).nullish() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { templateId, customPriceCents } = parsed.data;
  const t = await db.template.findUnique({ where: { id: templateId } });
  const user = await getSessionUser();
  const m = await getActiveMembership(user?.id);
  if (!t || !isAvailableTo(t, m?.tier)) return { ok: false, error: "That template isn't available yet." };
  if (t.pricingMode === "FREE" && parsed.data.license === "PERSONAL") return { ok: false, error: "This one's free. Claim it instead!" };
  if (t.pricingMode === "PWYW" && customPriceCents != null && customPriceCents < t.priceCents) {
    return { ok: false, error: `The minimum for this template is $${(t.priceCents / 100).toFixed(2)}.` };
  }
  try {
    const cart = await cartWithRoom();
    const existing = cart.items.find((i) => i.kind === "TEMPLATE" && i.templateId === t.id);
    const data = { license: parsed.data.license, customPriceCents: t.pricingMode === "PWYW" ? (customPriceCents ?? t.suggestedPriceCents ?? t.priceCents) : null };
    if (existing) await db.cartItem.update({ where: { id: existing.id }, data });
    else await db.cartItem.create({ data: { cartId: cart.id, kind: "TEMPLATE", templateId: t.id, ...data } });
    return done(existing ? "Cart updated" : `${t.name} added to cart`);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add to cart" };
  }
}

export async function addBundleToCart(input: { bundleId: string; license?: string }): Promise<CartActionResult> {
  const parsed = z.object({ bundleId: z.string().cuid(), license }).safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const b = await db.bundle.findFirst({ where: { id: parsed.data.bundleId, active: true }, include: { items: true } });
  if (!b) return { ok: false, error: "Bundle not found" };
  try {
    const cart = await cartWithRoom();
    // A bundle replaces any of its templates already in the cart individually
    const ids = b.items.map((i) => i.templateId);
    await db.cartItem.deleteMany({ where: { cartId: cart.id, kind: "TEMPLATE", templateId: { in: ids } } });
    const existing = cart.items.find((i) => i.kind === "BUNDLE" && i.bundleId === b.id);
    if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { license: parsed.data.license } });
    else await db.cartItem.create({ data: { cartId: cart.id, kind: "BUNDLE", bundleId: b.id, license: parsed.data.license } });
    return done(`${b.name} bundle added`);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add to cart" };
  }
}

export async function addVariantToCart(input: { variantId: string; quantity?: number; isOrderBump?: boolean }): Promise<CartActionResult> {
  const parsed = z.object({ variantId: z.string().cuid(), quantity: z.number().int().min(1).max(MAX_QTY).default(1), isOrderBump: z.boolean().optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const v = await db.productVariant.findUnique({ where: { id: parsed.data.variantId }, include: { product: true } });
  if (!v || !v.product.active) return { ok: false, error: "Product not available" };
  try {
    const cart = await cartWithRoom();
    const existing = cart.items.find((i) => i.kind === "PRODUCT" && i.variantId === v.id);
    const qty = Math.min(MAX_QTY, (existing?.quantity ?? 0) + parsed.data.quantity);
    if (v.inventory != null && qty > v.inventory) {
      return { ok: false, error: v.inventory === 0 ? "Sold out. Check back soon!" : `Only ${v.inventory} left in stock.` };
    }
    if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: qty } });
    else await db.cartItem.create({ data: { cartId: cart.id, kind: "PRODUCT", variantId: v.id, quantity: qty, isOrderBump: Boolean(parsed.data.isOrderBump) } });
    return done(`${v.product.name} added to cart`);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add to cart" };
  }
}

const giftSchema = z.object({
  amountCents: z.coerce.number().int().min(500, "Gift cards start at $5").max(50_000, "Gift cards max out at $500"),
  recipientEmail: emailField,
  recipientName: optionalText(60),
  message: optionalText(300),
});

export async function addGiftCardToCart(_prev: CartActionResult, formData: FormData): Promise<CartActionResult> {
  const raw = Object.fromEntries(formData);
  const amount = raw.customAmount ? Math.round(parseFloat(String(raw.customAmount)) * 100) : Number(raw.amountCents);
  const parsed = giftSchema.safeParse({ ...raw, amountCents: amount });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  try {
    const cart = await cartWithRoom();
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        kind: "GIFT_CARD",
        customPriceCents: parsed.data.amountCents,
        giftRecipientEmail: parsed.data.recipientEmail,
        giftRecipientName: parsed.data.recipientName,
        giftMessage: parsed.data.message,
      },
    });
    return done("Gift card added to cart");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add to cart" };
  }
}

/** Ensure the item belongs to the current visitor's cart */
async function ownItem(itemId: string) {
  const cart = await getCart();
  return cart?.items.find((i) => i.id === itemId) ? cart : null;
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<CartActionResult> {
  const q = z.number().int().min(0).max(MAX_QTY).safeParse(quantity);
  if (!q.success) return { ok: false, error: "Invalid quantity" };
  const cart = await ownItem(itemId);
  if (!cart) return { ok: false, error: "Item not found" };
  const item = cart.items.find((i) => i.id === itemId)!;
  if (q.data === 0) await db.cartItem.delete({ where: { id: itemId } });
  else {
    if (item.kind !== "PRODUCT") return { ok: false, error: "Quantity is fixed for digital items" };
    if (item.variant?.inventory != null && q.data > item.variant.inventory) return { ok: false, error: `Only ${item.variant.inventory} left in stock.` };
    await db.cartItem.update({ where: { id: itemId }, data: { quantity: q.data } });
  }
  return done();
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  return updateCartItemQuantity(itemId, 0);
}

export async function updatePwywPrice(itemId: string, cents: number): Promise<CartActionResult> {
  const cart = await ownItem(itemId);
  if (!cart) return { ok: false, error: "Item not found" };
  const item = cart.items.find((i) => i.id === itemId)!;
  if (!item.template || item.template.pricingMode !== "PWYW") return { ok: false, error: "Not a pay-what-you-want item" };
  if (!Number.isInteger(cents) || cents < item.template.priceCents || cents > 100_000) {
    return { ok: false, error: `Enter at least $${(item.template.priceCents / 100).toFixed(2)}` };
  }
  await db.cartItem.update({ where: { id: itemId }, data: { customPriceCents: cents } });
  return done();
}

export async function setItemLicense(itemId: string, value: string): Promise<CartActionResult> {
  const l = license.safeParse(value);
  if (!l.success) return { ok: false, error: "Invalid license" };
  const cart = await ownItem(itemId);
  if (!cart) return { ok: false, error: "Item not found" };
  await db.cartItem.update({ where: { id: itemId }, data: { license: l.data } });
  return done();
}

export async function applyCouponAction(_prev: CartActionResult, formData: FormData): Promise<CartActionResult> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase().slice(0, 40);
  if (!code) return { ok: false, error: "Enter a code" };
  const limited = await checkRateLimit("form", "coupon");
  if (limited) return { ok: false, error: limited };
  const cart = await getCart({ create: true });
  const user = await getSessionUser();
  const { error } = await resolveCoupon(code, user?.email ?? cart?.email);
  if (error) return { ok: false, error };
  await db.cart.update({ where: { id: cart!.id }, data: { couponCode: code } });
  return done(`Code ${code} applied`);
}

export async function removeCouponAction(): Promise<CartActionResult> {
  const cart = await getCart();
  if (cart) await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  return done();
}

export async function applyGiftCardAction(_prev: CartActionResult, formData: FormData): Promise<CartActionResult> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase().slice(0, 40);
  const limited = await checkRateLimit("form", "giftcard");
  if (limited) return { ok: false, error: limited };
  const gc = code ? await db.giftCard.findUnique({ where: { code } }) : null;
  if (!gc || gc.balanceCents <= 0) return { ok: false, error: "That gift card code isn't valid or has no balance." };
  const cart = await getCart({ create: true });
  await db.cart.update({ where: { id: cart!.id }, data: { giftCardCode: code } });
  return done(`Gift card applied ($${(gc.balanceCents / 100).toFixed(2)} available)`);
}

export async function removeGiftCardAction(): Promise<CartActionResult> {
  const cart = await getCart();
  if (cart) await db.cart.update({ where: { id: cart.id }, data: { giftCardCode: null } });
  return done();
}

export async function setShippingRateAction(rateId: string): Promise<CartActionResult> {
  const rate = await db.shippingRate.findFirst({ where: { id: rateId, active: true } });
  if (!rate) return { ok: false, error: "Invalid shipping option" };
  const cart = await getCart();
  if (cart) await db.cart.update({ where: { id: cart.id }, data: { shippingRateId: rate.id } });
  return done();
}

/** The checkout order bump (e.g. sticker pack) */
export async function toggleOrderBumpAction(add: boolean): Promise<CartActionResult> {
  const product = await db.product.findUnique({ where: { slug: siteConfig.commerce.orderBump.productSlug }, include: { variants: true } });
  const variant = product?.variants[0];
  if (!variant) return { ok: false, error: "Offer unavailable" };
  if (add) return addVariantToCart({ variantId: variant.id, quantity: 1, isOrderBump: true });
  const cart = await getCart();
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId: variant.id } });
  return done();
}
