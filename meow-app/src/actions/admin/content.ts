"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth-helpers";
import { fd, slugSchema, zodMessage } from "@/lib/admin-form";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { fetchTikTokOEmbed, isTikTokUrl, tiktokVideoId } from "@/lib/tiktok";
import { rankFor } from "@/lib/ranks";
import { slugify } from "@/lib/format";
import { SimpleEmail } from "@/emails/simple";
import type { ActionState } from "@/lib/action-state";

// ── Moderation ──
export async function moderatePostAction(postId: string, decision: "APPROVED" | "REJECTED", reason?: string) {
  await assertAdmin();
  const post = await db.galleryPost.update({ where: { id: postId }, data: { status: decision, moderatedAt: new Date(), rejectReason: decision === "REJECTED" ? (reason ?? "Doesn't meet gallery guidelines") : null }, include: { user: true, template: { select: { name: true } } } });
  if (decision === "APPROVED") {
    const approved = await db.galleryPost.count({ where: { userId: post.userId, status: "APPROVED" } });
    const now = rankFor(approved);
    const before = rankFor(approved - 1);
    await sendEmail({
      to: post.user.email,
      subject: now.name !== before.name ? `🎖️ Promotion! You're now a ${now.name}` : `✅ ${post.catName} has been approved for duty`,
      template: "gallery-approved",
      react: SimpleEmail({
        preview: `${post.catName} is live in the Recruits gallery`,
        heading: now.name !== before.name ? `Promoted to ${now.name}!` : "Recruit approved",
        paragraphs: [`${post.catName} is now live in the Recruits gallery${post.template ? ` in the ${post.template.name}` : ""}.`, now.next ? `${now.next.needed} more approved build${now.next.needed === 1 ? "" : "s"} to make ${now.next.name}.` : "You've reached the highest rank. Salute, General!"],
        cta: { label: "See your post", href: siteUrl(`/recruits/${post.id}`) },
      }),
    });
  }
  revalidatePath("/admin/moderation");
  revalidatePath("/recruits");
}

export async function featurePostAction(postId: string) {
  await assertAdmin();
  const post = await db.galleryPost.update({ where: { id: postId }, data: { featuredAt: new Date(), status: "APPROVED" }, include: { user: true } });
  await sendEmail({ to: post.user.email, subject: `🏅 ${post.catName} is Recruit of the Week!`, template: "recruit-of-week", react: SimpleEmail({ preview: "Commendation awarded", heading: "Recruit of the Week!", paragraphs: [`${post.catName} has been named Recruit of the Week and is featured on the home page. Outstanding service!`], cta: { label: "See the commendation", href: siteUrl(`/recruits/${post.id}`) } }) });
  revalidatePath("/", "layout");
}

export async function deletePostAction(postId: string) {
  await assertAdmin();
  await db.galleryPost.delete({ where: { id: postId } });
  revalidatePath("/admin/moderation");
}

// ── Videos ──
export async function addVideoAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  const url = fd.str(f, "url").split("?")[0];
  if (!isTikTokUrl(url)) return { error: "Paste a full TikTok video URL (https://www.tiktok.com/@handle/video/123…)" };
  const o = await fetchTikTokOEmbed(url);
  const tiktokId = o.videoId ?? tiktokVideoId(url);
  if (!tiktokId) return { error: "Couldn't find a video ID. Use the full desktop URL, not a vm.tiktok.com short link." };
  try {
    await db.video.create({
      data: {
        url,
        tiktokId,
        title: fd.opt(f, "title") ?? o.title?.slice(0, 140) ?? "New video",
        series: fd.opt(f, "series") ?? "Behind the Scenes",
        thumbnailUrl: o.thumbnailUrl,
        authorName: o.authorName,
        templateId: fd.opt(f, "templateId"),
        featured: fd.bool(f, "featured"),
        cats: { connect: fd.all(f, "catIds").map((id) => ({ id })) },
      },
    });
    revalidatePath("/videos");
    return { ok: true, message: o.ok ? "Video added with TikTok details" : "Video added (TikTok details unavailable, so add a title manually)" };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

export async function updateVideoAction(id: string, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  await db.video.update({ where: { id }, data: { title: fd.str(f, "title"), series: fd.str(f, "series"), templateId: fd.opt(f, "templateId"), featured: fd.bool(f, "featured"), sortOrder: fd.int(f, "sortOrder") } });
  if (fd.bool(f, "featured")) await db.video.updateMany({ where: { id: { not: id } }, data: { featured: false } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Video updated" };
}

export async function refreshVideoAction(id: string) {
  await assertAdmin();
  const v = await db.video.findUniqueOrThrow({ where: { id } });
  const o = await fetchTikTokOEmbed(v.url);
  if (!o.ok) throw new Error("TikTok didn't return details (private, deleted, or offline)");
  await db.video.update({ where: { id }, data: { thumbnailUrl: o.thumbnailUrl, authorName: o.authorName } });
  revalidatePath("/videos");
}

export async function deleteVideoAction(id: string) {
  await assertAdmin();
  await db.video.delete({ where: { id } });
  revalidatePath("/videos");
}

// ── Cats ──
export async function saveCatAction(id: string | null, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const name = fd.str(f, "name");
    const data = z
      .object({ name: z.string().min(1), slug: slugSchema, rank: z.string().min(2), callsign: z.string().nullable(), personality: z.string().min(5), favoriteVehicle: z.string().min(2), bio: z.string().min(10), imageKey: z.string().min(1, "Upload a photo"), sortOrder: z.number().int() })
      .parse({ name, slug: fd.str(f, "slug") || slugify(name), rank: fd.str(f, "rank"), callsign: fd.opt(f, "callsign"), personality: fd.str(f, "personality"), favoriteVehicle: fd.str(f, "favoriteVehicle"), bio: fd.str(f, "bio"), imageKey: fd.all(f, "imageKey")[0] ?? "", sortOrder: fd.int(f, "sortOrder") });
    if (id) await db.cat.update({ where: { id }, data });
    else await db.cat.create({ data });
    revalidatePath("/crew", "layout");
    return { ok: true, message: "Cat saved", redirectTo: "/admin/cats" };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

export async function deleteCatAction(id: string) {
  await assertAdmin();
  await db.cat.delete({ where: { id } });
  revalidatePath("/crew");
}

// ── Polls ──
export async function createPollAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  const options = fd.lines(f, "options");
  if (options.length < 2) return { error: "Add at least two options (one per line)" };
  const title = fd.str(f, "title");
  if (title.length < 3) return { error: "Add a title" };
  await db.poll.create({ data: { title, description: fd.opt(f, "description"), status: "OPEN", closesAt: fd.date(f, "closesAt"), options: { create: options.map((label) => ({ label })) } } });
  revalidatePath("/barracks/vote");
  return { ok: true, message: "Poll opened. Members can vote now." };
}

export async function setPollStatusAction(id: string, status: "OPEN" | "CLOSED") {
  await assertAdmin();
  await db.poll.update({ where: { id }, data: { status } });
  revalidatePath("/barracks/vote");
}

export async function deletePollAction(id: string) {
  await assertAdmin();
  await db.poll.delete({ where: { id } });
  revalidatePath("/barracks/vote");
}

// ── Affiliate links ──
export async function saveAffiliateAction(id: string | null, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const data = z
      .object({ name: z.string().min(2), description: z.string().min(3), url: z.string().url(), category: z.string().min(2), priceHint: z.string().nullable(), badge: z.string().nullable(), sortOrder: z.number().int(), active: z.boolean() })
      .parse({ name: fd.str(f, "name"), description: fd.str(f, "description"), url: fd.str(f, "url"), category: fd.str(f, "category"), priceHint: fd.opt(f, "priceHint"), badge: fd.opt(f, "badge"), sortOrder: fd.int(f, "sortOrder"), active: fd.bool(f, "active") });
    if (id) await db.affiliateLink.update({ where: { id }, data });
    else await db.affiliateLink.create({ data });
    revalidatePath("/supply-depot");
    return { ok: true, message: "Link saved" };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

export async function deleteAffiliateAction(id: string) {
  await assertAdmin();
  await db.affiliateLink.delete({ where: { id } });
  revalidatePath("/supply-depot");
}

// ── Coupons ──
export async function saveCouponAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const percentOff = fd.opt(f, "percentOff") ? fd.int(f, "percentOff") : null;
    const amountOffCents = fd.cents(f, "amountOff");
    if (!percentOff === !amountOffCents) return { error: "Set either a percent OR an amount off" };
    const data = z
      .object({ code: z.string().regex(/^[A-Z0-9_-]{3,30}$/, "Code: 3–30 letters/numbers"), description: z.string().nullable(), percentOff: z.number().int().min(1).max(100).nullable(), amountOffCents: z.number().int().min(1).nullable(), minSubtotalCents: z.number().int().nullable(), maxRedemptions: z.number().int().min(1).nullable(), expiresAt: z.date().nullable() })
      .parse({ code: fd.str(f, "code").toUpperCase(), description: fd.opt(f, "description"), percentOff, amountOffCents, minSubtotalCents: fd.cents(f, "minSubtotal"), maxRedemptions: fd.opt(f, "maxRedemptions") ? fd.int(f, "maxRedemptions") : null, expiresAt: fd.date(f, "expiresAt") });
    await db.coupon.create({ data });
    return { ok: true, message: `Coupon ${data.code} created` };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

export async function toggleCouponAction(id: string) {
  await assertAdmin();
  const c = await db.coupon.findUniqueOrThrow({ where: { id } });
  await db.coupon.update({ where: { id }, data: { active: !c.active } });
}

export async function deleteCouponAction(id: string) {
  await assertAdmin();
  const used = await db.order.count({ where: { couponId: id } });
  if (used) await db.coupon.update({ where: { id }, data: { active: false } });
  else await db.coupon.delete({ where: { id } });
}
