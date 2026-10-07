import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, Heart, Plane, Ship, Shield, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { publicUrl } from "@/lib/media";
import { formatCompact, formatMoney } from "@/lib/format";
import { getSessionUser } from "@/lib/auth-helpers";
import { releasedWhere, templateCardSelect, ratingsFor, favoriteIds } from "@/lib/catalog";
import { Stamp, SectionHeading, FileTag } from "@/components/brand/stamp";
import { Countdown } from "@/components/brand/countdown";
import { TikTokEmbed } from "@/components/brand/tiktok-embed";
import { TemplateCard } from "@/components/fleet/template-card";
import { NotifyForm } from "@/components/fleet/notify-form";
import { GalleryTile } from "@/components/recruits/gallery-tile";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const now = new Date();
  const user = await getSessionUser();
  const [featuredVideo, featured, upcoming, recruits, recruitOfWeek, magnet, templateCount, recruitCount, kits] = await Promise.all([
    db.video.findFirst({ where: { featured: true }, orderBy: { publishedAt: "desc" } }),
    db.template.findMany({ where: { ...releasedWhere(now), featured: true }, select: templateCardSelect, take: 3, orderBy: { releaseAt: "desc" } }),
    db.template.findFirst({ where: { status: "PUBLISHED", releaseAt: { gt: now } }, orderBy: { releaseAt: "asc" } }),
    db.galleryPost.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 8, include: { template: { select: { name: true } } } }),
    db.galleryPost.findFirst({ where: { status: "APPROVED", featuredAt: { not: null } }, orderBy: { featuredAt: "desc" }, include: { template: { select: { name: true, slug: true } }, user: { select: { name: true, handle: true } } } }),
    db.template.findFirst({ where: { isLeadMagnet: true, status: "PUBLISHED" }, select: { name: true, slug: true, coverImageKey: true } }),
    db.template.count({ where: releasedWhere(now) }),
    db.galleryPost.count({ where: { status: "APPROVED" } }),
    db.product.findMany({ where: { active: true, featured: true }, take: 3, orderBy: { createdAt: "asc" }, include: { variants: { select: { inventory: true } } } }),
  ]);
  const [ratings, favs] = await Promise.all([ratingsFor(featured.map((t) => t.id)), favoriteIds(user?.id)]);
  const s = siteConfig.stats;

  const proof = [
    { value: formatCompact(s.tiktokFollowers), label: "followers on TikTok" },
    { value: formatCompact(s.tiktokLikes), label: "likes" },
    { value: `${recruitCount}+`, label: "recruits deployed" },
    { value: String(templateCount), label: "templates in the fleet" },
  ];

  return (
    <>
      {sp.welcome === "recruit" && (
        <div className="border-b-2 border-ink bg-[#e7d27c] px-4 py-2 text-center text-sm font-semibold text-ink">
          🎖️ A friend sent you! Use code <b>{siteConfig.commerce.referral.newCustomerCouponCode}</b> for 10% off your first order.
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b-4 border-ink bg-kraft">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(248_242_228/0.35),transparent_60%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Stamp size="sm" rotate={-4}>Top secret</Stamp>
              <FileTag className="text-ink/70">Mission briefing · Operation Box Fort</FileTag>
            </div>
            <h1 className="mt-5 font-stencil text-[2.6rem] leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
              Cardboard war machines for <span className="text-paper [text-shadow:3px_3px_0_var(--ink)]">very serious</span> cats.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink/85 sm:text-xl">
              Printable templates and pre-cut kits for tanks, fighter planes, and battleships, sized for kittens through full chonks. As seen on TikTok, where {formatCompact(s.tiktokFollowers)}+ followers watch every vehicle roll off the line.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="stamp" className="h-14 px-7 font-stencil text-lg tracking-wider">
                <Link href="#enlist">
                  <Gift /> Enlist your cat, free
                </Link>
              </Button>
              <Button asChild size="lg" className="h-14 px-7 font-stencil text-lg tracking-wider">
                <Link href="/fleet">
                  Browse the Fleet <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
          {featuredVideo && (
            <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[320px]">
              <div className="absolute -inset-3 rotate-2 rounded-2xl border-2 border-ink bg-olive" aria-hidden="true" />
              <TikTokEmbed videoId={featuredVideo.tiktokId} url={featuredVideo.url} title={featuredVideo.title} thumbnailUrl={featuredVideo.thumbnailUrl} className="relative" priority />
              <Stamp className="absolute -bottom-4 -left-6 bg-paper" color="ink" size="sm" rotate={-8}>
                {formatCompact(s.avgViewsPerVideo)} avg views
              </Stamp>
            </div>
          )}
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section aria-label="By the numbers" className="border-b-2 border-ink bg-ink text-paper">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 divide-paper/15 px-4 sm:grid-cols-4 sm:divide-x sm:px-6">
          {proof.map((p) => (
            <li key={p.label} className="px-2 py-4 text-center">
              <p className="font-stencil text-2xl text-[#e7d27c] sm:text-3xl">{p.value}</p>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-paper/70">{p.label}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
        {/* ── Featured templates ── */}
        <section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="File 01 · Most requisitioned" title="Featured vehicles" description="The builds everyone's cat is fighting over this month." />
            <Button asChild variant="outline">
              <Link href="/fleet">
                View the full fleet <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.06}>
                <TemplateCard template={t} rating={ratings.get(t.id)} favorited={favs.has(t.id)} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Upcoming drop ── */}
        {upcoming && upcoming.releaseAt && (
          <Reveal>
            <section className="relative overflow-hidden rounded-2xl border-2 border-ink bg-olive-camo text-paper shadow-stamp">
              <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-ink">
                  <Image src={publicUrl(upcoming.coverImageKey)} alt={`${upcoming.name} preview`} fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover blur-[2px] brightness-90" />
                  <div className="absolute inset-0 grid place-items-center bg-ink/30">
                    <Stamp size="lg" rotate={-10} className="bg-paper/85">Classified</Stamp>
                  </div>
                </div>
                <div>
                  <FileTag className="text-[#e7d27c]">Incoming transmission · Next drop</FileTag>
                  <h2 className="mt-2 font-stencil text-4xl sm:text-5xl">{upcoming.name}</h2>
                  <p className="mt-3 text-paper/85">{upcoming.tagline}</p>
                  <Countdown to={upcoming.releaseAt.toISOString()} size="lg" className="mt-6" />
                  {upcoming.earlyAccessHours > 0 && (
                    <p className="mt-4 text-sm text-paper/80">
                      <Sparkles className="mr-1 inline size-4" aria-hidden="true" />
                      {siteConfig.membership.name} members get it {upcoming.earlyAccessHours} hours early.{" "}
                      <Link href="/barracks" className="font-semibold underline">Enlist</Link>
                    </p>
                  )}
                  <NotifyForm templateId={upcoming.id} tone="dark" className="mt-5 max-w-lg" />
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* ── Divisions ── */}
        <section>
          <SectionHeading eyebrow="File 02 · Choose your branch" title="Pick a division" className="mb-8" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { href: "/fleet?type=TANK", title: "Armored Division", copy: "Tanks with turrets, hatches, and floors rated for the loaf.", icon: Shield },
              { href: "/fleet?type=PLANE", title: "Air Force", copy: "Fighters and bombers with extra-wide cockpits for dramatic entries.", icon: Plane },
              { href: "/fleet?type=BOAT", title: "Navy", copy: "Battleships, subs, and patrol boats for the admirals of the couch.", icon: Ship },
            ].map((d, i) => (
              <Reveal key={d.href} delay={i * 0.06}>
                <Link href={d.href} className="group flex h-full flex-col rounded-xl border-2 border-ink bg-paper p-6 shadow-stamp transition hover:-translate-y-1 hover:bg-[#e7d27c]">
                  <d.icon className="size-9 text-olive transition group-hover:rotate-[-8deg]" aria-hidden="true" />
                  <h3 className="mt-4 font-stencil text-2xl">{d.title}</h3>
                  <p className="mt-1 text-muted-foreground group-hover:text-ink/80">{d.copy}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-semibold">
                    Deploy <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Recruits ── */}
        <section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="File 03 · Field reports" title="Fresh recruits" description="Real cats, real builds, sent in by the community. Post yours to earn rank." />
            <Button asChild variant="outline">
              <Link href="/recruits">
                See all recruits <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            {recruitOfWeek && (
              <div className="rounded-xl border-2 border-ink bg-[#e7d27c] p-4 shadow-stamp">
                <FileTag className="text-ink/70">Commendation</FileTag>
                <h3 className="font-stencil text-2xl">Recruit of the Week</h3>
                <GalleryTile post={recruitOfWeek} className="mt-3" sizes="(max-width: 1024px) 100vw, 400px" />
                <p className="mt-3 text-sm">
                  {recruitOfWeek.catName} reporting for duty in the {recruitOfWeek.template?.name ?? "custom build"}
                  {recruitOfWeek.user?.handle && <> · by @{recruitOfWeek.user.handle}</>}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {recruits.slice(0, 8).map((p) => (
                <GalleryTile key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Lead magnet ── */}
        <section id="enlist" className="scroll-mt-24">
          <Reveal>
            <div className="tape relative grid overflow-hidden rounded-2xl border-2 border-ink bg-dossier shadow-stamp lg:grid-cols-[1fr_1.1fr]">
              {magnet && (
                <div className="relative min-h-64 border-b-2 border-ink lg:border-b-0 lg:border-r-2">
                  <Image src={publicUrl(magnet.coverImageKey)} alt={`${magnet.name} free template`} fill sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" />
                  <Stamp className="absolute left-4 top-4 bg-paper/85" color="olive" rotate={-6}>Free issue</Stamp>
                </div>
              )}
              <div className="p-6 sm:p-10">
                <FileTag>Form 1-A · Enlistment</FileTag>
                <h2 className="mt-2 font-stencil text-4xl text-olive-dark">Enlist your cat, free.</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  Get the <b className="text-ink">{magnet?.name ?? "starter"}</b> template (US Letter + A4) in your inbox, plus build tips and first dibs on new drops. Your first mission takes about 45 minutes.
                </p>
                <ul className="mt-4 space-y-1 text-sm">
                  <li>✔ Full printable template, both paper sizes</li>
                  <li>✔ Cat-safe materials checklist</li>
                  <li>✔ Unsubscribe any time, no hard feelings</li>
                </ul>
                <NewsletterForm source="lead_magnet" cta="Send my template" withName className="mt-6" />
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Shop + Barracks ── */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-stamp sm:p-8">
            <FileTag>File 04 · Quartermaster</FileTag>
            <h2 className="mt-1 font-stencil text-3xl text-olive-dark">No knife? No problem.</h2>
            <p className="mt-2 text-muted-foreground">Pre-cut kits ship flat. Just fold, tape, and deploy. Plus crew tees, stickers, and rank patches.</p>
            <ul className="mt-5 grid grid-cols-3 gap-3">
              {kits.map((k) => (
                <li key={k.id}>
                  <Link href={`/shop/${k.slug}`} className="group block">
                    <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-ink bg-sand">
                      <Image src={publicUrl((k.imageKeys as string[])[0])} alt={k.name} fill sizes="(max-width: 640px) 33vw, 180px" className="object-cover transition group-hover:scale-105" />
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-sm font-semibold">{k.name}</p>
                    <p className="text-sm text-muted-foreground">{formatMoney(k.priceCents)}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6">
              <Link href="/shop">Visit the shop <ArrowRight /></Link>
            </Button>
          </div>
          <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-ink p-6 text-paper shadow-stamp sm:p-8">
            <FileTag className="text-[#e7d27c]">File 05 · Membership</FileTag>
            <h2 className="mt-1 font-stencil text-3xl">{siteConfig.membership.name}</h2>
            <p className="mt-2 text-paper/80">A members-only template every month, early access to every drop, shop discounts, and a vote on what gets built next.</p>
            <ul className="mt-5 space-y-2">
              {siteConfig.membership.tiers.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md border border-paper/20 bg-paper/5 px-3 py-2">
                  <span className="font-stencil">{t.name}</span>
                  <span className="text-sm text-paper/80">from {formatMoney(t.monthlyCents)}/mo</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="kraft" className="mt-6">
              <Link href="/barracks">Report to the Barracks <ArrowRight /></Link>
            </Button>
          </div>
        </section>

        {/* ── Support ── */}
        <section className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-ink/50 p-8 text-center">
          <Heart className="size-8 text-stamp" aria-hidden="true" />
          <h2 className="font-stencil text-3xl text-olive-dark">Keep the motor pool running</h2>
          <p className="max-w-xl text-muted-foreground">Every tip buys tape, glue, and the occasional bribe treat for the crew. Thank you for being here.</p>
          <Button asChild variant="stamp" size="lg">
            <Link href="/support">Support the mission</Link>
          </Button>
        </section>
      </div>
    </>
  );
}
