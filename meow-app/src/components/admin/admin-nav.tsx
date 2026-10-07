"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/commissions", label: "Commissions" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/cats", label: "Cats" },
  { href: "/admin/polls", label: "Polls" },
  { href: "/admin/affiliates", label: "Affiliate links" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/broadcasts", label: "Broadcasts" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/emails", label: "Email log" },
  { href: "/admin/jobs", label: "Jobs" },
];

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ADMIN_NAV.map((i) => {
          const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
          const badge = badges[i.href];
          return (
            <li key={i.href} className="shrink-0">
              <Link href={i.href} aria-current={active ? "page" : undefined} className={cn("flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap hover:bg-muted", active && "bg-ink text-paper hover:bg-ink")}>
                {i.label}
                {badge ? <span className="rounded-full bg-stamp px-1.5 text-[0.7rem] text-paper">{badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
