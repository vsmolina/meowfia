"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { firstError } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

const schema = z
  .object({
    templateId: z.string().cuid().optional().or(z.literal("")),
    productId: z.string().cuid().optional().or(z.literal("")),
    rating: z.coerce.number().int().min(1, "Pick a star rating").max(5),
    title: z.string().trim().max(80).optional(),
    body: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(1500),
  })
  .refine((d) => Boolean(d.templateId) !== Boolean(d.productId), { message: "Invalid review target" });

/** Verified reviews: only people who own the template (or bought the product) can review it. */
export async function submitReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in to leave a review." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const limited = await checkRateLimit("form", "review");
  if (limited) return { error: limited };
  const { templateId, productId, rating, title, body } = parsed.data;

  let path = "/";
  if (templateId) {
    const owns = await db.entitlement.findFirst({ where: { templateId, OR: [{ userId: user.id }, { email: user.email }] } });
    if (!owns) return { error: "Only recruits who own this template can review it." };
    const t = await db.template.findUnique({ where: { id: templateId }, select: { slug: true } });
    path = `/fleet/${t?.slug}`;
  } else {
    const bought = await db.orderItem.findFirst({ where: { variant: { productId: productId! }, order: { status: "PAID", OR: [{ userId: user.id }, { email: user.email }] } } });
    if (!bought) return { error: "Only verified buyers can review this product." };
    const p = await db.product.findUnique({ where: { id: productId! }, select: { slug: true } });
    path = `/shop/${p?.slug}`;
  }

  const existing = await db.review.findFirst({ where: { userId: user.id, templateId: templateId || null, productId: productId || null } });
  const data = { rating, title: title || null, body, authorName: user.name ?? user.email.split("@")[0] };
  if (existing) await db.review.update({ where: { id: existing.id }, data });
  else await db.review.create({ data: { ...data, userId: user.id, templateId: templateId || null, productId: productId || null } });
  revalidatePath(path);
  return { ok: true, message: existing ? "Review updated. Thanks!" : "Review posted. Thanks for the intel!" };
}
