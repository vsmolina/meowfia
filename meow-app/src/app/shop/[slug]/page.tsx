import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership, tierConfig } from "@/lib/access";
import { publicUrl } from "@/lib/media";
import { siteUrl } from "@/lib/site-url";
import { formatMoney } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { FileTag } from "@/components/brand/stamp";
import { ImageGallery } from "@/components/site/image-gallery";
import { Reviews } from "@/components/site/reviews";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductAddToCart, AddAllButton } from "@/components/shop/add-to-cart";
import { ProductCard, stockState } from "@/components/shop/product-card";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const p = await db.product.findUnique({ where: { slug: (await params).slug } });
  return p ? { title: p.name, description: p.description.slice(0, 155), alternates: { canonical: `/shop/${p.slug}` } } : {};
}

/** Products most often bought in the same order as this one */
async function frequentlyBoughtTogether(productId: string, category: string) {
  const orders = await db.orderItem.findMany({ where: { variant: { productId }, order: { status: "PAID" } }, select: { orderId: true }, take: 300 });
  const counts = new Map<string, number>();
  if (orders.length) {
    const co = await db.orderItem.findMany({ where: { orderId: { in: orders.map((o) => o.orderId) }, variant: { productId: { not: productId } } }, select: { variant: { select: { productId: true } } } });
    for (const c of co) if (c.variant) counts.set(c.variant.productId, (counts.get(c.variant.productId) ?? 0) + 1);
  }
  const ids = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
  const include = { variants: { select: { id: true, inventory: true, priceCents: true } } } as const;
  let products = ids.length ? await db.product.findMany({ where: { id: { in: ids }, active: true }, include }) : [];
  if (products.length < 2) {
    const more = await db.product.findMany({ where: { active: true, id: { notIn: [productId, ...products.map((p) => p.id)] }, OR: [{ category }, { category: "Stickers" }] }, include, take: 2 - products.length });
    products = [...products, ...more];
  }
  return products;
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug }, include: { variants: { orderBy: { sku: "asc" } }, template: { select: { slug: true, name: true } } } });
  if (!p || !p.active) notFound();
  const user = await getSessionUser();
  const [m, upsell, fbt, bought, agg] = await Promise.all([
    getActiveMembership(user?.id),
    p.upsellProductId ? db.product.findUnique({ where: { id: p.upsellProductId }, include: { variants: { take: 1 } } }) : null,
    frequentlyBoughtTogether(p.id, p.category),
    user ? db.orderItem.findFirst({ where: { variant: { productId: p.id }, order: { status: "PAID", OR: [{ userId: user.id }, { email: user.email }] } } }) : null,
    db.review.aggregate({ where: { productId: p.id, approved: true }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const memberPct = m ? tierConfig(m.tier).shopDiscountPercent : 0;
  const images = (p.imageKeys as string[]).map(publicUrl);
  const fbtAvailable = fbt.filter((x) => x.variants[0] && stockState(x.variants) !== "out");
  const mainVariant = p.variants.find((v) => v.inventory !== 0);
  const fbtTotal = (mainVariant?.priceCents ?? p.priceCents) + fbtAvailable.reduce((a, x) => a + (x.variants[0].priceCents ?? x.priceCents), 0);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: images.map((i) => siteUrl(i)),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: v.name,
      price: ((v.priceCents ?? p.priceCents) / 100).toFixed(2),
      priceCurrency: "USD",
      availability: v.inventory === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: siteUrl(`/shop/${p.slug}`),
    })),
    ...(agg._count._all ? { aggregateRating: { "@type": "AggregateRating", ratingValue: (agg._avg.rating ?? 0).toFixed(1), reviewCount: agg._count._all } } : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={ld} />
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
        <Link href="/shop" className="hover:underline">Shop</Link> / <Link href={`/shop?type=${p.type === "KIT" ? "kits" : "merch"}`} className="hover:underline">{p.type === "KIT" ? "Pre-cut kits" : p.category}</Link> / <span className="text-ink">{p.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ImageGallery images={images} alt={p.name} aspect="1/1" />
        <div className="space-y-5">
          <div>
            <FileTag>{p.type === "KIT" ? "Pre-cut kit · ships flat" : `${p.category}${p.printfulProductId ? " · printed on demand" : ""}`}</FileTag>
            <h1 className="font-stencil text-4xl leading-tight text-olive-dark">{p.name}</h1>
          </div>
          <div className="rounded-xl border-2 border-ink bg-paper p-5 shadow-stamp">
            <ProductAddToCart name={p.name} basePriceCents={p.priceCents} variants={p.variants.map((v) => ({ id: v.id, name: v.name, priceCents: v.priceCents, inventory: v.inventory }))} memberDiscountPercent={memberPct} />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4" aria-hidden="true" /> Free US shipping over $75 · <Link href="/legal/shipping" className="underline">Shipping policy</Link>
          </p>
          <p className="leading-relaxed">{p.description}</p>
          {p.template && (
            <p className="text-sm">
              Prefer to cut your own? <Link href={`/fleet/${p.template.slug}`} className="font-semibold underline">Get the {p.template.name} template</Link>.
            </p>
          )}
          {upsell && upsell.variants[0] && (
            <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-ink/50 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded">
                <Image src={publicUrl((upsell.imageKeys as string[])[0])} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <p className="flex-1 text-sm">
                <Plus className="mr-1 inline size-4" aria-hidden="true" />
                Pairs well with the <Link href={`/shop/${upsell.slug}`} className="font-semibold underline">{upsell.name}</Link> ({formatMoney(upsell.priceCents)})
              </p>
            </div>
          )}
        </div>
      </div>

      {fbtAvailable.length > 0 && mainVariant && (
        <section aria-labelledby="fbt-h" className="mt-16 rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp">
          <h2 id="fbt-h" className="font-stencil text-2xl text-olive-dark">Frequently requisitioned together</h2>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {[{ ...p, variants: p.variants }, ...fbtAvailable].map((x, i) => (
              <div key={x.id} className="flex items-center gap-4">
                {i > 0 && <Plus className="size-5 text-muted-foreground" aria-hidden="true" />}
                <Link href={`/shop/${x.slug}`} className="block w-28 text-center">
                  <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-lg border-2 border-ink">
                    <Image src={publicUrl((x.imageKeys as string[])[0])} alt={x.name} fill sizes="112px" className="object-cover" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold">{x.name}</p>
                </Link>
              </div>
            ))}
            <div className="ml-auto">
              <AddAllButton variantIds={[mainVariant.id, ...fbtAvailable.map((x) => x.variants[0].id)]} totalCents={fbtTotal} />
            </div>
          </div>
        </section>
      )}

      <div className="mt-16">
        <Reviews productId={p.id} canReview={Boolean(bought)} />
      </div>

      {fbt.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 font-stencil text-2xl text-olive-dark">More from the quartermaster</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(await db.product.findMany({ where: { active: true, id: { not: p.id } }, include: { variants: { select: { inventory: true, priceCents: true } } }, take: 4, orderBy: { featured: "desc" } })).map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
