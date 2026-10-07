/**
 * Integration test for the money path: cart → pending order → fulfillOrder.
 * Runs against a throwaway SQLite database (no network, no Stripe).
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "meowfia-test-"));
const DB_URL = `file:${join(dir, "test.db")}`;
process.env.DATABASE_URL = DB_URL;
process.env.LOCAL_STORAGE_DIR = join(dir, "storage");

const sent: { to: string | string[]; template: string }[] = [];
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async (a: { to: string; template: string }) => (sent.push(a), { ok: true, provider: "console" })) }));
vi.mock("@/lib/auth-helpers", () => ({ getSessionUser: async () => null }));
vi.mock("@/lib/printful", () => ({ createPrintfulOrder: vi.fn(async () => ({ id: "pf-test", mock: true })) }));

type Db = typeof import("@/lib/db").db;
let db: Db;

beforeAll(async () => {
  execSync("npx prisma db push", { env: { ...process.env, DATABASE_URL: DB_URL }, stdio: "ignore" });
  db = (await import("@/lib/db")).db;
}, 60_000);

afterAll(async () => {
  await db?.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

describe("fulfillOrder", () => {
  it("delivers templates, decrements stock, books revenue, credits the referrer, and is idempotent", async () => {
    const { createPendingOrder, fulfillOrder } = await import("@/lib/orders");
    const { toPricingLines } = await import("@/lib/cart");
    const { priceCart } = await import("@/lib/pricing");

    const referrer = await db.user.create({ data: { email: "ref@example.com" } });
    const tpl = await db.template.create({
      data: { slug: "t", name: "Test Tank", tagline: "t", description: "d", vehicleType: "TANK", difficulty: "RECRUIT", catSize: "KITTEN", buildTimeMinutes: 10, materials: [], pricingMode: "FIXED", priceCents: 1000, coverImageKey: "x.png", imageKeys: [] },
    });
    const product = await db.product.create({ data: { slug: "k", name: "Kit", description: "d", type: "KIT", category: "Kits", imageKeys: [], priceCents: 3000, variants: { create: [{ name: "Std", sku: "K-1", inventory: 5 }] } }, include: { variants: true } });
    const rate = await db.shippingRate.create({ data: { name: "Std", priceCents: 500, minDays: 1, maxDays: 2 } });
    const cart = await db.cart.create({
      data: {
        email: "buyer@example.com",
        items: { create: [{ kind: "TEMPLATE", templateId: tpl.id, license: "COMMERCIAL" }, { kind: "PRODUCT", variantId: product.variants[0].id, quantity: 2 }] },
      },
      include: { items: { include: { template: true, bundle: { include: { items: { include: { template: true } } } }, variant: { include: { product: true } } } } },
    });

    const pricing = priceCart({ lines: toPricingLines(cart), shippingRate: rate });
    expect(pricing.totalCents).toBe(1000 + 1500 + 6000 + 500);

    const view = { cart, pricing, memberDiscountPercent: 0, storeCreditCents: 0, shippingRates: [rate], selectedShippingRateId: rate.id, ownedTemplateIds: new Set<string>() };
    const order = await createPendingOrder(view, { email: "buyer@example.com", userId: null, referrerId: referrer.id, couponId: null });
    expect(order.status).toBe("PENDING");

    const first = await fulfillOrder(order.id, { stripePaymentIntentId: "pi_test", shippingAddress: { name: "B", line1: "1 St", city: "C", country: "US", postal_code: "1" } });
    expect(first.alreadyFulfilled).toBe(false);
    const second = await fulfillOrder(order.id);
    expect(second.alreadyFulfilled).toBe(true);

    const ent = await db.entitlement.findUniqueOrThrow({ where: { email_templateId: { email: "buyer@example.com", templateId: tpl.id } } });
    expect(ent.license).toBe("COMMERCIAL");
    expect((await db.productVariant.findUniqueOrThrow({ where: { sku: "K-1" } })).inventory).toBe(3);

    const revenue = await db.revenueEvent.findMany({ where: { orderId: order.id } });
    expect(revenue.reduce((a, r) => a + r.amountCents, 0)).toBe(pricing.totalCents);
    expect(new Set(revenue.map((r) => r.channel))).toEqual(new Set(["TEMPLATES", "KITS"]));

    const conv = await db.referralConversion.findUniqueOrThrow({ where: { orderId: order.id } });
    expect(conv.rewardCents).toBe(Math.round(pricing.totalCents * 0.1));
    expect((await db.user.findUniqueOrThrow({ where: { id: referrer.id } })).storeCreditCents).toBe(conv.rewardCents);

    expect(sent.filter((s) => s.template === "receipt")).toHaveLength(1);
    expect((await db.cart.findUniqueOrThrow({ where: { id: cart.id } })).convertedAt).not.toBeNull();
  }, 30_000);
});
