import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Tank with cat ears on the turret. Pure SVG, inherits currentColor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true" className={cn("h-8 w-auto", className)} fill="currentColor">
      {/* ears */}
      <path d="M22 14 L25 4 L30 13 Z" />
      <path d="M34 13 L39 4 L42 14 Z" />
      {/* turret */}
      <rect x="20" y="12" width="24" height="12" rx="4" />
      {/* barrel */}
      <rect x="43" y="15" width="19" height="4" rx="1.5" />
      {/* eyes */}
      <circle cx="28" cy="18" r="1.6" fill="var(--paper)" />
      <circle cx="36" cy="18" r="1.6" fill="var(--paper)" />
      {/* hull */}
      <path d="M6 26 H58 L54 34 H10 Z" />
      {/* tracks */}
      <rect x="6" y="35" width="52" height="10" rx="5" />
      <g fill="var(--paper)">
        <circle cx="14" cy="40" r="2.6" />
        <circle cx="23" cy="40" r="2.6" />
        <circle cx="32" cy="40" r="2.6" />
        <circle cx="41" cy="40" r="2.6" />
        <circle cx="50" cy="40" r="2.6" />
      </g>
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2 text-olive-dark", className)}
      aria-label={compact ? `${siteConfig.name} home` : undefined}
    >
      <LogoMark className="h-8 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:rotate-[-4deg]" />
      {!compact && (
        <span className="font-stencil text-lg leading-none tracking-wide sm:text-xl">
          {siteConfig.shortName}
          <span className="block text-[0.6rem] tracking-[0.3em] text-muted-foreground">MOTOR POOL</span>
        </span>
      )}
    </Link>
  );
}
