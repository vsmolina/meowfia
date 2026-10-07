"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { tipCheckoutUrl, commissionCheckoutUrl, PaymentsUnavailableError } from "@/lib/payments";
import { storeImageUpload, UploadError } from "@/lib/uploads";
import { siteConfig } from "@/config/site";
import { emailField, firstError, honeypot, optionalText } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

const tipSchema = z.object({
  amountCents: z.coerce.number().int().min(100, "Tips start at $1").max(100_000, "That's very generous! Max $1,000 per tip."),
  name: optionalText(60),
  email: emailField.optional().or(z.literal("").transform(() => undefined)),
  message: optionalText(280),
  showOnWall: z.string().optional(),
  company_website: honeypot,
});

export async function tipAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = await checkRateLimit("checkout", "tip");
  if (limited) return { error: limited };
  const raw = Object.fromEntries(formData);
  const custom = raw.customAmount ? Math.round(parseFloat(String(raw.customAmount)) * 100) : NaN;
  const parsed = tipSchema.safeParse({ ...raw, amountCents: Number.isFinite(custom) ? custom : raw.amountCents });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const user = await getSessionUser();
  const d = parsed.data;
  const tip = await db.tip.create({ data: { amountCents: d.amountCents, name: d.name, email: d.email ?? user?.email, message: d.message, showOnWall: d.showOnWall === "on" } });
  let url: string;
  try {
    url = await tipCheckoutUrl(tip);
  } catch (e) {
    return { error: e instanceof PaymentsUnavailableError ? "Tips are temporarily offline. Thank you for trying!" : "Couldn't reach the payment processor. Please try again." };
  }
  redirect(url);
}

const commissionSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: emailField,
  subjectType: z.enum(["car", "truck", "motorcycle", "house", "other"], { message: "Choose what we're building" }),
  description: z.string().trim().min(20, "Tell us more: colors, details, your cat's size (20+ characters)").max(3000),
  catCount: z.coerce.number().int().min(1).max(6).default(1),
  company_website: honeypot,
});

/** Custom commission: save the request + reference photos (private), then take the deposit */
export async function commissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = await checkRateLimit("upload", "commission");
  if (limited) return { error: limited };
  const parsed = commissionSchema.safeParse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Please add at least one reference photo." };
  if (files.length > 4) return { error: "Up to 4 photos, please." };

  const photoKeys: string[] = [];
  try {
    for (const f of files) photoKeys.push((await storeImageUpload(f, { prefix: "commissions", private: true, maxDimension: 2400 })).key);
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "Upload failed. Please try again." };
  }
  const user = await getSessionUser();
  const { name, email, subjectType, description, catCount } = parsed.data;
  const c = await db.commission.create({
    data: { name, email, subjectType, description, catCount, userId: user?.id, photoKeys, depositCents: siteConfig.commerce.commissionDepositCents },
  });
  let url: string;
  try {
    url = await commissionCheckoutUrl(c);
  } catch (e) {
    return { error: e instanceof PaymentsUnavailableError ? "Deposits are temporarily offline. We saved your request and will email you." : "Couldn't reach the payment processor. Please try again." };
  }
  redirect(url);
}
