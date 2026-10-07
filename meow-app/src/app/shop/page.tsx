import type { Metadata } from "next";
import Link from "next/link";
import { Gift, PenTool } from "lucide-react";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/brand/stamp";
import { ProductCard } from "@/components/shop/product-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop: pre-cut kits & merch", description: "Die-cut cardboard kits that ship flat, plus crew tees, hoodies, stickers, patches, and cat collar tags.", alternates: { canonical: "/shop" } };

const TABS = [
  { key: null, label: "Everything" },
  { key: "kits", label: "Pre-cut kits" },
  { key: "merch", label: "Merch" },
];

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const tab = sp.type === "kits" || sp.type === "merch" ? sp.type : null;
  const category = typeof sp.category === "string" ? sp.category : null;
  const products = await db.product.findMany({
    where: { active: true, ...(tab ? { type: tab === "kits" ? "KIT" : "MERCH" } : {}), ...(category ? { category } : {}) },
    orderBy: [{ featured: "desc" }, { type: "asc" }, { createdAt: "asc" }],
    include: { variants: { select: { inventory: true, priceCents: true } } },
  });
  const categories = await db.product.findMany({ where: { active: true, type: "MERCH" }, select: { category: true }, distinct: ["category"] });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Quartermaster" title="The Shop" description="Pre-cut kits ship flat and fold together with no knife required. Merch is printed on demand and ships worldwide." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/shop/commissions" className="group flex items-center gap-3 rounded-xl border-2 border-ink bg-olive-camo p-4 text-paper shadow-stamp-sm transition hover:-translate-y-0.5">
          <PenTool className="size-8 shrink-0 text-[#e7d27c]" aria-hidden="true" />
          <span>
            <span className="block font-stencil text-lg">Custom commissions</span>
            <span className="text-sm text-paper/80">Your car, truck, motorcycle, or house, rebuilt for your cat</span>
          </span>
        </Link>
        <Link href="/shop/gift-cards" className="group flex items-center gap-3 rounded-xl border-2 border-ink bg-[#e7d27c] p-4 shadow-stamp-sm transition hover:-translate-y-0.5">
          <Gift className="size-8 shrink-0 text-stamp" aria-hidden="true" />
          <span>
            <span className="block font-stencil text-lg">Gift cards</span>
            <span className="text-sm text-ink/80">Any amount, emailed instantly, never expires</span>
          </span>
        </Link>
      </div>
      <nav aria-label="Product type" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <Link key={t.label} href={t.key ? `/shop?type=${t.key}` : "/shop"} aria-current={tab === t.key ? "page" : undefined} className={cn("shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold", tab === t.key && !category ? "bg-olive text-paper" : "bg-paper hover:bg-muted")}>
            {t.label}
          </Link>
        ))}
        {tab !== "kits" &&
          categories.map((c) => (
            <Link key={c.category} href={`/shop?type=merch&category=${encodeURIComponent(c.category)}`} aria-current={category === c.category ? "page" : undefined} className={cn("shrink-0 rounded-full border-2 border-ink/50 px-4 py-1.5 text-sm", category === c.category ? "bg-olive text-paper" : "bg-paper hover:bg-muted")}>
              {c.category}
            </Link>
          ))}
      </nav>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
