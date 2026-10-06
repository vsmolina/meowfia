"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type HeaderUser = { name: string | null; role: "USER" | "ADMIN" } | null;

const EXTRA = [
  { href: "/crew", label: "Meet the Crew" },
  { href: "/drops", label: "Upcoming Drops" },
  { href: "/supply-depot", label: "Supply Depot" },
  { href: "/support", label: "Support the Mission" },
  { href: "/classroom", label: "Classroom & Bulk" },
  { href: "/work-with-us", label: "Work With Us" },
  { href: "/cat-safety", label: "Cat Safety" },
];

export function MobileMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const link = (href: string, label: string, big = false) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      aria-current={pathname === href ? "page" : undefined}
      className={cn(
        "block rounded-md px-3 py-2.5 transition hover:bg-muted",
        big ? "font-stencil text-xl tracking-wide text-olive-dark" : "text-base font-medium",
        pathname === href && "bg-muted",
      )}
    >
      {label}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="-ml-2 inline-flex size-10 items-center justify-center rounded-md hover:bg-muted lg:hidden" aria-label="Open menu">
          <Menu className="size-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto bg-sand p-0">
        <SheetHeader className="border-b-2 border-ink/80 bg-olive-camo p-4 text-paper">
          <SheetTitle className="flex items-center gap-2 font-stencil text-xl text-paper">
            <LogoMark className="h-7" /> {siteConfig.shortName}
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="space-y-6 p-4">
          <div className="space-y-1">{siteConfig.nav.map((n) => link(n.href, n.label, true))}</div>
          <div className="space-y-0.5 border-t border-border pt-4">{EXTRA.map((n) => link(n.href, n.label))}</div>
          <div className="space-y-0.5 border-t border-border pt-4">
            {user ? (
              <>
                {link("/account", "My Dossier")}
                {user.role === "ADMIN" && link("/admin", "Admin HQ")}
              </>
            ) : (
              link("/sign-in", "Sign in / Enlist")
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
