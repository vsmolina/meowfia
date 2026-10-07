import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/media";
import { formatDate, formatMoney } from "@/lib/format";
import { VEHICLE_LABELS } from "@/lib/labels";
import { AdminPage, Table } from "@/components/admin/ui";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Templates" };

export default async function AdminTemplates() {
  const templates = await db.template.findMany({ orderBy: [{ status: "asc" }, { releaseAt: "desc" }], include: { _count: { select: { entitlements: true, galleryPosts: true, orderItems: true } } } });
  const now = new Date();
  return (
    <AdminPage title="Templates" actions={<Button asChild><Link href="/admin/templates/new">New template</Link></Button>}>
      <Table head={["", "Name", "Type", "Price", "Status", "Release", "Sold", "Owners", "Recruits"]}>
        {templates.map((t) => (
          <tr key={t.id}>
            <td><div className="relative size-10 overflow-hidden rounded"><Image src={publicUrl(t.coverImageKey)} alt="" fill sizes="40px" className="object-cover" /></div></td>
            <td><Link href={`/admin/templates/${t.id}`} className="font-semibold underline">{t.name}</Link>{t.isLeadMagnet && <span className="ml-1 text-xs">🧲</span>}{t.membersOnly && <span className="ml-1 text-xs">🎖️</span>}</td>
            <td>{VEHICLE_LABELS[t.vehicleType]}</td>
            <td>{t.pricingMode === "FREE" ? "Free" : `${t.pricingMode === "PWYW" ? "PWYW ≥ " : ""}${formatMoney(t.priceCents)}`}</td>
            <td><StatusBadge status={t.status === "PUBLISHED" && t.releaseAt && t.releaseAt > now ? "PENDING" : t.status} label={t.status === "PUBLISHED" && t.releaseAt && t.releaseAt > now ? "scheduled" : undefined} /></td>
            <td className="text-xs">{t.releaseAt ? formatDate(t.releaseAt) : "-"}</td>
            <td>{t._count.orderItems}</td>
            <td>{t._count.entitlements}</td>
            <td>{t._count.galleryPosts}</td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
