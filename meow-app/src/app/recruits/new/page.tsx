import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { releasedWhere } from "@/lib/catalog";
import { SectionHeading } from "@/components/brand/stamp";
import { UploadForm } from "@/components/recruits/upload-form";

export const metadata: Metadata = { title: "Post your build", robots: { index: false } };

export default async function NewRecruitPage({ searchParams }: PageProps<"/recruits/new">) {
  await requireUser("/recruits/new");
  const sp = await searchParams;
  const templates = await db.template.findMany({ where: releasedWhere(), select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } });
  const def = typeof sp.template === "string" ? templates.find((t) => t.slug === sp.template)?.id : undefined;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading as="h1" eyebrow="Form 88 · Field report" title="Post your build" description="Every approved photo counts toward your cat's rank. We review submissions within a day or two." />
      <div className="mt-8 rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp">
        <UploadForm templates={templates} defaultTemplateId={def} />
      </div>
    </div>
  );
}
