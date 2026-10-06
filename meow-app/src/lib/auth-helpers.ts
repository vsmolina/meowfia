import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";

export type SessionUser = { id: string; email: string; name: string | null; role: "USER" | "ADMIN"; handle: string | null; image: string | null };

/** Current signed-in user (deduped per request), or null */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email) return null;
  return { id: u.id, email: u.email, name: u.name ?? null, role: u.role, handle: u.handle, image: u.image ?? null };
});

/** For pages/actions that need a user. Redirects to sign-in with a return path. */
export async function requireUser(returnTo = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}

/** For admin pages. Non-admins get a 404 (does not reveal that the admin area exists). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?callbackUrl=/admin");
  if (user.role !== "ADMIN") notFound();
  return user;
}

/** For server actions: returns the admin or throws (never redirects mid-action) */
export async function assertAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  return user;
}
