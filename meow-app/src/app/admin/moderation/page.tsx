import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/media";
import { featurePostAction, deletePostAction } from "@/actions/admin/content";
import { AdminPage, Section } from "@/components/admin/ui";
import { ActionButton, ConfirmButton } from "@/components/admin/form";
import { ModerationCard } from "@/components/admin/moderation-card";

export const metadata = { title: "Moderation" };

export default async function Moderation() {
  const [pending, recent] = await Promise.all([
    db.galleryPost.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, email: true } }, template: { select: { name: true } } } }),
    db.galleryPost.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 24, include: { template: { select: { name: true } } } }),
  ]);
  return (
    <AdminPage title="Moderation" description="Approve community photos before they go public. Approvals email the recruit (with promotion notices).">
      {pending.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-ink/40 p-6 text-center text-muted-foreground">Queue clear. Nice work, Commander.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {pending.map((p) => <ModerationCard key={p.id} post={p} />)}
        </div>
      )}
      <Section title="Recently approved: pick a Recruit of the Week">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {recent.map((p) => (
            <div key={p.id} className="space-y-1 text-xs">
              <Link href={`/recruits/${p.id}`} target="_blank" className="relative block aspect-[4/5] overflow-hidden rounded border-2 border-ink/40">
                <Image src={publicUrl(p.imageKey)} alt={p.catName} fill sizes="160px" className="object-cover" />
                {p.featuredAt && <span className="absolute left-1 top-1 rounded bg-[#e7d27c] px-1 font-bold">★</span>}
              </Link>
              <p className="truncate font-semibold">{p.catName} · ♥ {p.likesCount}</p>
              <div className="flex gap-1">
                <ActionButton action={featurePostAction.bind(null, p.id)} successMessage="Featured">Feature</ActionButton>
                <ConfirmButton action={deletePostAction.bind(null, p.id)} label="" confirmLabel="Sure?" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </AdminPage>
  );
}
