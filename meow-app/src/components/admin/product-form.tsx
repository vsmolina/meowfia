import { db, type Product, type ProductVariant } from "@/lib/db";
import { saveProductAction } from "@/actions/admin/catalog";
import { AdminForm, Checkbox, MoneyInput, SelectInput, TextArea, TextInput } from "@/components/admin/form";
import { UploadField } from "@/components/admin/upload-field";
import { VariantEditor } from "@/components/admin/variant-editor";
import { Section } from "@/components/admin/ui";

export async function ProductForm({ product: p }: { product?: (Product & { variants: ProductVariant[] }) | null }) {
  const [templates, products] = await Promise.all([db.template.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }), db.product.findMany({ where: p ? { id: { not: p.id } } : {}, select: { id: true, name: true }, orderBy: { name: "asc" } })]);
  return (
    <AdminForm action={saveProductAction.bind(null, p?.id ?? null)} submitLabel={p ? "Save product" : "Create product"}>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section title="Details">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label="Name" name="name" defaultValue={p?.name} required />
              <TextInput label="Slug" name="slug" defaultValue={p?.slug} hint="Auto from name if blank" />
              <SelectInput label="Type" name="type" defaultValue={p?.type ?? "MERCH"} options={[{ value: "KIT", label: "Pre-cut kit" }, { value: "MERCH", label: "Merch" }]} />
              <TextInput label="Category" name="category" defaultValue={p?.category ?? "Apparel"} hint="Kits, Apparel, Stickers, Patches, Cat Gear, Posters…" />
            </div>
            <TextArea label="Description" name="description" defaultValue={p?.description} rows={4} required />
            <UploadField label="Images" name="imageKeys" kind="image" multiple defaultKeys={(p?.imageKeys as string[] | undefined) ?? []} />
          </Section>
          <Section title="Variants & inventory">
            <VariantEditor initial={p?.variants ?? []} />
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Pricing">
            <MoneyInput label="Base price" name="price" cents={p?.priceCents} required />
            <MoneyInput label="Compare-at price" name="compareAt" cents={p?.compareAtCents} hint="Shows as strikethrough" />
          </Section>
          <Section title="Merchandising">
            <SelectInput label="Linked template (for kits)" name="templateId" defaultValue={p?.templateId} options={[{ value: "", label: "None" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]} />
            <SelectInput label="Cart upsell product" name="upsellProductId" defaultValue={p?.upsellProductId} options={[{ value: "", label: "None" }, ...products.map((x) => ({ value: x.id, label: x.name }))]} />
            <TextInput label="Printful product ID" name="printfulProductId" defaultValue={p?.printfulProductId} hint="Set automatically by Printful sync" />
            <Checkbox label="Featured" name="featured" defaultChecked={p?.featured} />
            <Checkbox label="Active (visible in shop)" name="active" defaultChecked={p?.active ?? true} />
          </Section>
        </div>
      </div>
    </AdminForm>
  );
}
