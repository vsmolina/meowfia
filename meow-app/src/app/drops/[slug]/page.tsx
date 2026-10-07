import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership, isInEarlyAccess, isReleased } from "@/lib/access";
import { publicUrl } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { CAT_SIZE_LABELS, DIFFICULTY_LABELS, VEHICLE_LABELS } from "@/lib/labels";
import { siteConfig } from "@/config/site";
import { FileTag, Stamp } from "@/components/brand/stamp";
import { Countdown } from "@/components/brand/countdown";
import { NotifyForm } from "@/components/fleet/notify-form";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/drops/[slug]">): Promise<Metadata> {
  const t = await db.template.findUnique({ where: { slug: (await params).slug } });
  return t ? { title: `${t.name}: dropping soon`, description: t.tagline } : {};
}

export default async function DropPage({ params }: PageProps<"/drops/[slug]">) {
  const { slug } = await params;
  const t = await db.template.findUnique({ where: { slug } });
  if (!t || t.status !== "PUBLISHED") notFound();
  if (isReleased(t) || !t.releaseAt) redirect(`/fleet/${t.slug}`);
  const user = await getSessionUser();
  const m = await getActiveMembership(user?.id);
  const early = isInEarlyAccess(t, m?.tier);
  const earlyOpens = t.earlyAccessHours > 0 ? new Date(t.releaseAt.getTime() - t.earlyAccessHours * 3_600_000) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="overflow-hidden rounded-2xl border-2 border-ink bg-olive-camo text-paper shadow-stamp">
        <div className="relative aspect-[16/9]">
          <Image src={publicUrl(t.coverImageKey)} alt={`${t.name} preview`} fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover blur-[3px] brightness-75" />
          <span className="absolute inset-0 grid place-items-center">
            <Stamp size="lg" className="bg-paper/85" rotate={-8}>Top secret</Stamp>
          </span>
        </div>
        <div className="p-6 sm:p-10">
          <FileTag className="text-[#e7d27c]">{t.codename ?? "Upcoming drop"}</FileTag>
          <h1 className="mt-1 font-stencil text-4xl sm:text-5xl">{t.name}</h1>
          <p className="mt-2 text-lg text-paper/85">{t.tagline}</p>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-paper/70">
            {VEHICLE_LABELS[t.vehicleType]} · {DIFFICULTY_LABELS[t.difficulty]} · {CAT_SIZE_LABELS[t.catSize]} · Deploys {formatDate(t.releaseAt, "long")}
          </p>
          <Countdown to={t.releaseAt.toISOString()} size="lg" className="mt-6" />
          {early ? (
            <div className="mt-6 rounded-lg border-2 border-[#e7d27c] bg-ink/40 p-4">
              <p className="flex items-center gap-2 font-semibold text-[#e7d27c]"><Sparkles className="size-5" /> Early access is open for you</p>
              <Button asChild variant="kraft" className="mt-3"><Link href={`/fleet/${t.slug}`}>Get it now</Link></Button>
            </div>
          ) : (
            <>
              <NotifyForm templateId={t.id} tone="dark" className="mt-6 max-w-lg" />
              {earlyOpens && (
                <p className="mt-4 text-sm text-paper/80">
                  <Sparkles className="mr-1 inline size-4" aria-hidden="true" />
                  {siteConfig.membership.name} members get access {t.earlyAccessHours} hours early ({formatDate(earlyOpens)}). <Link href="/barracks" className="font-semibold underline">Enlist</Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
