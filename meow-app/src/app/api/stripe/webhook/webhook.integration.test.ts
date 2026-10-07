/**
 * Stripe webhook: signature verification + fulfillment + idempotency.
 * Uses fake test keys (never contacts Stripe) and a throwaway SQLite DB.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "meowfia-wh-"));
const DB_URL = `file:${join(dir, "test.db")}`;
const WH_SECRET = "whsec_test_secret";
Object.assign(process.env, { DATABASE_URL: DB_URL, STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: WH_SECRET, LOCAL_STORAGE_DIR: join(dir, "storage") });

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ ok: true, provider: "console" })) }));
vi.mock("@/lib/auth-helpers", () => ({ getSessionUser: async () => null }));

let db: typeof import("@/lib/db").db;
let POST: typeof import("./route").POST;

beforeAll(async () => {
  execSync("npx prisma db push", { env: { ...process.env }, stdio: "ignore" });
  db = (await import("@/lib/db")).db;
  POST = (await import("./route")).POST;
}, 60_000);

afterAll(async () => {
  await db?.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

function signedRequest(event: object, secret = WH_SECRET) {
  const payload = JSON.stringify(event);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": header } });
}

describe("stripe webhook", () => {
  it("rejects requests with a bad signature", async () => {
    const res = await POST(signedRequest({ id: "evt_bad", type: "checkout.session.completed", data: { object: {} } }, "whsec_wrong"));
    expect(res.status).toBe(400);
  });

  it("fulfills a paid checkout once, even if Stripe retries the event", async () => {
    const tpl = await db.template.create({
      data: { slug: "w", name: "Webhook Tank", tagline: "t", description: "d", vehicleType: "TANK", difficulty: "RECRUIT", catSize: "KITTEN", buildTimeMinutes: 10, materials: [], pricingMode: "FIXED", priceCents: 900, coverImageKey: "x.png", imageKeys: [] },
    });
    const order = await db.order.create({
      data: { number: 5001, email: "wh@example.com", subtotalCents: 900, totalCents: 900, items: { create: [{ kind: "TEMPLATE", channel: "TEMPLATES", name: tpl.name, templateId: tpl.id, quantity: 1, unitPriceCents: 900, totalCents: 900 }] } },
    });
    const event = {
      id: "evt_paid_1",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_1", object: "checkout.session", mode: "payment", payment_status: "paid", payment_intent: "pi_test_1", metadata: { kind: "order", orderId: order.id }, collected_information: null } },
    };
    expect((await POST(signedRequest(event))).status).toBe(200);
    const dup = await POST(signedRequest(event));
    expect(await dup.json()).toMatchObject({ duplicate: true });

    const paid = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("PAID");
    expect(paid.stripePaymentIntentId).toBe("pi_test_1");
    expect(await db.entitlement.count({ where: { email: "wh@example.com", templateId: tpl.id } })).toBe(1);
    expect(await db.revenueEvent.count({ where: { orderId: order.id } })).toBe(1);
  }, 30_000);
});
