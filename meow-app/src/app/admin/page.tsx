import Link from "next/link";
import { db, type Channel } from "@/lib/db";
import { formatDate, formatMoney, nowMs } from "@/lib/format";
import { CHANNEL_LABELS } from "@/lib/labels";
import { tierConfig } from "@/lib/access";
import { AdminPage, Section, StatCard, Table } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";

const CHANNELS = Object.keys(CHANNEL_LABELS) as Channel[];
const DAY = 86_400_000;

function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const days = [30, 90, 365].includes(Number(sp.range)) ? Number(sp.range) : 90;
  const now = nowMs();
  const since = new Date(now - days * DAY);
  const prevSince = new Date(since.getTime() - days * DAY);

  const [events, prevTotal, allTime, recentOrders, pendingPosts, lowStock, memberships, subscribers, newSubs, referredAgg, unfulfilled, inquiries] = await Promise.all([
    db.revenueEvent.findMany({ where: { occurredAt: { gte: since } }, select: { channel: true, amountCents: true, occurredAt: true, referred: true } }),
    db.revenueEvent.aggregate({ where: { occurredAt: { gte: prevSince, lt: since } }, _sum: { amountCents: true } }),
    db.revenueEvent.aggregate({ _sum: { amountCents: true } }),
    db.order.findMany({ where: { status: "PAID" }, orderBy: { paidAt: "desc" }, take: 8, include: { items: { select: { name: true } } } }),
    db.galleryPost.count({ where: { status: "PENDING" } }),
    db.productVariant.findMany({ where: { inventory: { not: null, lte: 5 }, product: { active: true } }, include: { product: { select: { name: true, id: true } } }, orderBy: { inventory: "asc" } }),
    db.membership.findMany({ where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] }, currentPeriodEnd: { gt: new Date() } } }),
    db.subscriber.count({ where: { status: "SUBSCRIBED" } }),
    db.subscriber.count({ where: { status: "SUBSCRIBED", createdAt: { gte: since } } }),
    db.revenueEvent.aggregate({ where: { occurredAt: { gte: since }, referred: true }, _sum: { amountCents: true } }),
    db.order.count({ where: { status: "PAID", fulfillmentStatus: { in: ["UNFULFILLED", "PROCESSING"] } } }),
    db.inquiry.count({ where: { status: "NEW" } }),
  ]);

  const total = events.reduce((a, e) => a + e.amountCents, 0);
  const prev = prevTotal._sum.amountCents ?? 0;
  const change = prev ? Math.round(((total - prev) / prev) * 100) : null;
  const byChannel = Object.fromEntries(CHANNELS.map((c) => [c, 0])) as Record<Channel, number>;
  for (const e of events) byChannel[e.channel] += e.amountCents;
  const mrr = memberships.reduce((a, m) => {
    const t = tierConfig(m.tier);
    return a + (m.interval === "YEAR" ? Math.round(t.annualCents / 12) : t.monthlyCents);
  }, 0);

  // Weekly stacked series
  const weeks = new Map<number, Record<string, number | string>>();
  for (let t = weekStart(since).getTime(); t <= now; t += 7 * DAY) {
    weeks.set(t, { week: formatDate(new Date(t)).replace(/, \d{4}$/, ""), ...Object.fromEntries(CHANNELS.map((c) => [c, 0])) });
  }
  for (const e of events) {
    const row = weeks.get(weekStart(e.occurredAt).getTime());
    if (row) row[e.channel] = Number(row[e.channel]) + e.amountCents / 100;
  }
  const activeChannels = CHANNELS.filter((c) => byChannel[c] > 0);

  return (
    <AdminPage
      title="Dashboard"
      description={`Last ${days} days`}
      actions={
        <>
          {[30, 90, 365].map((d) => (
            <Button key={d} asChild size="sm" variant={d === days ? "default" : "outline"}>
              <Link href={`/admin?range=${d}`}>{d === 365 ? "1 year" : `${d} days`}</Link>
            </Button>
          ))}
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(total)} hint={change === null ? "vs previous period: n/a" : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% vs previous ${days}d`} />
        <StatCard label="Membership MRR" value={formatMoney(mrr)} hint={`${memberships.length} active members`} href="/admin/customers?filter=members" />
        <StatCard label="Subscribers" value={subscribers.toLocaleString()} hint={`+${newSubs} this period`} href="/admin/broadcasts" />
        <StatCard label="All-time revenue" value={formatMoney(allTime._sum.amountCents ?? 0)} hint={`${formatMoney(referredAgg._sum.amountCents ?? 0)} from referrals this period`} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="To fulfill" value={unfulfilled} href="/admin/orders?fulfillment=open" tone={unfulfilled ? "alert" : "default"} />
        <StatCard label="Moderation queue" value={pendingPosts} href="/admin/moderation" tone={pendingPosts ? "alert" : "default"} />
        <StatCard label="New inquiries" value={inquiries} href="/admin/inquiries" tone={inquiries ? "alert" : "default"} />
        <StatCard label="Low stock variants" value={lowStock.length} href="/admin/products" tone={lowStock.length ? "alert" : "default"} />
      </div>

      <Section title="Revenue by channel (weekly)">
        <RevenueChart data={[...weeks.values()]} channels={activeChannels} labels={CHANNEL_LABELS} />
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Sales by channel">
          <Table head={["Channel", "Revenue", "Share"]}>
            {CHANNELS.map((c) => (
              <tr key={c}>
                <td className="font-semibold">{CHANNEL_LABELS[c]}</td>
                <td>{formatMoney(byChannel[c])}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded bg-ink/10">
                      <div className="h-full bg-olive" style={{ width: `${total ? (byChannel[c] / total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs">{total ? Math.round((byChannel[c] / total) * 100) : 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">↳ Referred sales</td>
              <td>{formatMoney(referredAgg._sum.amountCents ?? 0)}</td>
              <td className="text-xs text-muted-foreground">orders attributed to referral links</td>
            </tr>
          </Table>
        </Section>
        <Section title="Recent orders" actions={<Link href="/admin/orders" className="text-sm font-semibold underline">All orders</Link>}>
          <Table head={["#", "Customer", "Items", "Total", "Status"]}>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td><Link className="font-semibold underline" href={`/admin/orders/${o.id}`}>{o.number}</Link></td>
                <td className="max-w-40 truncate">{o.email}</td>
                <td className="max-w-48 truncate text-muted-foreground">{o.items.map((i) => i.name).join(", ")}</td>
                <td>{formatMoney(o.totalCents)}</td>
                <td><StatusBadge status={o.fulfillmentStatus} /></td>
              </tr>
            ))}
          </Table>
        </Section>
      </div>
      {lowStock.length > 0 && (
        <Section title="Low stock">
          <ul className="grid gap-2 sm:grid-cols-2">
            {lowStock.map((v) => (
              <li key={v.id} className="flex justify-between rounded border border-ink/30 px-3 py-2 text-sm">
                <Link href={`/admin/products/${v.product.id}`} className="underline">{v.product.name}: {v.name}</Link>
                <span className={v.inventory === 0 ? "font-bold text-stamp" : "font-semibold"}>{v.inventory} left</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </AdminPage>
  );
}
