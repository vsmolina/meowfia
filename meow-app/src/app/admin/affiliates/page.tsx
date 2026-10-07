import { db } from "@/lib/db";
import { deleteAffiliateAction, saveAffiliateAction } from "@/actions/admin/content";
import { AdminPage, Section } from "@/components/admin/ui";
import { AdminForm, Checkbox, ConfirmButton, TextInput } from "@/components/admin/form";

export const metadata = { title: "Affiliate links" };

function Fields({ l }: { l?: { name: string; description: string; url: string; category: string; priceHint: string | null; badge: string | null; sortOrder: number; active: boolean } }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <TextInput label="Name" name="name" defaultValue={l?.name} required />
      <TextInput label="Affiliate URL" name="url" defaultValue={l?.url} required className="md:col-span-2" />
      <TextInput label="Category" name="category" defaultValue={l?.category} required />
      <TextInput label="Description" name="description" defaultValue={l?.description} className="md:col-span-2" />
      <TextInput label="Price hint" name="priceHint" defaultValue={l?.priceHint} placeholder="$25" />
      <TextInput label="Badge" name="badge" defaultValue={l?.badge} placeholder="Her pick" />
      <TextInput label="Sort" name="sortOrder" type="number" defaultValue={l?.sortOrder ?? 0} />
      <Checkbox label="Active" name="active" defaultChecked={l?.active ?? true} />
    </div>
  );
}

export default async function AdminAffiliates() {
  const links = await db.affiliateLink.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return (
    <AdminPage title="Affiliate links" description="Shown on /supply-depot. Clicks are counted through /go/[id].">
      <Section title="Add link">
        <AdminForm action={saveAffiliateAction.bind(null, null)} submitLabel="Add link"><Fields /></AdminForm>
      </Section>
      {links.map((l) => (
        <details key={l.id} className="rounded-lg border-2 border-ink/50 bg-paper">
          <summary className="flex cursor-pointer justify-between gap-3 p-3 text-sm">
            <span className="font-semibold">{l.active ? "" : "(hidden) "}{l.name}</span>
            <span className="text-muted-foreground">{l.category} · {l.clicks} clicks</span>
          </summary>
          <div className="space-y-2 border-t border-ink/20 p-3">
            <AdminForm action={saveAffiliateAction.bind(null, l.id)}><Fields l={l} /></AdminForm>
            <ConfirmButton action={deleteAffiliateAction.bind(null, l.id)} />
          </div>
        </details>
      ))}
    </AdminPage>
  );
}
