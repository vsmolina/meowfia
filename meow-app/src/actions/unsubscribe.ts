"use server";

import { z } from "zod";
import { db } from "@/lib/db";

export async function setSubscriptionAction(formData: FormData) {
  const parsed = z.object({ token: z.string().min(10).max(60), op: z.enum(["unsubscribe", "resubscribe"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await db.subscriber.updateMany({ where: { unsubscribeToken: parsed.data.token }, data: { status: parsed.data.op === "unsubscribe" ? "UNSUBSCRIBED" : "SUBSCRIBED" } });
}
