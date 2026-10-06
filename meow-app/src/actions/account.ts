"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { firstError } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "Handle: 3–24 letters, numbers, or underscores")
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(280).optional(),
});

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { name, handle, bio } = parsed.data;
  if (handle) {
    const taken = await db.user.findFirst({ where: { handle, NOT: { id: user.id } }, select: { id: true } });
    if (taken) return { error: "That handle is taken. Try another." };
  }
  await db.user.update({ where: { id: user.id }, data: { name, handle: handle || null, bio: bio || null } });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Dossier updated." };
}

export async function toggleFavoriteAction(templateId: string): Promise<{ ok: boolean; favorited?: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "signin" };
  const id = z.string().cuid().safeParse(templateId);
  if (!id.success) return { ok: false, error: "Invalid template" };
  const key = { userId_templateId: { userId: user.id, templateId: id.data } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) await db.favorite.delete({ where: key });
  else await db.favorite.create({ data: { userId: user.id, templateId: id.data } });
  revalidatePath("/account/favorites");
  return { ok: true, favorited: !existing };
}
