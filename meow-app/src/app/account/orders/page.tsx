import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { formatDate, formatMoney } from "@/lib/format";
import { PageTitle, EmptyState } from "@/components/account/page-title";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await db.order.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }], status: { in: ["PAID", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <PageTitle eyebrow="Requisition history" title="Orders" />
      {orders.length === 0 ? (
        <EmptyState title="No requisitions on file" action={<Button asChild><Link href="/fleet">Browse the Fleet</Link></Button>}>
          Once you buy a template, kit, or merch, it shows up here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="block rounded-lg border-2 border-ink/80 bg-paper p-4 transition hover:-translate-y-0.5 hover:shadow-stamp-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-stencil text-lg">#{o.number}</p>
                  <div className="flex gap-2">
                    <StatusBadge status={o.status} />
                    <StatusBadge status={o.fulfillmentStatus} />
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.name}`).join(" · ")}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span>{formatDate(o.createdAt)}</span>
                  <span className="font-semibold">{formatMoney(o.totalCents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
