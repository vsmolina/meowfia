import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { bundlePriceCents } from "@/lib/pricing";
import { templateCardSelect, ratingsFor, favoriteIds } from "@/lib/catalog";
import { publicUrl } from "@/lib/media";
import { formatMoney } from "@/lib/format";
import { FileTag, Stamp } from "@/components/brand/stamp";
import { TemplateCard } from "@/components/fleet/template-card";
import { AddBundleButton } from "@/components/fleet/add-bundle-button";

export async function generateMetadata({ params }: PageProps<"/fleet/bundles/[slug]">): Promise<Metadata> {
  const b = await db.bundle.findUnique({ where: { slug: (await params).slug } });
  return b ? { title: `${b.name} bundle`, description: b.description, alternates: { canonical: `/fleet/bundles/${b.slug}` } } : {};
}

export default async function BundlePage({ params }: PageProps<"/fleet/bundles/[slug]">) {
  const { slug } = await params;
  const b = await db.bundle.findUnique({ where: { slug }, include: { items: { include: { template: { select: { ...templateCardSelect, commercialUpgradeCents: true, classroomUpgradeCents: true } } } } } });
  if (!b || !b.active) notFound();
  const user = await getSessionUser();
  const templates = b.items.map((i) => i.template);
  const [ratings, favs, owned] = await Promise.all([
    ratingsFor(templates.map((t) => t.id)),
    favoriteIds(user?.id),
    user ? db.entitlement.count({ where: { templateId: { in: templates.map((t) => t.id) }, OR: [{ userId: user.id }, { email: user.email }] } }) : 0,
  ]);
  const { fullCents, priceCents } = bundlePriceCents(templates, b.discountPercent);
  const upgrades = {
    COMMERCIAL: templates.reduce((a, t) => a + t.commercialUpgradeCents, 0),
    CLASSROOM: templates.reduce((a, t) => a + t.classroomUpgradeCents, 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border-2 border-ink shadow-stamp">
          <Image src={publicUrl(b.coverImageKey)} alt={`${b.name} bundle`} fill priority sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" />
          <Stamp className="absolute left-4 top-4 bg-paper/85" rotate={-6}>Save {b.discountPercent}%</Stamp>
        </div>
        <div className="space-y-4">
          <FileTag>Bundle · {templates.length} templates</FileTag>
          <h1 className="font-stencil text-4xl text-olive-dark sm:text-5xl">{b.name}</h1>
          <p className="text-lg">{b.description}</p>
          <p className="font-stencil text-4xl">
            {formatMoney(priceCents)} <s className="text-xl text-muted-foreground">{formatMoney(fullCents)}</s>
          </p>
          {owned > 0 && <p className="rounded-md bg-[#e7d27c]/40 p-2 text-sm">You already own {owned} of these. The bundle still includes them, so you might save more buying the rest individually.</p>}
          <div className="rounded-xl border-2 border-ink bg-paper p-4 shadow-stamp">
            <AddBundleButton bundleId={b.id} name={b.name} priceCents={priceCents} upgrades={upgrades} />
          </div>
        </div>
      </div>
      <h2 className="mt-14 mb-5 font-stencil text-2xl text-olive-dark">What&apos;s in the crate</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} rating={ratings.get(t.id)} favorited={favs.has(t.id)} />
        ))}
      </div>
    </div>
  );
}
