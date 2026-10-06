import "server-only";
import { db, type License, type EntitlementSource } from "@/lib/db";

const LICENSE_RANK: Record<License, number> = { PERSONAL: 0, COMMERCIAL: 1, CLASSROOM: 2 };

/**
 * Grant (or upgrade) access to a template's PDFs. Idempotent: buying twice or
 * re-claiming a freebie never duplicates, and licenses only ever go up.
 */
export async function grantEntitlement(args: {
  email: string;
  templateId: string;
  source: EntitlementSource;
  license?: License;
  orderId?: string | null;
}) {
  const email = args.email.toLowerCase();
  const license = args.license ?? "PERSONAL";
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  const existing = await db.entitlement.findUnique({ where: { email_templateId: { email, templateId: args.templateId } } });

  if (existing) {
    const upgrade = LICENSE_RANK[license] > LICENSE_RANK[existing.license];
    return db.entitlement.update({
      where: { id: existing.id },
      data: {
        userId: existing.userId ?? user?.id,
        ...(upgrade ? { license } : {}),
        // A purchase supersedes a free/membership grant (keeps access after membership ends)
        ...(args.source === "PURCHASE" && existing.source !== "PURCHASE" ? { source: "PURCHASE", orderId: args.orderId ?? null } : {}),
      },
    });
  }
  return db.entitlement.create({
    data: { email, templateId: args.templateId, userId: user?.id, source: args.source, license, orderId: args.orderId ?? null },
  });
}

/** Attach any guest entitlements, orders, and subscriber rows to a user when they sign in */
export async function claimGuestRecords(userId: string, email: string) {
  const e = email.toLowerCase();
  await Promise.all([
    db.entitlement.updateMany({ where: { email: e, userId: null }, data: { userId } }),
    db.order.updateMany({ where: { email: e, userId: null }, data: { userId } }),
    db.commission.updateMany({ where: { email: e, userId: null }, data: { userId } }),
  ]);
}
