import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteTemplateAction } from "@/actions/admin/catalog";
import { AdminPage } from "@/components/admin/ui";
import { TemplateForm } from "@/components/admin/template-form";
import { ConfirmButton } from "@/components/admin/form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Edit template" };

export default async function EditTemplate({ params }: PageProps<"/admin/templates/[id]">) {
  const { id } = await params;
  const t = await db.template.findUnique({ where: { id } });
  if (!t) notFound();
  return (
    <AdminPage
      title={t.name}
      actions={
        <>
          <Button asChild variant="outline" size="sm"><Link href={`/fleet/${t.slug}`} target="_blank">View live</Link></Button>
          <ConfirmButton action={deleteTemplateAction.bind(null, t.id)} label="Delete / archive" />
        </>
      }
    >
      <TemplateForm template={t} />
    </AdminPage>
  );
}
