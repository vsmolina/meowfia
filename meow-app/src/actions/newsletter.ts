"use server";

import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { subscribe } from "@/lib/subscribe";
import { emailField, firstError, honeypot } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

const schema = z.object({
  email: emailField,
  name: z.string().trim().max(80).optional().or(z.literal("")),
  source: z.enum(["footer", "lead_magnet", "home", "drop_notify", "checkout", "popup"]).default("footer"),
  // Honeypot: real people never fill this in
  company_website: honeypot,
});

export async function subscribeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstError(parsed.error), fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const limited = await checkRateLimit("form", "newsletter");
  if (limited) return { error: limited };

  const { email, name, source } = parsed.data;
  return subscribe({ email, name: name || null, source });
}
