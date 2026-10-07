import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Ban, Eye, Ruler, Scissors, Droplets } from "lucide-react";
import { SectionHeading, Stamp } from "@/components/brand/stamp";

export const metadata: Metadata = { title: "Cat Safety briefing", description: "How to build cardboard vehicles that are safe for cats: no staples, non-toxic adhesives, supervision, and proper sizing.", alternates: { canonical: "/cat-safety" } };

const RULES = [
  { icon: Ban, title: "No staples, pins, or wire. Ever.", body: "Metal fasteners can scratch, puncture, or be swallowed. Every template is designed to go together with glue or tape only. If a box arrives stapled, pull every staple before you start." },
  { icon: Droplets, title: "Use non-toxic, cat-safe adhesives", body: "Best: water-activated kraft paper tape. Good: low-temp hot glue (fully cooled, strings removed) and white PVA school glue (fully dried). Avoid super glue and solvent-based cements on any surface a cat can lick or chew, and keep plastic packing tape off the interior." },
  { icon: Scissors, title: "Smooth every edge", body: "Run your hand along every opening and inside seam. Fold over, sand, or cover rough or sharp edges with kraft tape. Check hatches and cockpits most carefully, since that's where cats rub their faces." },
  { icon: Ruler, title: "Respect the cat-size rating", body: "Kitten (under 7 lb), Standard (7–12 lb), Chonk (12 lb+). The rating covers floor strength and opening size. Openings should be a comfortable fit, never a squeeze. When in doubt, size up and double-wall the floor." },
  { icon: Eye, title: "Supervise, especially at first", body: "Watch the first few sessions. Remove small detachable parts (antennae, propeller hubs, flags) for kittens and chewers. Retire a vehicle once it's soggy, crushed, or chewed into pieces." },
  { icon: AlertTriangle, title: "Paint & decorate responsibly", body: "Use water-based, non-toxic paints and let them cure fully (24h+) before deployment. Skip glitter, loose beads, string toys without supervision, and anything scented." },
];

export default function CatSafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading as="h1" eyebrow="Mandatory briefing · Read before every build" title="Cat Safety" description="Cardboard is wonderful for cats, as long as it's built right. These six rules apply to every template, kit, and custom build." />
        <Stamp size="lg" rotate={6}>Required reading</Stamp>
      </div>
      <ol className="mt-10 space-y-5">
        {RULES.map((r, i) => (
          <li key={r.title} className="flex gap-4 rounded-xl border-2 border-ink bg-paper p-5 shadow-stamp-sm">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-olive text-paper">
              <r.icon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-stencil text-xl">
                <span className="text-muted-foreground">{i + 1}.</span> {r.title}
              </h2>
              <p className="mt-1 leading-relaxed">{r.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 rounded-lg border-2 border-dashed border-ink/50 p-4 text-sm text-muted-foreground">
        This is general guidance from cat owners, not veterinary advice. If your cat has health conditions, mobility issues, or chews non-food items, check with your vet. See the <Link className="font-semibold underline" href="/guides/cat-safe-glues-and-tapes">adhesives guide</Link> for specific product recommendations.
      </p>
    </div>
  );
}
