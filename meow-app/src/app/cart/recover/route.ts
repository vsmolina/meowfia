import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCartRecovery } from "@/lib/marketing";
import { CART_COOKIE } from "@/lib/cart";

/** Abandoned-cart email link: restores the cart cookie and opens the cart */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const c = url.searchParams.get("c") ?? "";
  const s = url.searchParams.get("s") ?? "";
  const res = NextResponse.redirect(new URL("/cart", url.origin));
  if (!c || !verifyCartRecovery(c, s)) return res;
  const cart = await db.cart.findFirst({ where: { id: c, convertedAt: null } });
  if (cart) res.cookies.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60, secure: url.protocol === "https:" });
  return res;
}
