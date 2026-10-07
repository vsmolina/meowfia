import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { listTemplates, parseFleetFilters, ratingsFor, favoriteIds } from "@/lib/catalog";
import { publicUrl } from "@/lib/media";
import { SectionHeading } from "@/components/brand/stamp";
import { TemplateCard } from "@/components/fleet/template-card";
import { FleetFilterSidebar, FleetToolbar } from "@/components/fleet/fleet-filters";
import { EmptyState } from "@/components/account/page-title";

export const metadata: Metadata = {
  title: "The Fleet: cardboard cat vehicle templates",
  description: "Printable cardboard tank, plane, and warship templates for cats. Filter by vehicle, difficulty, cat size, and price. Free and pay-what-you-want options.",
  alternates: { canonical: "/fleet" },
};

export default async function FleetPage({ searchParams }: PageProps<"/fleet">) {
  const filters = parseFleetFilters(await searchParams);
  const user = await getSessionUser();
  const [templates, bundles] = await Promise.all([
    listTemplates(filters),
    db.bundle.findMany({ where: { active: true }, orderBy: { discountPercent: "asc" }, include: { _count: { select: { items: true } } } }),
  ]);
  const [ratings, favs] = await Promise.all([ratingsFor(templates.map((t) => t.id)), favoriteIds(user?.id)]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Motor pool inventory" title="The Fleet" description="Every vehicle comes as a printable PDF in US Letter and A4, with a cat-size rating and a full materials manifest." />

      <section aria-label="Bundles" className="mt-8">
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {bundles.map((b) => (
            <Link key={b.id} href={`/fleet/bundles/${b.slug}`} className="group relative flex w-64 shrink-0 snap-start items-center gap-3 overflow-hidden rounded-lg border-2 border-ink bg-paper p-2 pr-3 shadow-stamp-sm transition hover:-translate-y-0.5 sm:w-auto">
              <div className="relative size-14 shrink-0 overflow-hidden rounded border border-ink/50">
                <Image src={publicUrl(b.coverImageKey)} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-stencil">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {b._count.items} templates · <span className="font-bold text-stamp">save {b.discountPercent}%</span>
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0 transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Suspense>
              <FleetFilterSidebar />
            </Suspense>
          </div>
        </aside>
        <div>
          <h2 className="sr-only">Templates</h2>
          <Suspense>
            <FleetToolbar count={templates.length} />
          </Suspense>
          {templates.length === 0 ? (
            <EmptyState title="No vehicles match those orders">Try removing a filter or two.</EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((t, i) => (
                <TemplateCard key={t.id} template={t} rating={ratings.get(t.id)} favorited={favs.has(t.id)} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
