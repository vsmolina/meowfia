import Link from "next/link";
import { db, type Prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { AdminPage, Table } from "@/components/admin/ui";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const open = sp.fulfillment === "open";
  const status = typeof sp.status === "string" ? sp.status : "PAID";
  const where: Prisma.OrderWhereInput = {
    ...(status !== "ALL" ? { status: status as "PAID" } : {}),
    ...(open ? { fulfillmentStatus: { in: ["UNFULFILLED", "PROCESSING"] } } : {}),
    ...(q ? { OR: [{ email: { contains: q.toLowerCase() } }, ...(Number(q) ? [{ number: Number(q) }] : [])] } : {}),
  };
  const orders = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { items: { select: { name: true, quantity: true } } } });
  return (
    <AdminPage title="Orders" actions={<Button asChild variant="outline">
          <a href="/api/admin/export/orders" download>Export CSV</a>
        </Button>}>
      <form className="flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={q} placeholder="Search email or order #" className="h-10 w-64 rounded-md border-2 border-ink/40 bg-paper px-3 text-sm" />
        <select name="status" defaultValue={status} className="h-10 rounded-md border-2 border-ink/40 bg-paper px-2 text-sm">
          {["PAID", "PENDING", "REFUNDED", "CANCELLED", "ALL"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="fulfillment" value="open" defaultChecked={open} /> Needs fulfillment</label>
        <Button type="submit" size="sm">Filter</Button>
      </form>
      <Table head={["#", "Date", "Customer", "Items", "Total", "Payment", "Fulfillment"]}>
        {orders.map((o) => (
          <tr key={o.id}>
            <td><Link href={`/admin/orders/${o.id}`} className="font-semibold underline">{o.number}</Link></td>
            <td className="text-xs">{formatDate(o.paidAt ?? o.createdAt)}</td>
            <td className="max-w-48 truncate">{o.email}</td>
            <td className="max-w-64 truncate text-muted-foreground">{o.items.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.name}`).join(", ")}</td>
            <td>{formatMoney(o.totalCents)}</td>
            <td><StatusBadge status={o.status} /></td>
            <td><StatusBadge status={o.fulfillmentStatus} /></td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
