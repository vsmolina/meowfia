import { db } from "@/lib/db";
import { verifyDownloadToken } from "@/lib/downloads";
import { storage } from "@/lib/storage";
import { getActiveMembership, membershipIncludes } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Secure PDF delivery. Requires a valid, unexpired HMAC-signed token. Files are
 * streamed from private storage and are never publicly addressable.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const parsed = verifyDownloadToken(token);
  if (!parsed) {
    return new Response("This download link is invalid or has expired. Get a fresh link from your account's Downloads page.", { status: 403 });
  }
  const limited = await checkRateLimit("download");
  if (limited) return new Response(limited, { status: 429 });

  const ent = await db.entitlement.findUnique({
    where: { id: parsed.entitlementId },
    include: { template: { select: { slug: true, name: true, pdfLetterKey: true, pdfA4Key: true, pricingMode: true, membersOnly: true } } },
  });
  if (!ent) return new Response("Not found", { status: 404 });

  // Membership-granted access ends when the membership lapses
  if (ent.source === "MEMBERSHIP") {
    const m = await getActiveMembership(ent.userId);
    if (!membershipIncludes(m?.tier, ent.template)) {
      return new Response("This template was included with a membership that's no longer active.", { status: 403 });
    }
  }

  const key = parsed.format === "a4" ? ent.template.pdfA4Key : ent.template.pdfLetterKey;
  if (!key) return new Response("File not available yet. Contact support.", { status: 404 });
  const file = await storage().stream(key);
  if (!file) return new Response("File missing. Contact support.", { status: 404 });

  await db.downloadLog.create({ data: { entitlementId: ent.id, format: parsed.format } });

  const filename = `${ent.template.slug}-${parsed.format === "a4" ? "A4" : "US-Letter"}.pdf`;
  return new Response(file.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(file.size ? { "Content-Length": String(file.size) } : {}),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
