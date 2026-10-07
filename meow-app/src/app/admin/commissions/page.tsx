import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { COMMISSION_STATUS_LABELS } from "@/lib/labels";
import { AdminPage, Table } from "@/components/admin/ui";
import { StatusBadge } from "@/components/site/status-badge";

export const metadata = { title: "Commissions" };

export default async function AdminCommissions() {
  const list = await db.commission.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <AdminPage title="Commissions" description="Requests appear here once the deposit is paid. REQUESTED = deposit not completed.">
      <Table head={["Date", "Customer", "Build", "Deposit", "Quote", "Status"]}>
        {list.map((c) => (
          <tr key={c.id}>
            <td className="text-xs">{formatDate(c.createdAt)}</td>
            <td><Link href={`/admin/commissions/${c.id}`} className="font-semibold underline">{c.name}</Link><span className="block text-xs text-muted-foreground">{c.email}</span></td>
            <td className="capitalize">{c.subjectType} · {c.catCount} cat{c.catCount > 1 ? "s" : ""}</td>
            <td>{c.depositPaidAt ? formatMoney(c.depositCents) : "unpaid"}</td>
            <td>{c.quoteCents ? formatMoney(c.quoteCents) : "-"}</td>
            <td><StatusBadge status={c.status} label={COMMISSION_STATUS_LABELS[c.status]} /></td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
