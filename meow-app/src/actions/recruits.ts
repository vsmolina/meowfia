"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { storeImageUpload, UploadError } from "@/lib/uploads";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { siteConfig } from "@/config/site";
import { firstError, optionalText } from "@/lib/validation";
import { SimpleEmail } from "@/emails/simple";
import type { ActionState } from "@/lib/action-state";

const schema = z.object({
  catName: z.string().trim().min(1, "What's your cat's name?").max(40),
  caption: optionalText(280),
  templateId: z.string().cuid().optional().or(z.literal("").transform(() => undefined)),
  consent: z.literal("on", { message: "Please confirm you own this photo" }),
});

/** Submit a build photo. Goes to the moderation queue before it's public. */
export async function submitGalleryPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in to post your build." };
  const limited = await checkRateLimit("upload", `gallery:${user.id}`);
  if (limited) return { error: limited };
  const parsed = schema.safeParse({
    catName: formData.get("catName"),
    caption: formData.get("caption") ?? undefined,
    templateId: formData.get("templateId") ?? "",
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const pending = await db.galleryPost.count({ where: { userId: user.id, status: "PENDING" } });
  if (pending >= 5) return { error: "You have 5 posts waiting for review. Hang tight while we catch up!" };

  const photo = formData.get("photo");
  let img;
  try {
    img = await storeImageUpload(photo as File, { prefix: "gallery", maxDimension: 1600 });
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "Upload failed. Please try again." };
  }
  await db.galleryPost.create({
    data: { userId: user.id, catName: parsed.data.catName, caption: parsed.data.caption, templateId: parsed.data.templateId, imageKey: img.key, width: img.width, height: img.height },
  });
  await sendEmail({
    to: siteConfig.creator.email,
    subject: `📸 New Recruit submission: ${parsed.data.catName}`,
    template: "admin-gallery-submission",
    react: SimpleEmail({ preview: "New gallery post to review", heading: "New recruit awaiting review", paragraphs: [`${user.name ?? user.email} posted ${parsed.data.catName}.`], cta: { label: "Moderate", href: siteUrl("/admin/moderation") } }),
  });
  revalidatePath("/account/recruits");
  return { ok: true, message: "Reporting for review! You'll get an email when your recruit is approved.", redirectTo: "/account/recruits" };
}

export async function toggleLikeAction(postId: string): Promise<{ ok: boolean; liked?: boolean; count?: number; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "signin" };
  const id = z.string().cuid().safeParse(postId);
  if (!id.success) return { ok: false, error: "Invalid post" };
  const limited = await checkRateLimit("like", user.id);
  if (limited) return { ok: false, error: limited };
  const post = await db.galleryPost.findFirst({ where: { id: id.data, status: "APPROVED" }, select: { id: true } });
  if (!post) return { ok: false, error: "Post not found" };
  const key = { postId_userId: { postId: post.id, userId: user.id } };
  const existing = await db.like.findUnique({ where: key });
  const [, updated] = await db.$transaction([
    existing ? db.like.delete({ where: key }) : db.like.create({ data: { postId: post.id, userId: user.id } }),
    db.galleryPost.update({ where: { id: post.id }, data: { likesCount: { increment: existing ? -1 : 1 } }, select: { likesCount: true } }),
  ]);
  return { ok: true, liked: !existing, count: updated.likesCount };
}
