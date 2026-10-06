import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE } from "@/lib/referral-cookie";

/**
 * Lightweight edge gate (Next 16 "proxy", formerly middleware):
 *  1. Fast redirect to /sign-in for /account and /admin when there's no session cookie.
 *     Real authorization (roles, ownership) is enforced server-side in layouts/actions.
 *  2. Captures ?ref=CODE into a cookie for referral attribution.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];
const REF_DAYS = 30;

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname.startsWith("/account") || pathname.startsWith("/admin")) {
    const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = `?callbackUrl=${encodeURIComponent(pathname + req.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  const ref = searchParams.get("ref");
  if (ref && /^[a-z0-9]{8,40}$/i.test(ref) && req.cookies.get(REF_COOKIE)?.value !== ref) {
    res.cookies.set(REF_COOKIE, ref, { maxAge: REF_DAYS * 86_400, httpOnly: true, sameSite: "lax", path: "/", secure: req.nextUrl.protocol === "https:" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|media/|api/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|txt|xml)$).*)"],
};
