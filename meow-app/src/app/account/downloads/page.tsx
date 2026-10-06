import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { downloadUrl } from "@/lib/downloads";
import { publicUrl } from "@/lib/media";
import { syncMembershipEntitlements, getActiveMembership, membershipIncludes } from "@/lib/access";
import { LICENSE_LABELS } from "@/lib/labels";
import { PageTitle, EmptyState } from "@/components/account/page-title";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Downloads" };
// Signed links are generated per request and must never be cached
export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const user = await requireUser("/account/downloads");
  await syncMembershipEntitlements(user);
  const [ents, membership] = await Promise.all([
    db.entitlement.findMany({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
      include: { template: { select: { slug: true, name: true, coverImageKey: true, pricingMode: true, membersOnly: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getActiveMembership(user.id),
  ]);

  return (
    <div>
      <PageTitle eyebrow="Armory" title="Downloads">
        <p className="text-sm text-muted-foreground">Links refresh each visit and expire after 15 minutes.</p>
      </PageTitle>
      {ents.length === 0 ? (
        <EmptyState title="Your armory is empty" action={<Button asChild><Link href="/fleet?price=free">Get a free template</Link></Button>}>
          Purchased and free templates live here forever, in both US Letter and A4.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {ents.map((e) => {
            const lapsed = e.source === "MEMBERSHIP" && !membershipIncludes(membership?.tier, e.template);
            return (
              <li key={e.id} className="flex gap-4 rounded-lg border-2 border-ink/80 bg-paper p-3">
                <Link href={`/fleet/${e.template.slug}`} className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded border border-ink/40">
                  <Image src={publicUrl(e.template.coverImageKey)} alt="" fill sizes="112px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-stencil leading-tight">{e.template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {LICENSE_LABELS[e.license]} license · {e.source === "MEMBERSHIP" ? "Membership" : e.source === "FREE" ? "Free" : "Purchased"}
                  </p>
                  {lapsed ? (
                    <p className="mt-2 text-sm text-stamp">
                      Membership access ended. <Link className="underline" href={`/fleet/${e.template.slug}`}>Buy it to keep it</Link>.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <a href={downloadUrl(e.id, "letter")}><Download /> Letter</a>
                      </Button>
                      <Button asChild size="sm" variant="kraft">
                        <a href={downloadUrl(e.id, "a4")}><Download /> A4</a>
                      </Button>
                    </div>
                  )}
                  {e.license === "PERSONAL" && !lapsed && e.template.pricingMode !== "FREE" && (
                    <Link href={`/fleet/${e.template.slug}#license`} className="mt-1 inline-block text-xs font-semibold underline">
                      Upgrade license
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
