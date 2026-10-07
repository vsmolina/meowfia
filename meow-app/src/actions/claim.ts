"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { isReleased } from "@/lib/access";
import { grantEntitlement } from "@/lib/entitlements";
import { emailDownloadPageUrl } from "@/lib/downloads";
import { sendEmail } from "@/lib/email";
import { subscribe } from "@/lib/subscribe";
import { siteUrl } from "@/lib/site-url";
import { checkRateLimit } from "@/lib/rate-limit";
import { emailField, firstError, honeypot } from "@/lib/validation";
import { TemplateDeliveryEmail } from "@/emails/template-delivery";
import type { ActionState } from "@/lib/action-state";

const schema = z.object({
  templateId: z.string().cuid(),
  email: emailField.optional(),
  optIn: z.string().optional(),
  company_website: honeypot,
});

/** Free templates are email-gated: we email the download link (and add them to the list if they opt in). */
export async function claimFreeTemplateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse({ ...raw, email: user?.email ?? raw.email });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const limited = await checkRateLimit("form", "claim");
  if (limited) return { error: limited };

  const email = parsed.data.email;
  if (!email) return { error: "Enter your email to receive the template." };
  const t = await db.template.findUnique({ where: { id: parsed.data.templateId } });
  if (!t || t.pricingMode !== "FREE" || !isReleased(t)) return { error: "That template isn't available for free." };

  const ent = await grantEntitlement({ email, templateId: t.id, source: "FREE" });
  await sendEmail({
    to: email,
    subject: `📦 ${t.name}: your download is ready`,
    template: "template-delivery",
    react: TemplateDeliveryEmail({ templateName: t.name, downloadUrl: emailDownloadPageUrl(ent.id), accountUrl: siteUrl("/account/downloads") }),
  });
  if (parsed.data.optIn === "on") await subscribe({ email, name: user?.name ?? null, source: "claim" });

  return user
    ? { ok: true, message: "Added to your armory!", redirectTo: "/account/downloads" }
    : { ok: true, message: `Check ${email}. Your download link is on its way.` };
}
