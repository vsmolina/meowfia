import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { grantEntitlement } from "@/lib/entitlements";
import { emailDownloadPageUrl } from "@/lib/downloads";
import { siteUrl } from "@/lib/site-url";
import { WelcomeEmail, WELCOME_SERIES } from "@/emails/welcome";
import type { ActionState } from "@/lib/action-state";

/** Shared by the newsletter form, lead magnet, checkout opt-in, and drop notifications */
export async function subscribe({ email, name, source }: { email: string; name: string | null; source: string }): Promise<ActionState> {
  const existing = await db.subscriber.findUnique({ where: { email } });
  const isNew = !existing || existing.status === "UNSUBSCRIBED";
  const sub = await db.subscriber.upsert({
    where: { email },
    create: {
      email,
      name,
      source,
      welcomeStep: 1,
      welcomeNextAt: new Date(Date.now() + WELCOME_SERIES[1].delayDays * 86_400_000),
    },
    update: { status: "SUBSCRIBED", ...(name ? { name } : {}) },
  });

  // Lead magnet: grant the free starter template
  let downloadUrl: string | undefined;
  let templateName: string | undefined;
  if (source === "lead_magnet" || source === "home") {
    const magnet = await db.template.findFirst({ where: { isLeadMagnet: true, status: "PUBLISHED" }, select: { id: true, name: true } });
    if (magnet) {
      const ent = await grantEntitlement({ email, templateId: magnet.id, source: "FREE" });
      downloadUrl = emailDownloadPageUrl(ent.id);
      templateName = magnet.name;
    }
  }

  if (isNew || downloadUrl) {
    await sendEmail({
      to: email,
      subject: downloadUrl ? `📦 Your free ${templateName} template` : "Welcome to the unit, recruit",
      template: "welcome-0",
      react: WelcomeEmail({
        step: 0,
        name: sub.name,
        downloadUrl,
        templateName,
        siteUrl: siteUrl(),
        unsubscribeUrl: siteUrl(`/unsubscribe/${sub.unsubscribeToken}`),
      }),
    });
  }

  return {
    ok: true,
    message: downloadUrl
      ? "Orders received! Check your inbox for the template."
      : isNew
        ? "You're enlisted! Watch your inbox for briefings."
        : "You're already on the list, soldier. 🫡",
  };
}
