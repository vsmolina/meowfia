import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { publicUrl } from "@/lib/media";
import { slugify } from "@/lib/format";
import { listSyncProducts } from "@/lib/printful";
import { toPricingLines } from "@/lib/cart";
import { cartRecoveryUrl, oneClickUnsubscribeUrl, segmentRecipients, sendMarketingEmail, sendToMany, unsubscribeUrl } from "@/lib/marketing";
import { WelcomeEmail, WELCOME_SERIES } from "@/emails/welcome";
import { DropAnnouncementEmail } from "@/emails/drop-announcement";
import { AbandonedCartEmail } from "@/emails/abandoned-cart";
import { BroadcastEmail } from "@/emails/broadcast";

/**
 * Scheduled jobs. Run by Vercel Cron via /api/cron/[job] (see vercel.json),
 * or manually from Admin → Jobs. All jobs are idempotent.
 */
const absolute = (key: string) => {
  const u = publicUrl(key);
  return u.startsWith("http") ? u : siteUrl(u);
};

/** 1) Members early-access emails, 2) public drop announcements */
export async function runDropsJob(now = new Date()) {
  let early = 0;
  let announced = 0;

  // Early access windows that have opened
  const earlyTemplates = await db.template.findMany({ where: { status: "PUBLISHED", earlyAccessHours: { gt: 0 }, earlyAccessNotifiedAt: null, releaseAt: { gt: now } } });
  for (const t of earlyTemplates) {
    if (t.releaseAt!.getTime() - t.earlyAccessHours * 3_600_000 > now.getTime()) continue;
    await db.template.update({ where: { id: t.id }, data: { earlyAccessNotifiedAt: now } });
    const members = await segmentRecipients("MEMBERS");
    early += await sendToMany(members, (s) =>
      sendMarketingEmail(s, `🎖️ Members: ${t.name} is yours ${t.earlyAccessHours}h early`, "drop-early-access", (unsub) =>
        DropAnnouncementEmail({ name: t.name, tagline: t.tagline, imageUrl: absolute(t.coverImageKey), url: siteUrl(`/fleet/${t.slug}`), early: true, unsubscribeUrl: unsub }),
      ),
    );
  }

  // Released, not yet announced
  const released = await db.template.findMany({ where: { status: "PUBLISHED", dropAnnouncedAt: null, releaseAt: { lte: now } } });
  for (const t of released) {
    // Claim first so overlapping cron runs can't double-send
    const claim = await db.template.updateMany({ where: { id: t.id, dropAnnouncedAt: null }, data: { dropAnnouncedAt: now } });
    if (!claim.count) continue;
    const notifyList = await db.dropNotify.findMany({ where: { templateId: t.id, notifiedAt: null } });
    const subs = await segmentRecipients("ALL");
    const subByEmail = new Map(subs.map((s) => [s.email, s]));
    // Everyone who asked to be notified + all newsletter subscribers, deduplicated
    const emails = [...new Set([...notifyList.map((n) => n.email), ...subs.map((s) => s.email)])];
    announced += await sendToMany(emails, async (email) => {
      const sub = subByEmail.get(email);
      const react = (unsub?: string) => DropAnnouncementEmail({ name: t.name, tagline: t.tagline, imageUrl: absolute(t.coverImageKey), url: siteUrl(`/fleet/${t.slug}`), unsubscribeUrl: unsub });
      const subject = `🚨 ${t.name} just deployed`;
      if (sub) await sendMarketingEmail(sub, subject, "drop-announcement", (u) => react(u));
      else await sendEmail({ to: email, subject, template: "drop-announcement", react: react() });
    });
    await db.dropNotify.updateMany({ where: { templateId: t.id, notifiedAt: null }, data: { notifiedAt: now } });
  }
  return { earlyAccessEmails: early, announcementEmails: announced };
}

/** Welcome series steps 1+ (step 0 is sent at signup) */
export async function runWelcomeJob(now = new Date()) {
  const due = await db.subscriber.findMany({ where: { status: "SUBSCRIBED", welcomeNextAt: { lte: now }, welcomeStep: { gte: 1, lt: WELCOME_SERIES.length } }, take: 500 });
  let sent = 0;
  for (const s of due) {
    const step = s.welcomeStep;
    const next = WELCOME_SERIES[step + 1];
    // Advance first (idempotent under retries), then send
    const claim = await db.subscriber.updateMany({
      where: { id: s.id, welcomeStep: step },
      data: { welcomeStep: step + 1, welcomeNextAt: next ? new Date(s.createdAt.getTime() + next.delayDays * 86_400_000) : null },
    });
    if (!claim.count) continue;
    const r = await sendMarketingEmail(s, step === 1 ? "Field Manual, Chapter 1: build tips" : "Ready for a real vehicle?", `welcome-${step}`, (unsub) =>
      WelcomeEmail({ step, name: s.name, siteUrl: siteUrl(), unsubscribeUrl: unsub }),
    );
    if (r.ok) sent++;
  }
  return { welcomeEmails: sent };
}

/** One reminder per cart: has an email + items, idle 1h–3 days, not converted */
export async function runAbandonedCartJob(now = new Date()) {
  const carts = await db.cart.findMany({
    where: {
      email: { not: null },
      convertedAt: null,
      abandonedEmailSentAt: null,
      updatedAt: { lte: new Date(now.getTime() - 3_600_000), gte: new Date(now.getTime() - 3 * 86_400_000) },
      items: { some: {} },
    },
    include: { items: { include: { template: true, bundle: { include: { items: { include: { template: true } } } }, variant: { include: { product: true } } } } },
    take: 200,
  });
  let sent = 0;
  for (const cart of carts) {
    const email = cart.email!;
    // Respect unsubscribes, and skip if they've since bought
    const sub = await db.subscriber.findUnique({ where: { email } });
    if (sub?.status === "UNSUBSCRIBED") continue;
    const recentOrder = await db.order.findFirst({ where: { email, status: "PAID", paidAt: { gte: cart.updatedAt } } });
    await db.cart.update({ where: { id: cart.id }, data: { abandonedEmailSentAt: now } });
    if (recentOrder) continue;
    const items = toPricingLines(cart).map((l) => ({ name: l.name, priceCents: (l.unitPriceCents + (l.licenseUpgradeCents ?? 0)) * l.quantity }));
    await sendEmail({
      to: email,
      subject: "Your supply crate is waiting 📦",
      template: "abandoned-cart",
      react: AbandonedCartEmail({ items, recoverUrl: cartRecoveryUrl(cart.id), unsubscribeUrl: sub ? unsubscribeUrl(sub) : undefined }),
      headers: sub ? { "List-Unsubscribe": `<${oneClickUnsubscribeUrl(sub)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
    });
    sent++;
  }
  return { abandonedCartEmails: sent };
}

/** Pull Printful sync products into the shop. New products arrive inactive for review. */
export async function runPrintfulSyncJob() {
  const products = await listSyncProducts();
  let created = 0;
  let updated = 0;
  for (const p of products) {
    const existing = await db.product.findFirst({ where: { printfulProductId: p.id } });
    const base = Math.min(...p.variants.map((v) => v.retailPriceCents));
    const product =
      existing ??
      (await db.product.create({
        data: {
          slug: `${slugify(p.name)}-${p.id.slice(-4)}`,
          name: p.name,
          description: "Printed on demand. Edit this description in Admin → Products.",
          type: "MERCH",
          category: "Apparel",
          imageKeys: [p.thumbnailUrl ?? "/placeholder.png"],
          priceCents: base,
          printfulProductId: p.id,
          active: false,
        },
      }));
    if (existing) {
      await db.product.update({ where: { id: existing.id }, data: { priceCents: base } });
      updated++;
    } else created++;
    for (const v of p.variants) {
      await db.productVariant.upsert({
        where: { sku: v.sku },
        create: { productId: product.id, name: v.name, sku: v.sku, priceCents: v.retailPriceCents === base ? null : v.retailPriceCents, inventory: null, printfulVariantId: v.id },
        update: { name: v.name, priceCents: v.retailPriceCents === base ? null : v.retailPriceCents, printfulVariantId: v.id },
      });
    }
  }
  return { printfulCreated: created, printfulUpdated: updated };
}

/** Send a saved broadcast to its segment (marks SENT first to prevent double sends) */
export async function sendBroadcast(id: string) {
  const claim = await db.broadcast.updateMany({ where: { id, status: "DRAFT" }, data: { status: "SENT", sentAt: new Date() } });
  if (!claim.count) throw new Error("Broadcast already sent");
  const b = await db.broadcast.findUniqueOrThrow({ where: { id } });
  const recipients = await segmentRecipients(b.segment);
  const sent = await sendToMany(recipients, (s) =>
    sendMarketingEmail(s, b.subject, "broadcast", (unsub) => BroadcastEmail({ subject: b.subject, previewText: b.previewText, body: b.body, unsubscribeUrl: unsub })),
  );
  await db.broadcast.update({ where: { id }, data: { recipientCount: sent } });
  return { sent };
}

export const JOBS = {
  drops: runDropsJob,
  welcome: runWelcomeJob,
  "abandoned-carts": runAbandonedCartJob,
  "printful-sync": runPrintfulSyncJob,
} as const;
export type JobName = keyof typeof JOBS;
