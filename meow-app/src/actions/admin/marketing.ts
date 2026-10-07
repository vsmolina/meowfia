"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth-helpers";
import { fd, zodMessage } from "@/lib/admin-form";
import { sendEmail } from "@/lib/email";
import { JOBS, sendBroadcast, type JobName } from "@/lib/jobs";
import { siteUrl } from "@/lib/site-url";
import { BroadcastEmail } from "@/emails/broadcast";
import type { ActionState } from "@/lib/action-state";

const broadcastSchema = z.object({
  subject: z.string().min(3).max(150),
  previewText: z.string().max(200).nullable(),
  body: z.string().min(10, "Write the email body"),
  segment: z.enum(["ALL", "FREE", "BUYERS", "MEMBERS"]),
});

export async function saveBroadcastAction(id: string | null, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    const data = broadcastSchema.parse({ subject: fd.str(f, "subject"), previewText: fd.opt(f, "previewText"), body: fd.str(f, "body"), segment: fd.str(f, "segment") });
    const b = id ? await db.broadcast.update({ where: { id, status: "DRAFT" }, data }) : await db.broadcast.create({ data });
    return { ok: true, message: "Draft saved", redirectTo: `/admin/broadcasts?edit=${b.id}` };
  } catch (e) {
    return { error: zodMessage(e) };
  }
}

export async function sendTestBroadcastAction(id: string) {
  const admin = await assertAdmin();
  const b = await db.broadcast.findUniqueOrThrow({ where: { id } });
  await sendEmail({ to: admin.email, subject: `[TEST] ${b.subject}`, template: "broadcast-test", react: BroadcastEmail({ subject: b.subject, previewText: b.previewText, body: b.body, unsubscribeUrl: siteUrl("/unsubscribe/test") }) });
  return { sentTo: admin.email };
}

export async function sendBroadcastAction(id: string) {
  await assertAdmin();
  const r = await sendBroadcast(id);
  revalidatePath("/admin/broadcasts");
  return r;
}

export async function deleteBroadcastAction(id: string) {
  await assertAdmin();
  await db.broadcast.deleteMany({ where: { id, status: "DRAFT" } });
  revalidatePath("/admin/broadcasts");
}

export async function setInquiryStatusAction(id: string, status: "NEW" | "IN_PROGRESS" | "WON" | "CLOSED") {
  await assertAdmin();
  await db.inquiry.update({ where: { id }, data: { status } });
  revalidatePath("/admin/inquiries");
}

export async function setUserRoleAction(userId: string, role: "USER" | "ADMIN") {
  const admin = await assertAdmin();
  if (admin.id === userId && role === "USER") throw new Error("You can't remove your own admin access");
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/customers");
}

export async function adjustCreditAction(userId: string, _prev: ActionState, f: FormData): Promise<ActionState> {
  await assertAdmin();
  const raw = fd.str(f, "delta").replace(/[$,\s]/g, "");
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n === 0) return { error: "Enter an amount like 5 or -5" };
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await db.user.update({ where: { id: userId }, data: { storeCreditCents: Math.max(0, u.storeCreditCents + Math.round(n * 100)) } });
  revalidatePath("/admin/customers");
  return { ok: true, message: "Credit updated" };
}

export async function runJobAction(job: string) {
  await assertAdmin();
  const fn = JOBS[job as JobName];
  if (!fn) throw new Error("Unknown job");
  return fn();
}
