import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/media";
import { deleteCatAction } from "@/actions/admin/content";
import { AdminPage, Section } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/form";
import { CatForm } from "@/components/admin/cat-form";

export const metadata = { title: "Cats" };

export default async function AdminCats() {
  const cats = await db.cat.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { videos: true } } } });
  return (
    <AdminPage title="Cats" description="The crew shown on /crew. Brand-level details live in src/config/site.ts.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((c) => (
          <div key={c.id} className="rounded-lg border-2 border-ink bg-paper p-3">
            <div className="relative aspect-square overflow-hidden rounded"><Image src={publicUrl(c.imageKey)} alt={c.name} fill sizes="240px" className="object-cover" /></div>
            <p className="mt-2 font-stencil text-lg">{c.rank} {c.name}</p>
            <p className="text-xs text-muted-foreground">{c._count.videos} videos</p>
            <div className="mt-2 flex gap-2">
              <Link href={`/admin/cats/${c.id}`} className="text-sm font-semibold underline">Edit</Link>
              <ConfirmButton action={deleteCatAction.bind(null, c.id)} />
            </div>
          </div>
        ))}
      </div>
      <Section title="Add a cat">
        <CatForm />
      </Section>
    </AdminPage>
  );
}
