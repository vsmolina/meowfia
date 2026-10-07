import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/brand/stamp";

export const metadata: Metadata = { title: "Supply Depot: tools & supplies", description: "The exact cutting mats, knives, glue guns, and tapes used to build every cardboard cat vehicle.", alternates: { canonical: "/supply-depot" } };

export default async function SupplyDepotPage() {
  const links = await db.affiliateLink.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }] });
  const cats = [...new Set(links.map((l) => l.category))];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Quartermaster's list" title="Supply Depot" description="The gear I actually use on every build. Nothing here I wouldn't hand to a recruit." />
      <p className="mt-4 rounded-md border-2 border-dashed border-ink/40 bg-paper/60 p-3 text-sm text-muted-foreground">
        <b className="text-ink">Disclosure:</b> some links are affiliate links. If you buy through them, the motor pool earns a small commission at no extra cost to you. Thank you!
      </p>
      {cats.map((c) => (
        <section key={c} className="mt-10">
          <h2 className="mb-4 font-stencil text-2xl text-olive-dark">{c}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.filter((l) => l.category === c).map((l) => (
              <li key={l.id}>
                <a href={`/go/${l.id}`} target="_blank" rel="sponsored noopener" className="group flex h-full flex-col rounded-xl border-2 border-ink bg-paper p-4 shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{l.name}</h3>
                    {l.badge && <span className="shrink-0 rounded bg-[#e7d27c] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider">{l.badge}</span>}
                  </div>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{l.description}</p>
                  <p className="mt-3 flex items-center justify-between text-sm font-semibold">
                    <span>{l.priceHint ?? ""}</span>
                    <span className="inline-flex items-center gap-1 text-olive-dark group-hover:underline">
                      View <ExternalLink className="size-3.5" />
                    </span>
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
