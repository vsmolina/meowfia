import "server-only";

export type HeaderUser = { name: string | null; role: "USER" | "ADMIN" } | null;

/** Session user + cart count for the site header. Wired to auth and cart in later phases. */
export async function getHeaderState(): Promise<{ user: HeaderUser; cartCount: number }> {
  return { user: null, cartCount: 0 };
}
