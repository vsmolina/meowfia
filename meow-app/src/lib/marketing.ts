import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ReactElement } from "react";
import { db, type Segment, type Subscriber } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { signingSecret } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";

/**
 * Newsletter segments:
 *  ALL      every subscribed address
 *  FREE     subscribers who have never paid and aren't members
 *  BUYERS   subscribers with at least one paid order
 *  MEMBERS  subscribers whose account has an active membership
 */
export async function segmentRecipients(segment: Segment): Promise<Subscriber[]> {
  const subs = await db.subscriber.findMany({ where: { status: "SUBSCRIBED" }, orderBy: { createdAt: "asc" } });
  if (segment === "ALL") return subs;
  const now = new Date();
  const [buyerRows, memberRows] = await Promise.all([
    db.order.findMany({ where: { status: "PAID" }, select: { email: true }, distinct: ["email"] }),
    db.membership.findMany({ where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] }, currentPeriodEnd: { gt: now } }, select: { user: { select: { email: true } } } }),
  ]);
  const buyers = new Set(buyerRows.map((r) => r.email.toLowerCase()));
  const members = new Set(memberRows.map((r) => r.user.email.toLowerCase()));
  if (segment === "BUYERS") return subs.filter((s) => buyers.has(s.email));
  if (segment === "MEMBERS") return subs.filter((s) => members.has(s.email));
  return subs.filter((s) => !buyers.has(s.email) && !members.has(s.email));
}

export async function segmentCounts() {
  const entries = await Promise.all((["ALL", "FREE", "BUYERS", "MEMBERS"] as const).map(async (s) => [s, (await segmentRecipients(s)).length] as const));
  return Object.fromEntries(entries) as Record<Segment, number>;
}

export const unsubscribeUrl = (s: Pick<Subscriber, "unsubscribeToken">) => siteUrl(`/unsubscribe/${s.unsubscribeToken}`);
export const oneClickUnsubscribeUrl = (s: Pick<Subscriber, "unsubscribeToken">) => siteUrl(`/api/unsubscribe/${s.unsubscribeToken}`);

/** Marketing email: adds the unsubscribe link and RFC 8058 one-click List-Unsubscribe headers */
export async function sendMarketingEmail(sub: Pick<Subscriber, "email" | "unsubscribeToken">, subject: string, template: string, react: (unsubscribe: string) => ReactElement) {
  const unsub = unsubscribeUrl(sub);
  return sendEmail({
    to: sub.email,
    subject,
    template,
    react: react(unsub),
    headers: { "List-Unsubscribe": `<${oneClickUnsubscribeUrl(sub)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}

/** Send to many recipients with modest concurrency (Resend free tier allows ~2 req/s; paid more) */
export async function sendToMany<T>(items: T[], send: (item: T) => Promise<unknown>, concurrency = 4) {
  let sent = 0;
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        await send(item);
        sent++;
      } catch (e) {
        console.error("[marketing] send failed", e);
      }
    }
  });
  await Promise.all(workers);
  return sent;
}

// ── Signed cart-recovery links (abandoned cart emails) ──

function sig(cartId: string) {
  return createHmac("sha256", signingSecret()).update(`cart:${cartId}`).digest("base64url").slice(0, 32);
}
export function cartRecoveryUrl(cartId: string) {
  return siteUrl(`/cart/recover?c=${cartId}&s=${sig(cartId)}`);
}
export function verifyCartRecovery(cartId: string, s: string) {
  const a = Buffer.from(sig(cartId));
  const b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
}
