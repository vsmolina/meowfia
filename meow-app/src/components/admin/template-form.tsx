import type { Template } from "@/lib/db";
import { saveTemplateAction } from "@/actions/admin/catalog";
import { AdminForm, Checkbox, MoneyInput, SelectInput, TextArea, TextInput } from "@/components/admin/form";
import { UploadField } from "@/components/admin/upload-field";
import { Section } from "@/components/admin/ui";

const toLocalInput = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function TemplateForm({ template: t }: { template?: Template | null }) {
  const images = ((t?.imageKeys as string[] | undefined) ?? []).filter((k) => k !== t?.coverImageKey);
  return (
    <AdminForm action={saveTemplateAction.bind(null, t?.id ?? null)} submitLabel={t ? "Save template" : "Create template"}>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section title="Basics">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label="Name" name="name" defaultValue={t?.name} required />
              <TextInput label="Slug" name="slug" defaultValue={t?.slug} hint="URL: /fleet/slug (auto from name if blank)" />
              <TextInput label="Codename" name="codename" defaultValue={t?.codename} placeholder="OPERATION HEAVY LOAF" />
              <TextInput label="TikTok URL" name="tiktokUrl" defaultValue={t?.tiktokUrl} placeholder="https://www.tiktok.com/@…/video/…" />
            </div>
            <TextInput label="Tagline" name="tagline" defaultValue={t?.tagline} required />
            <TextArea label="Description" name="description" defaultValue={t?.description} rows={5} required />
          </Section>
          <Section title="Spec card">
            <div className="grid gap-3 sm:grid-cols-4">
              <SelectInput label="Vehicle" name="vehicleType" defaultValue={t?.vehicleType} options={[{ value: "TANK", label: "Tank" }, { value: "PLANE", label: "Plane" }, { value: "BOAT", label: "Warship" }, { value: "OTHER", label: "Other" }]} />
              <SelectInput label="Difficulty" name="difficulty" defaultValue={t?.difficulty} options={[{ value: "RECRUIT", label: "Recruit" }, { value: "SOLDIER", label: "Soldier" }, { value: "VETERAN", label: "Veteran" }, { value: "ELITE", label: "Elite" }]} />
              <SelectInput label="Cat size" name="catSize" defaultValue={t?.catSize ?? "STANDARD"} options={[{ value: "KITTEN", label: "Kitten" }, { value: "STANDARD", label: "Standard" }, { value: "CHONK", label: "Chonk" }]} />
              <TextInput label="Build minutes" name="buildTimeMinutes" type="number" defaultValue={t?.buildTimeMinutes ?? 60} />
            </div>
            <TextArea label="Materials (one per line)" name="materials" defaultValue={((t?.materials as string[] | undefined) ?? []).join("\n")} rows={5} />
          </Section>
          <Section title="Files & media">
            <UploadField label="Cover image" name="coverImageKey" kind="image" defaultKeys={t ? [t.coverImageKey] : []} />
            <UploadField label="Gallery images" name="imageKeys" kind="image" multiple defaultKeys={images} />
            <div className="grid gap-3 sm:grid-cols-2">
              <UploadField label="PDF: US Letter" name="pdfLetterKey" kind="pdf" defaultKeys={t?.pdfLetterKey ? [t.pdfLetterKey] : []} />
              <UploadField label="PDF: A4" name="pdfA4Key" kind="pdf" defaultKeys={t?.pdfA4Key ? [t.pdfA4Key] : []} />
            </div>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Pricing & license">
            <SelectInput label="Pricing" name="pricingMode" defaultValue={t?.pricingMode ?? "FIXED"} options={[{ value: "FIXED", label: "Fixed price" }, { value: "PWYW", label: "Pay what you want" }, { value: "FREE", label: "Free (email-gated)" }]} />
            <div className="grid gap-3 sm:grid-cols-2">
              <MoneyInput label="Price / PWYW minimum" name="price" cents={t?.priceCents ?? 800} />
              <MoneyInput label="PWYW suggested" name="suggestedPrice" cents={t?.suggestedPriceCents} />
              <MoneyInput label="Commercial upgrade" name="commercialUpgrade" cents={t?.commercialUpgradeCents ?? 1500} />
              <MoneyInput label="Classroom upgrade" name="classroomUpgrade" cents={t?.classroomUpgradeCents ?? 2500} />
            </div>
          </Section>
          <Section title="Publishing & drops">
            <SelectInput label="Status" name="status" defaultValue={t?.status ?? "DRAFT"} options={[{ value: "DRAFT", label: "Draft (hidden)" }, { value: "PUBLISHED", label: "Published" }]} />
            <TextInput label="Release at" name="releaseAt" type="datetime-local" defaultValue={toLocalInput(t?.releaseAt)} hint="Future date = scheduled drop with countdown + announcement email" />
            <TextInput label="Members early access (hours)" name="earlyAccessHours" type="number" defaultValue={t?.earlyAccessHours ?? 0} />
            <Checkbox label="Featured on home" name="featured" defaultChecked={t?.featured} />
            <Checkbox label="Members-only template" name="membersOnly" defaultChecked={t?.membersOnly} hint="Free for Officer+; others can still buy it" />
            <Checkbox label="Lead magnet (free starter)" name="isLeadMagnet" defaultChecked={t?.isLeadMagnet} hint="Sent to new email subscribers. Only one template can be the lead magnet." />
          </Section>
        </div>
      </div>
    </AdminForm>
  );
}
