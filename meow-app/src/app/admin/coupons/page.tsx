import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { deleteCouponAction, saveCouponAction, toggleCouponAction } from "@/actions/admin/content";
import { AdminPage, Section, Table } from "@/components/admin/ui";
import { ActionButton, AdminForm, ConfirmButton, MoneyInput, TextInput } from "@/components/admin/form";

export const metadata = { title: "Coupons" };

export default async function AdminCoupons() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <AdminPage title="Coupons" description="Customers enter codes in the cart. The referral welcome code is set in src/config/site.ts.">
      <Section title="New coupon">
        <AdminForm action={saveCouponAction} submitLabel="Create coupon">
          <div className="grid gap-3 md:grid-cols-4">
            <TextInput label="Code" name="code" required placeholder="SPRING20" />
            <TextInput label="Percent off" name="percentOff" type="number" placeholder="20" />
            <MoneyInput label="…or amount off" name="amountOff" />
            <MoneyInput label="Minimum order" name="minSubtotal" />
            <TextInput label="Max redemptions" name="maxRedemptions" type="number" />
            <TextInput label="Expires" name="expiresAt" type="datetime-local" />
            <TextInput label="Description (internal)" name="description" className="md:col-span-2" />
          </div>
        </AdminForm>
      </Section>
      <Table head={["Code", "Discount", "Min", "Used", "Expires", "Status", ""]}>
        {coupons.map((c) => {
          const expired = c.expiresAt && c.expiresAt < now;
          return (
            <tr key={c.id}>
              <td className="font-mono font-semibold">{c.code}<span className="block font-sans text-xs text-muted-foreground">{c.description}</span></td>
              <td>{c.percentOff ? `${c.percentOff}%` : formatMoney(c.amountOffCents ?? 0)}</td>
              <td>{c.minSubtotalCents ? formatMoney(c.minSubtotalCents) : "-"}</td>
              <td>{c.redemptions}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}</td>
              <td className="text-xs">{c.expiresAt ? formatDate(c.expiresAt) : "never"}</td>
              <td>{expired ? "expired" : c.active ? "active" : "paused"}</td>
              <td className="flex gap-1">
                <ActionButton action={toggleCouponAction.bind(null, c.id)}>{c.active ? "Pause" : "Activate"}</ActionButton>
                <ConfirmButton action={deleteCouponAction.bind(null, c.id)} />
              </td>
            </tr>
          );
        })}
      </Table>
    </AdminPage>
  );
}
