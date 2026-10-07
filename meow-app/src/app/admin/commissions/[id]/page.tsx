import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { COMMISSION_STATUS_LABELS } from "@/lib/labels";
import { publicUrl } from "@/lib/media";
import { updateCommissionAction } from "@/actions/admin/operations";
import { AdminPage, Section } from "@/components/admin/ui";
import { AdminForm, Checkbox, MoneyInput, SelectInput, TextArea } from "@/components/admin/form";

export const metadata = { title: "Commission" };

export default async function AdminCommission({ params }: PageProps<"/admin/commissions/[id]">) {
  const { id } = await params;
  const c = await db.commission.findUnique({ where: { id } });
  if (!c) notFound();
  const photos = (c.photoKeys as string[]) ?? [];
  return (
    <AdminPage title={`${c.name}: ${c.subjectType}`} description={`${c.email} · requested ${formatDate(c.createdAt, "long")} · deposit ${c.depositPaidAt ? `${formatMoney(c.depositCents)} paid` : "not paid"}`}>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Section title="Request">
            <p className="whitespace-pre-line text-sm">{c.description}</p>
            <p className="text-sm text-muted-foreground">{c.catCount} cat{c.catCount > 1 ? "s" : ""} riding</p>
          </Section>
          <Section title="Reference photos">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((k) => {
                const src = k.startsWith("private/") ? `/api/admin/file?key=${encodeURIComponent(k)}` : publicUrl(k);
                return (
                  <a key={k} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded border-2 border-ink/40">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private, admin-only file route */}
                    <img src={src} alt="Reference" className="aspect-square w-full object-cover" />
                  </a>
                );
              })}
            </div>
          </Section>
        </div>
        <Section title="Quote & status">
          <AdminForm action={updateCommissionAction.bind(null, c.id)} submitLabel="Update commission">
            <SelectInput label="Status" name="status" defaultValue={c.status} options={Object.entries(COMMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
            <MoneyInput label="Quote (total)" name="quote" cents={c.quoteCents} hint="Deposit is credited toward this" />
            <TextArea label="Internal notes" name="adminNotes" defaultValue={c.adminNotes} rows={4} />
            <Checkbox label="Email the customer about this status change" name="notify" defaultChecked />
          </AdminForm>
        </Section>
      </div>
    </AdminPage>
  );
}
