import "server-only";
import { cache } from "react";
import { db, type MembershipTier, type Template } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { grantEntitlement } from "@/lib/entitlements";

export const TIER_RANK: Record<MembershipTier, number> = { RECRUIT: 1, OFFICER: 2, COMMANDER: 3 };

export function tierConfig(tier: MembershipTier) {
  return siteConfig.membership.tiers.find((t) => t.id === tier)!;
}

export type ActiveMembership = { tier: MembershipTier; status: string; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean; interval: string };

/** Active membership for a user (ACTIVE/TRIALING, or PAST_DUE within the paid period) */
export const getActiveMembership = cache(async (userId: string | null | undefined): Promise<ActiveMembership | null> => {
  if (!userId) return null;
  const m = await db.membership.findUnique({ where: { userId } });
  if (!m) return null;
  const inPeriod = m.currentPeriodEnd > new Date();
  const ok = (m.status === "ACTIVE" || m.status === "TRIALING" || m.status === "PAST_DUE") && inPeriod;
  return ok ? { tier: m.tier, status: m.status, currentPeriodEnd: m.currentPeriodEnd, cancelAtPeriodEnd: m.cancelAtPeriodEnd, interval: m.interval } : null;
});

type TemplateAccessFields = Pick<Template, "pricingMode" | "membersOnly" | "releaseAt" | "earlyAccessHours" | "status">;

/** Does this membership tier include free access to the template? */
export function membershipIncludes(tier: MembershipTier | null | undefined, t: Pick<Template, "pricingMode" | "membersOnly">): boolean {
  if (!tier) return false;
  if (t.membersOnly) return TIER_RANK[tier] >= TIER_RANK.OFFICER;
  if (t.pricingMode !== "FREE") return TIER_RANK[tier] >= TIER_RANK.COMMANDER;
  return false;
}

/** Template visibility: released, or within the members' early-access window */
export function isReleased(t: TemplateAccessFields, now = new Date()) {
  return t.status === "PUBLISHED" && (!t.releaseAt || t.releaseAt <= now);
}

export function isInEarlyAccess(t: TemplateAccessFields, tier: MembershipTier | null | undefined, now = new Date()) {
  if (!tier || !t.releaseAt || t.releaseAt <= now || t.earlyAccessHours <= 0) return false;
  return t.releaseAt.getTime() - t.earlyAccessHours * 3_600_000 <= now.getTime();
}

/** Whether the template can be purchased/claimed right now by this viewer */
export function isAvailableTo(t: TemplateAccessFields, tier: MembershipTier | null | undefined, now = new Date()) {
  return isReleased(t, now) || (t.status === "PUBLISHED" && isInEarlyAccess(t, tier, now));
}

/**
 * Ensure a member has MEMBERSHIP-source entitlements for everything their tier includes,
 * so the downloads library and download route work uniformly. The download route
 * re-checks the membership for MEMBERSHIP-source entitlements, so access ends when it lapses.
 */
export async function syncMembershipEntitlements(user: { id: string; email: string }) {
  const m = await getActiveMembership(user.id);
  if (!m || TIER_RANK[m.tier] < TIER_RANK.OFFICER) return;
  const now = new Date();
  const templates = await db.template.findMany({
    where: {
      status: "PUBLISHED",
      ...(m.tier === "COMMANDER" ? { pricingMode: { not: "FREE" } } : { membersOnly: true }),
    },
    select: { id: true, pricingMode: true, membersOnly: true, releaseAt: true, earlyAccessHours: true, status: true },
  });
  const existing = new Set((await db.entitlement.findMany({ where: { email: user.email }, select: { templateId: true } })).map((e) => e.templateId));
  for (const t of templates) {
    if (existing.has(t.id) || !isAvailableTo(t, m.tier, now)) continue;
    await grantEntitlement({ email: user.email, templateId: t.id, source: "MEMBERSHIP" });
  }
}
