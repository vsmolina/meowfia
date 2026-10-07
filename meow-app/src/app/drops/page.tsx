import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { releasedWhere, templateCardSelect } from "@/lib/catalog";
import { SectionHeading, Stamp } from "@/components/brand/stamp";
import { Countdown } from "@/components/brand/countdown";
import { NotifyForm } from "@/components/fleet/notify-form";
import { TemplateCard } from "@/components/fleet/template-card";

export const metadata: Metadata = { title: "Upcoming drops", description: "New cardboard cat vehicle templates, dropping soon. Get notified the moment they deploy.", alternates: { canonical: "/drops" } };

export default async function DropsPage() {
  const now = new Date();
  const [upcoming, recent] = await Promise.all([
    db.template.findMany({ where: { status: "PUBLISHED", releaseAt: { gt: now } }, orderBy: { releaseAt: "asc" }, include: { _count: { select: { dropNotifies: true } } } }),
    db.template.findMany({ where: releasedWhere(now), orderBy: { releaseAt: "desc" }, take: 3, select: templateCardSelect }),
  ]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Incoming transmissions" title="Upcoming Drops" description="New vehicles roll out on a schedule. Get a ping the moment one deploys, and members get early access." />
      <div className="mt-10 space-y-8">
        {upcoming.length === 0 && <p className="text-muted-foreground">No drops scheduled right now. Join the newsletter to hear about the next one first.</p>}
        {upcoming.map((t) => (
          <section key={t.id} className="grid gap-6 overflow-hidden rounded-2xl border-2 border-ink bg-olive-camo p-6 text-paper shadow-stamp md:grid-cols-[1fr_1.2fr] md:items-center">
            <Link href={`/drops/${t.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg border-2 border-ink">
              <Image src={publicUrl(t.coverImageKey)} alt={`${t.name} preview`} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover blur-[2px] brightness-90" />
              <span className="absolute inset-0 grid place-items-center">
                <Stamp size="lg" className="bg-paper/85">Classified</Stamp>
              </span>
            </Link>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#e7d27c]">Deploys {formatDate(t.releaseAt!, "long")}</p>
              <h2 className="mt-1 font-stencil text-3xl">{t.name}</h2>
              <p className="mt-2 text-paper/85">{t.tagline}</p>
              <Countdown to={t.releaseAt!.toISOString()} className="mt-5" />
              <p className="mt-3 text-sm text-paper/70">{t._count.dropNotifies} recruits waiting</p>
              <NotifyForm templateId={t.id} tone="dark" className="mt-4" />
            </div>
          </section>
        ))}
      </div>
      {recent.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 font-stencil text-2xl text-olive-dark">Recently deployed</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
