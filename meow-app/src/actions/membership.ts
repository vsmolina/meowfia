"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership, tierConfig } from "@/lib/access";
import { membershipCheckoutUrl, PaymentsUnavailableError } from "@/lib/payments";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/action-state";

const schema = z.object({ tier: z.enum(["RECRUIT", "OFFICER", "COMMANDER"]), interval: z.enum(["MONTH", "YEAR"]) });

export async function startMembershipAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a tier" };
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?callbackUrl=${encodeURIComponent("/barracks")}`);
  const limited = await checkRateLimit("checkout", "membership");
  if (limited) return { error: limited };
  if (await getActiveMembership(user.id)) redirect("/account/membership");
  let url: string;
  try {
    url = await membershipCheckoutUrl(user, parsed.data.tier, parsed.data.interval);
  } catch (e) {
    return { error: e instanceof PaymentsUnavailableError ? "Enlistment is temporarily offline. Try again soon!" : "Couldn't reach the payment processor. Please try again." };
  }
  redirect(url);
}

/** Members vote on polls. Higher tiers carry more weight. Votes can be changed while the poll is open. */
export async function voteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in to vote." };
  const m = await getActiveMembership(user.id);
  if (!m) return { error: "Voting is for Barracks members." };
  const parsed = z.object({ pollId: z.string().cuid(), optionId: z.string().cuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Pick an option" };
  const poll = await db.poll.findUnique({ where: { id: parsed.data.pollId }, include: { options: { select: { id: true } } } });
  if (!poll || poll.status !== "OPEN" || (poll.closesAt && poll.closesAt < new Date())) return { error: "This vote is closed." };
  if (!poll.options.some((o) => o.id === parsed.data.optionId)) return { error: "Invalid option" };
  const weight = tierConfig(m.tier).voteWeight;
  await db.pollVote.upsert({
    where: { pollId_userId: { pollId: poll.id, userId: user.id } },
    create: { pollId: poll.id, optionId: parsed.data.optionId, userId: user.id, weight },
    update: { optionId: parsed.data.optionId, weight },
  });
  revalidatePath("/barracks/vote");
  return { ok: true, message: `Vote cast with ${weight}× weight. Salute!` };
}
