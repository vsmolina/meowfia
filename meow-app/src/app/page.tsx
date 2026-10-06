import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Stamp, SectionHeading } from "@/components/brand/stamp";
import { RankBadge } from "@/components/brand/rank-badge";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Button } from "@/components/ui/button";

// Temporary Phase 0 page. The full home page is built in Phase 2.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <Stamp>Under construction</Stamp>
      <SectionHeading as="h1" eyebrow="File no. 000 · Foundation" title={siteConfig.name} description={siteConfig.tagline} />
      <div className="flex flex-wrap gap-3">
        {siteConfig.ranks.map((r) => (
          <RankBadge key={r.name} rank={r.name} />
        ))}
      </div>
      <div className="max-w-lg rounded-lg border-2 border-ink bg-dossier p-6 shadow-stamp">
        <p className="mb-3 font-stencil text-xl">Free starter template</p>
        <NewsletterForm source="lead_magnet" cta="Send it" />
      </div>
      <Button asChild size="lg">
        <Link href="/fleet">Browse the Fleet</Link>
      </Button>
    </div>
  );
}
