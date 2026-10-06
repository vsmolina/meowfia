"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Camera, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Base", icon: Home, exact: true },
  { href: "/fleet", label: "Fleet", icon: LayoutGrid },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/recruits", label: "Recruits", icon: Camera },
  { href: "/account", label: "Me", icon: UserRound },
];

/** Thumb-friendly tab bar for phones (most TikTok traffic). Hidden on large screens and in admin. */
export function BottomTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/80 bg-sand/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[0.68rem] font-semibold uppercase tracking-wide text-ink/70",
                  active && "text-olive-dark",
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
