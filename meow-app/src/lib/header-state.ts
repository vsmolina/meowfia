import "server-only";
import { getSessionUser } from "@/lib/auth-helpers";
import { getCartCount } from "@/lib/cart";

export type HeaderUser = { name: string | null; role: "USER" | "ADMIN" } | null;

/** Session user + cart count for the site header */
export async function getHeaderState(): Promise<{ user: HeaderUser; cartCount: number }> {
  const [user, cartCount] = await Promise.all([getSessionUser(), getCartCount()]);
  return { user: user ? { name: user.name, role: user.role } : null, cartCount };
}
