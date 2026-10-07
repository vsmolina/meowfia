import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminPage } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id }, include: { variants: { orderBy: { sku: "asc" } } } });
  if (!p) notFound();
  return (
    <AdminPage title={p.name} actions={<Button asChild variant="outline" size="sm"><Link href={`/shop/${p.slug}`} target="_blank">View live</Link></Button>}>
      <ProductForm product={p} />
    </AdminPage>
  );
}
