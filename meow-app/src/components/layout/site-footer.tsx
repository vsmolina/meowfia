import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LogoMark } from "@/components/brand/logo";
import { NewsletterForm } from "@/components/site/newsletter-form";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const socials = [
    { href: siteConfig.social.tiktok, label: "TikTok" },
    { href: siteConfig.social.instagram, label: "Instagram" },
    { href: siteConfig.social.youtube, label: "YouTube" },
    { href: siteConfig.social.pinterest, label: "Pinterest" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 border-t-4 border-ink bg-olive-camo pb-24 text-paper md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 text-paper" />
            <div>
              <p className="font-stencil text-2xl">{siteConfig.name}</p>
              <p className="text-sm text-paper/75">{siteConfig.tagline}</p>
            </div>
          </div>
          <div className="rounded-lg border-2 border-paper/30 bg-ink/30 p-4">
            <p className="font-stencil text-lg">Get mission briefings</p>
            <p className="mb-3 text-sm text-paper/80">New templates, drop alerts, and a free starter build. No spam, only cardboard.</p>
            <NewsletterForm source="footer" tone="dark" />
          </div>
          <ul className="flex flex-wrap gap-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded border border-paper/40 px-3 py-1.5 text-sm font-semibold hover:bg-paper hover:text-olive-dark"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {siteConfig.footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#e7d27c]">{group.title}</h2>
              <ul className="space-y-2">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-paper/85 hover:text-paper hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-paper/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-paper/70 sm:flex-row sm:justify-between sm:px-6">
          <p>
            © {year} {siteConfig.name}. All cats are volunteers.
          </p>
          <p className="font-mono uppercase tracking-widest">Clearance level: Snack</p>
        </div>
      </div>
    </footer>
  );
}
