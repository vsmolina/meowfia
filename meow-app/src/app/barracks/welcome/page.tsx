import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Stamp } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Welcome to the Barracks", robots: { index: false } };

export default function BarracksWelcome() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Stamp size="lg" color="olive">Enlisted</Stamp>
      <h1 className="mt-6 font-stencil text-4xl text-olive-dark">Welcome to {siteConfig.membership.name}!</h1>
      <p className="mt-3 text-lg text-muted-foreground">Your members-only templates are waiting in your armory, and your shop discount now applies automatically. A welcome briefing is on its way to your inbox.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/account/downloads">Open my armory</Link></Button>
        <Button asChild variant="outline"><Link href="/barracks/vote">Vote on the next build</Link></Button>
      </div>
    </div>
  );
}
