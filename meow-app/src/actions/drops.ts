"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { subscribe } from "@/lib/subscribe";
import { emailField, firstError } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

const schema = z.object({ email: emailField, templateId: z.string().cuid() });

/** "Notify me" for an upcoming drop. Also joins the newsletter (the welcome email explains). */
export async function notifyMeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ email: formData.get("email"), templateId: formData.get("templateId") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const limited = await checkRateLimit("form", "notify");
  if (limited) return { error: limited };
  const t = await db.template.findUnique({ where: { id: parsed.data.templateId }, select: { id: true, name: true, releaseAt: true } });
  if (!t) return { error: "That drop no longer exists." };
  await db.dropNotify.upsert({
    where: { email_templateId: { email: parsed.data.email, templateId: t.id } },
    create: { email: parsed.data.email, templateId: t.id },
    update: {},
  });
  await subscribe({ email: parsed.data.email, name: null, source: "drop_notify" });
  return { ok: true, message: `You'll get an email the moment ${t.name} deploys.` };
}
