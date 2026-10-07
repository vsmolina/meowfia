import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { publicUrl } from "@/lib/media";
import { formatMoney } from "@/lib/format";
import { syncPrintfulAction, toggleProductActiveAction } from "@/actions/admin/catalog";
import { AdminPage, Table } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Products" };

export default async function AdminProducts() {
  const products = await db.product.findMany({ orderBy: [{ active: "desc" }, { type: "asc" }, { name: "asc" }], include: { variants: true, _count: { select: { reviews: true } } } });
  return (
    <AdminPage
      title="Products"
      description={features.printful ? "Printful connected" : "Printful in mock mode (set PRINTFUL_API_KEY)"}
      actions={
        <>
          <ActionButton action={syncPrintfulAction}>Sync Printful</ActionButton>
          <Button asChild><Link href="/admin/products/new">New product</Link></Button>
        </>
      }
    >
      <Table head={["", "Product", "Type", "Price", "Variants", "Stock", "Visible"]}>
        {products.map((p) => {
          const finite = p.variants.filter((v) => v.inventory !== null);
          const stock = finite.length === p.variants.length ? finite.reduce((a, v) => a + (v.inventory ?? 0), 0) : null;
          return (
            <tr key={p.id} className={p.active ? "" : "opacity-60"}>
              <td><div className="relative size-10 overflow-hidden rounded bg-sand"><Image src={publicUrl((p.imageKeys as string[])[0])} alt="" fill sizes="40px" className="object-cover" /></div></td>
              <td><Link href={`/admin/products/${p.id}`} className="font-semibold underline">{p.name}</Link>{p.printfulProductId && <span className="ml-1 text-xs text-muted-foreground">(POD)</span>}</td>
              <td>{p.type === "KIT" ? "Kit" : p.category}</td>
              <td>{formatMoney(p.priceCents)}</td>
              <td>{p.variants.length}</td>
              <td className={stock !== null && stock <= 5 ? "font-bold text-stamp" : ""}>{stock === null ? "∞" : stock}</td>
              <td><ActionButton action={toggleProductActiveAction.bind(null, p.id)}>{p.active ? "Hide" : "Show"}</ActionButton></td>
            </tr>
          );
        })}
      </Table>
    </AdminPage>
  );
}
