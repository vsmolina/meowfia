import { db, type Prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { tierConfig } from "@/lib/access";
import { adjustCreditAction, setUserRoleAction } from "@/actions/admin/marketing";
import { AdminPage, Table } from "@/components/admin/ui";
import { ActionButton, AdminForm } from "@/components/admin/form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Customers" };

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const membersOnly = sp.filter === "members";
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }, { handle: { contains: q } }] } : {}),
    ...(membersOnly ? { membership: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } } } : {}),
  };
  const users = await db.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { orders: { where: { status: "PAID" }, select: { totalCents: true } }, membership: true, _count: { select: { galleryPosts: true, referralConversions: true } } } });
  return (
    <AdminPage title="Customers" actions={<Button asChild variant="outline">
          <a href="/api/admin/export/customers" download>Export CSV</a>
        </Button>}>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search email, name, handle" className="h-10 w-72 rounded-md border-2 border-ink/40 bg-paper px-3 text-sm" />
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="filter" value="members" defaultChecked={membersOnly} /> Members only</label>
        <Button type="submit" size="sm">Search</Button>
      </form>
      <Table head={["Customer", "Joined", "Orders", "LTV", "Membership", "Posts", "Referrals", "Credit", "Role"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td><span className="font-semibold">{u.name ?? "-"}</span><span className="block text-xs text-muted-foreground">{u.email}{u.handle ? ` · @${u.handle}` : ""}</span></td>
            <td className="text-xs">{formatDate(u.createdAt)}</td>
            <td>{u.orders.length}</td>
            <td>{formatMoney(u.orders.reduce((a, o) => a + o.totalCents, 0))}</td>
            <td className="text-xs">{u.membership ? `${tierConfig(u.membership.tier).name} · ${u.membership.status.toLowerCase()}` : "-"}</td>
            <td>{u._count.galleryPosts}</td>
            <td>{u._count.referralConversions}</td>
            <td>
              <details>
                <summary className="cursor-pointer">{formatMoney(u.storeCreditCents)}</summary>
                <AdminForm action={adjustCreditAction.bind(null, u.id)} submitLabel="Apply" className="mt-1 space-y-1">
                  <input name="delta" placeholder="+5 or -5" className="h-8 w-24 rounded border-2 border-ink/30 px-2 text-xs" aria-label="Credit adjustment in dollars" />
                </AdminForm>
              </details>
            </td>
            <td>
              <ActionButton action={setUserRoleAction.bind(null, u.id, u.role === "ADMIN" ? "USER" : "ADMIN")} successMessage="Role updated">
                {u.role === "ADMIN" ? "Admin ✓" : "Make admin"}
              </ActionButton>
            </td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
