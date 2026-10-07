import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { bundlePriceCents } from "@/lib/pricing";
import { publicUrl } from "@/lib/media";
import { formatMoney } from "@/lib/format";
import { SectionHeading } from "@/components/brand/stamp";

export const metadata: Metadata = { title: "Template bundles", description: "Save up to 35% with template bundles: Armored Division, Air Force, Navy, and the Complete Arsenal.", alternates: { canonical: "/fleet/bundles" } };

export default async function BundlesPage() {
  const bundles = await db.bundle.findMany({ where: { active: true }, orderBy: { discountPercent: "asc" }, include: { items: { include: { template: true } } } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Combined arms" title="Bundles" description="Buy the whole division and save. Bundle discounts also apply automatically if you add every template in a bundle to your cart." />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {bundles.map((b) => {
          const { fullCents, priceCents } = bundlePriceCents(b.items.map((i) => i.template), b.discountPercent);
          return (
            <Link key={b.id} href={`/fleet/bundles/${b.slug}`} className="group overflow-hidden rounded-xl border-2 border-ink bg-paper shadow-stamp transition hover:-translate-y-1">
              <div className="relative aspect-[16/9] border-b-2 border-ink">
                <Image src={publicUrl(b.coverImageKey)} alt="" fill sizes="(max-width: 768px) 100vw, 560px" className="object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute right-3 top-3 rounded-full bg-stamp px-3 py-1 font-stencil text-paper shadow-stamp-sm">Save {b.discountPercent}%</span>
              </div>
              <div className="p-5">
                <h2 className="font-stencil text-2xl text-olive-dark">{b.name}</h2>
                <p className="mt-1 text-muted-foreground">{b.description}</p>
                <p className="mt-3 text-sm">{b.items.map((i) => i.template.name).join(" · ")}</p>
                <p className="mt-3 font-stencil text-2xl">
                  {formatMoney(priceCents)} <s className="text-base text-muted-foreground">{formatMoney(fullCents)}</s>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
