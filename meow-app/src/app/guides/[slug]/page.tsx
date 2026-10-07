import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { getActiveMembership, TIER_RANK } from "@/lib/access";
import { publicUrl } from "@/lib/media";
import { tiktokVideoId } from "@/lib/tiktok";
import { siteConfig } from "@/config/site";
import { FileTag, Stamp } from "@/components/brand/stamp";
import { TikTokEmbed } from "@/components/brand/tiktok-embed";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = await db.guide.findUnique({ where: { slug: (await params).slug } });
  return g ? { title: g.title, description: g.summary, alternates: { canonical: `/guides/${g.slug}` } } : {};
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const g = await db.guide.findUnique({ where: { slug }, include: { steps: { orderBy: { order: "asc" } }, template: { select: { slug: true, name: true } } } });
  if (!g || !g.published) notFound();

  let unlocked = !g.premium;
  if (!unlocked) {
    const user = await getSessionUser();
    const m = await getActiveMembership(user?.id);
    const ownsTemplate = user && g.templateId ? await db.entitlement.findFirst({ where: { templateId: g.templateId, OR: [{ userId: user.id }, { email: user.email }] } }) : null;
    unlocked = Boolean(ownsTemplate) || (m ? TIER_RANK[m.tier] >= TIER_RANK.OFFICER : false);
  }
  const visible = unlocked ? g.steps : g.steps.slice(0, 1);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/guides" className="text-sm text-muted-foreground hover:underline">← Field Manual</Link>
      <header className="mt-4">
        <FileTag>{g.premium ? "Premium guide" : "Free guide"} · {g.steps.length} steps</FileTag>
        <h1 className="mt-1 font-stencil text-4xl text-olive-dark sm:text-5xl">{g.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{g.intro}</p>
        {g.template && (
          <p className="mt-3 text-sm">
            Template: <Link href={`/fleet/${g.template.slug}`} className="font-semibold underline">{g.template.name}</Link>
          </p>
        )}
      </header>
      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-xl border-2 border-ink shadow-stamp">
        <Image src={publicUrl(g.coverImageKey)} alt="" fill priority sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
      </div>

      <ol className="mt-10 space-y-10">
        {visible.map((s) => (
          <li key={s.id} className="relative pl-14">
            <span className="absolute left-0 top-0 grid size-10 place-items-center rounded-full border-2 border-ink bg-olive font-stencil text-paper shadow-stamp-sm">{s.order}</span>
            <h2 className="font-stencil text-2xl">{s.title}</h2>
            <p className="mt-2 text-lg leading-relaxed">{s.body}</p>
            {s.imageKey && (
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg border-2 border-ink/70">
                <Image src={publicUrl(s.imageKey)} alt={`Step ${s.order}: ${s.title}`} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
              </div>
            )}
            {s.videoUrl && (
              <div className="mt-4 max-w-[260px]">
                <TikTokEmbed videoId={tiktokVideoId(s.videoUrl)} url={s.videoUrl} title={`Video: ${s.title}`} />
              </div>
            )}
          </li>
        ))}
      </ol>

      {!unlocked && (
        <div className="relative mt-10 overflow-hidden rounded-xl border-2 border-ink bg-dossier p-6 text-center shadow-stamp">
          <Stamp className="absolute right-4 top-4" rotate={8}>Classified</Stamp>
          <Lock className="mx-auto size-10 text-olive" aria-hidden="true" />
          <h2 className="mt-3 font-stencil text-2xl">{g.steps.length - 1} more steps are classified</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Unlock this guide by {g.template ? <>owning the <b>{g.template.name}</b> template, or </> : null}joining {siteConfig.membership.name} at Officer rank or above.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {g.template && (
              <Button asChild>
                <Link href={`/fleet/${g.template.slug}`}>Get the template</Link>
              </Button>
            )}
            <Button asChild variant="kraft">
              <Link href="/barracks">Join {siteConfig.membership.name}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/sign-in?callbackUrl=/guides/${g.slug}`}>Sign in</Link>
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
