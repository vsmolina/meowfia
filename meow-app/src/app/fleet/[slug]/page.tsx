import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, BookOpen, Package } from "lucide-react";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership, isAvailableTo, isInEarlyAccess, membershipIncludes } from "@/lib/access";
import { releasedWhere, templateCardSelect, ratingsFor, favoriteIds } from "@/lib/catalog";
import { bundlePriceCents } from "@/lib/pricing";
import { publicUrl } from "@/lib/media";
import { siteUrl } from "@/lib/site-url";
import { formatMoney } from "@/lib/format";
import { VEHICLE_LABELS } from "@/lib/labels";
import { FileTag, Stamp } from "@/components/brand/stamp";
import { TikTokEmbed } from "@/components/brand/tiktok-embed";
import { ImageGallery } from "@/components/site/image-gallery";
import { SpecCard } from "@/components/fleet/spec-card";
import { PurchasePanel } from "@/components/fleet/purchase-panel";
import { TemplateCard } from "@/components/fleet/template-card";
import { FavoriteButton } from "@/components/fleet/favorite-button";
import { GalleryTile } from "@/components/recruits/gallery-tile";
import { Reviews } from "@/components/site/reviews";
import { Stars } from "@/components/site/stars";
import { JsonLd } from "@/components/seo/json-ld";

async function getTemplate(slug: string) {
  return db.template.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: PageProps<"/fleet/[slug]">): Promise<Metadata> {
  const t = await getTemplate((await params).slug);
  if (!t) return {};
  return {
    title: `${t.name}: cardboard ${VEHICLE_LABELS[t.vehicleType].toLowerCase()} template for cats`,
    description: `${t.tagline} ${t.description.slice(0, 120)}`,
    alternates: { canonical: `/fleet/${t.slug}` },
    openGraph: { title: t.name, description: t.tagline, type: "website" },
  };
}

export default async function TemplatePage({ params }: PageProps<"/fleet/[slug]">) {
  const { slug } = await params;
  const t = await getTemplate(slug);
  if (!t || t.status !== "PUBLISHED") notFound();

  const user = await getSessionUser();
  const membership = await getActiveMembership(user?.id);
  if (!isAvailableTo(t, membership?.tier)) redirect(`/drops/${t.slug}`);
  const earlyAccess = isInEarlyAccess(t, membership?.tier);

  const [entitlement, recruits, recruitCount, related, bundles, kit, guide, video, ratingAgg, favs] = await Promise.all([
    user ? db.entitlement.findFirst({ where: { templateId: t.id, OR: [{ userId: user.id }, { email: user.email }] }, select: { license: true, source: true } }) : null,
    db.galleryPost.findMany({ where: { templateId: t.id, status: "APPROVED" }, orderBy: [{ likesCount: "desc" }], take: 8, include: { template: { select: { name: true } } } }),
    db.galleryPost.count({ where: { templateId: t.id, status: "APPROVED" } }),
    db.template.findMany({ where: { ...releasedWhere(), id: { not: t.id }, OR: [{ vehicleType: t.vehicleType }, { difficulty: t.difficulty }] }, select: templateCardSelect, take: 3, orderBy: { featured: "desc" } }),
    db.bundle.findMany({ where: { active: true, items: { some: { templateId: t.id } } }, include: { items: { include: { template: true } } } }),
    db.product.findFirst({ where: { templateId: t.id, type: "KIT", active: true } }),
    db.guide.findFirst({ where: { templateId: t.id, published: true }, select: { slug: true, title: true, premium: true } }),
    t.tiktokUrl ? db.video.findUnique({ where: { url: t.tiktokUrl } }) : null,
    db.review.aggregate({ where: { templateId: t.id, approved: true }, _avg: { rating: true }, _count: { _all: true } }),
    favoriteIds(user?.id),
  ]);
  const relatedRatings = await ratingsFor(related.map((r) => r.id));
  const images = ((t.imageKeys as string[]) ?? [t.coverImageKey]).map(publicUrl);
  const memberIncluded = membershipIncludes(membership?.tier, t);
  const ownedLicense = entitlement && !(entitlement.source === "MEMBERSHIP" && !memberIncluded) ? entitlement.license : null;
  const fileNo = String(1000 + (t.slug.length * 37 + t.name.charCodeAt(0)) % 9000).padStart(4, "0");
  const avg = ratingAgg._avg.rating ?? 0;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${t.name} cardboard cat ${VEHICLE_LABELS[t.vehicleType].toLowerCase()} template`,
    description: t.description,
    image: images.map((i) => siteUrl(i)),
    sku: t.slug,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url: siteUrl(`/fleet/${t.slug}`),
      priceCurrency: "USD",
      price: (t.pricingMode === "FREE" ? 0 : t.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
    ...(ratingAgg._count._all > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: ratingAgg._count._all } } : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={productLd} />
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
        <Link href="/fleet" className="hover:underline">The Fleet</Link> <span aria-hidden="true">/</span>{" "}
        <Link href={`/fleet?type=${t.vehicleType}`} className="hover:underline">{VEHICLE_LABELS[t.vehicleType]}</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-ink">{t.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="space-y-8">
          <ImageGallery images={images} alt={`${t.name} cardboard cat ${VEHICLE_LABELS[t.vehicleType].toLowerCase()}`} />
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                {t.codename && <FileTag>{t.codename}</FileTag>}
                <h1 className="font-stencil text-4xl leading-tight text-olive-dark sm:text-5xl">{t.name}</h1>
              </div>
              <FavoriteButton templateId={t.id} initial={favs.has(t.id)} className="mt-2 shrink-0" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {ratingAgg._count._all > 0 && (
                <a href="#reviews" className="inline-flex items-center gap-1.5 hover:underline">
                  <Stars rating={avg} /> {avg.toFixed(1)} ({ratingAgg._count._all})
                </a>
              )}
              <span className="text-muted-foreground">{recruitCount} recruits deployed</span>
              {earlyAccess && <Stamp size="sm" color="olive" rotate={-3}>Members early access</Stamp>}
            </div>
            <p className="mt-3 text-lg">{t.tagline}</p>
          </div>

          <PurchasePanel
            template={{
              id: t.id,
              name: t.name,
              pricingMode: t.pricingMode,
              priceCents: t.priceCents,
              suggestedPriceCents: t.suggestedPriceCents,
              commercialUpgradeCents: t.commercialUpgradeCents,
              classroomUpgradeCents: t.classroomUpgradeCents,
              membersOnly: t.membersOnly,
            }}
            ownedLicense={ownedLicense}
            memberIncluded={memberIncluded && !ownedLicense}
            signedIn={Boolean(user)}
            membershipName={siteConfig.membership.name}
          />

          {kit && (
            <Link href={`/shop/${kit.slug}`} className="group flex items-center gap-3 rounded-lg border-2 border-dashed border-ink/60 bg-kraft/20 p-3 transition hover:border-ink hover:bg-kraft/30">
              <Package className="size-8 shrink-0 text-kraft-dark" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold">Skip the cutting. Get the pre-cut kit.</p>
                <p className="text-sm text-muted-foreground">Die-cut cardboard, ships flat · {formatMoney(kit.priceCents)}</p>
              </div>
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          )}

          {bundles.map((b) => {
            const { fullCents, priceCents } = bundlePriceCents(b.items.map((i) => i.template), b.discountPercent);
            return (
              <Link key={b.id} href={`/fleet/bundles/${b.slug}`} className="group flex items-center gap-3 rounded-lg border-2 border-ink/30 bg-paper p-3 transition hover:border-ink">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stamp font-stencil text-xs text-paper">-{b.discountPercent}%</span>
                <div className="flex-1">
                  <p className="font-semibold">Part of the {b.name} bundle</p>
                  <p className="text-sm text-muted-foreground">
                    {b.items.length} templates for {formatMoney(priceCents)} <s>{formatMoney(fullCents)}</s>
                  </p>
                </div>
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="space-y-10">
          <section aria-labelledby="brief-h">
            <h2 id="brief-h" className="font-stencil text-2xl text-olive-dark">Mission brief</h2>
            <p className="mt-3 text-lg leading-relaxed">{t.description}</p>
            {guide && (
              <Link href={`/guides/${guide.slug}`} className="mt-4 inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
                <BookOpen className="size-4" /> {guide.title}
                {guide.premium && <span className="rounded bg-[#e7d27c] px-1.5 text-xs">Members</span>}
              </Link>
            )}
          </section>
          <SpecCard template={t} recruits={recruitCount} fileNo={fileNo} />
        </div>
        {video && (
          <section aria-labelledby="video-h" className="mx-auto w-full max-w-sm">
            <h2 id="video-h" className="mb-3 font-stencil text-2xl text-olive-dark">Watch the build</h2>
            <TikTokEmbed videoId={video.tiktokId} url={video.url} title={video.title} thumbnailUrl={video.thumbnailUrl} />
          </section>
        )}
      </div>

      {recruits.length > 0 && (
        <section aria-labelledby="recruits-h" className="mt-16">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 id="recruits-h" className="font-stencil text-2xl text-olive-dark">Recruits who built this</h2>
            <Link href={`/recruits?template=${t.slug}`} className="text-sm font-semibold underline">See all {recruitCount}</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recruits.map((p) => (
              <GalleryTile key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16">
        <Reviews templateId={t.id} canReview={Boolean(entitlement)} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-h" className="mt-16">
          <h2 id="related-h" className="mb-5 font-stencil text-2xl text-olive-dark">Also in the motor pool</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <TemplateCard key={r.id} template={r} rating={relatedRatings.get(r.id)} favorited={favs.has(r.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
