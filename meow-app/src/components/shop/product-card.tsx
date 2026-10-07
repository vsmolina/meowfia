import Image from "next/image";
import Link from "next/link";
import { publicUrl } from "@/lib/media";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  type: "KIT" | "MERCH";
  category: string;
  priceCents: number;
  compareAtCents: number | null;
  imageKeys: unknown;
  variants: { inventory: number | null; priceCents: number | null }[];
};

export function stockState(variants: { inventory: number | null }[]) {
  if (variants.some((v) => v.inventory === null)) return "in" as const;
  const total = variants.reduce((a, v) => a + (v.inventory ?? 0), 0);
  return total === 0 ? ("out" as const) : total <= 5 ? ("low" as const) : ("in" as const);
}

export function ProductCard({ product: p, className }: { product: ProductCardData; className?: string }) {
  const stock = stockState(p.variants);
  const min = Math.min(...p.variants.map((v) => v.priceCents ?? p.priceCents), p.priceCents);
  const hasRange = p.variants.some((v) => v.priceCents && v.priceCents !== p.priceCents);
  return (
    <Link href={`/shop/${p.slug}`} className={cn("group block overflow-hidden rounded-xl border-2 border-ink bg-paper shadow-stamp transition hover:-translate-y-1", className)}>
      <div className="relative aspect-square border-b-2 border-ink bg-sand">
        <Image src={publicUrl((p.imageKeys as string[])[0])} alt={p.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-2 top-2 rounded bg-ink/85 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-paper">{p.type === "KIT" ? "Pre-cut kit" : p.category}</span>
        {stock === "out" && <span className="absolute inset-x-0 bottom-0 bg-stamp py-1 text-center font-stencil text-sm text-paper">Sold out</span>}
        {stock === "low" && <span className="absolute inset-x-0 bottom-0 bg-[#e7d27c] py-1 text-center text-xs font-bold text-ink">Low stock</span>}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-semibold leading-snug">{p.name}</h3>
        <p className="mt-1 font-stencil text-lg">
          {hasRange && "from "}
          {formatMoney(min)}
          {p.compareAtCents && <s className="ml-2 text-sm text-muted-foreground">{formatMoney(p.compareAtCents)}</s>}
        </p>
      </div>
    </Link>
  );
}
