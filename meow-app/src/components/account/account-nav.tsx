"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/downloads", label: "Downloads" },
  { href: "/account/favorites", label: "Saved" },
  { href: "/account/recruits", label: "My Recruits" },
  { href: "/account/membership", label: "Membership" },
  { href: "/account/referrals", label: "Referrals" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map((i) => {
          const active = i.href === "/account" ? pathname === i.href : pathname.startsWith(i.href);
          return (
            <li key={i.href} className="shrink-0">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md border-2 border-transparent px-3 py-2 text-sm font-semibold whitespace-nowrap transition hover:bg-muted",
                  active && "border-ink bg-olive text-paper shadow-stamp-sm hover:bg-olive",
                )}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
