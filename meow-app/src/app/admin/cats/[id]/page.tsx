import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminPage } from "@/components/admin/ui";
import { CatForm } from "@/components/admin/cat-form";

export const metadata = { title: "Edit cat" };

export default async function EditCat({ params }: PageProps<"/admin/cats/[id]">) {
  const { id } = await params;
  const cat = await db.cat.findUnique({ where: { id } });
  if (!cat) notFound();
  return (
    <AdminPage title={`Edit ${cat.name}`}>
      <CatForm cat={cat} />
    </AdminPage>
  );
}
