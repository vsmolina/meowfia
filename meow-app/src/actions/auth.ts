"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { emailField, firstError } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

/** Only allow same-site relative redirects */
function safeCallback(url: unknown) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/account";
}

export async function emailSignInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ email: emailField }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const limited = await checkRateLimit("form", "signin");
  if (limited) return { error: limited };
  try {
    await signIn("resend", { email: parsed.data.email, redirectTo: safeCallback(formData.get("callbackUrl")) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "We couldn't send your sign-in link. Please try again." };
    throw e; // NEXT_REDIRECT to the check-email page
  }
  return { ok: true };
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallback(formData.get("callbackUrl")) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
