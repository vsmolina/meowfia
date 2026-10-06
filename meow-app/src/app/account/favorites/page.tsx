import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { PageTitle, EmptyState } from "@/components/account/page-title";
import { TemplateCard } from "@/components/fleet/template-card";
import { templateCardSelect } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Saved templates" };

export default async function FavoritesPage() {
  const user = await requireUser("/account/favorites");
  const favs = await db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { template: { select: templateCardSelect } } });
  return (
    <div>
      <PageTitle eyebrow="Wishlist" title="Saved templates" />
      {favs.length === 0 ? (
        <EmptyState title="Nothing saved yet" action={<Button asChild><Link href="/fleet">Browse the Fleet</Link></Button>}>
          Tap the bookmark on any template to save it for later.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favs.map((f) => (
            <TemplateCard key={f.templateId} template={f.template} favorited />
          ))}
        </div>
      )}
    </div>
  );
}
