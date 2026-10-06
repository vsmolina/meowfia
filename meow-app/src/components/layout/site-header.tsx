import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavLinks } from "@/components/layout/nav-links";
import { getHeaderState } from "@/lib/header-state";

export async function SiteHeader() {
  const { user, cartCount } = await getHeaderState();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink/80 bg-sand/90 backdrop-blur supports-[backdrop-filter]:bg-sand/75">
      <div className="hazard-stripe h-1 w-full" aria-hidden="true" />
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <MobileMenu user={user} />
        <Logo className="mr-auto lg:mr-6" />
        <nav aria-label="Primary" className="hidden flex-1 lg:block">
          <NavLinks items={siteConfig.nav} />
        </nav>
        <div className="flex items-center gap-1">
          <Link
            href={user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/sign-in"}
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted sm:inline-flex"
          >
            <UserRound className="size-4" aria-hidden="true" />
            {user ? (user.role === "ADMIN" ? "HQ" : "My Dossier") : "Sign in"}
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex size-10 items-center justify-center rounded-md hover:bg-muted"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-stamp px-1 text-[0.7rem] font-bold text-paper">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/fleet"
            className="ml-1 hidden rounded-md bg-olive px-3.5 py-2 font-stencil text-sm tracking-wider text-paper shadow-stamp-sm transition hover:-translate-y-0.5 hover:bg-olive-dark md:inline-flex"
          >
            Browse the Fleet
          </Link>
        </div>
      </div>
    </header>
  );
}
