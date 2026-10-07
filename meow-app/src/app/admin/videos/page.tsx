import Image from "next/image";
import { db } from "@/lib/db";
import { addVideoAction, deleteVideoAction, refreshVideoAction, updateVideoAction } from "@/actions/admin/content";
import { AdminPage, Section } from "@/components/admin/ui";
import { ActionButton, AdminForm, Checkbox, ConfirmButton, SelectInput, TextInput } from "@/components/admin/form";

export const metadata = { title: "Videos" };

export default async function AdminVideos() {
  const [videos, templates, cats] = await Promise.all([
    db.video.findMany({ orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }], include: { template: { select: { name: true } } } }),
    db.template.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.cat.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const series = [...new Set(videos.map((v) => v.series))];
  const tplOptions = [{ value: "", label: "No template" }, ...templates.map((t) => ({ value: t.id, label: t.name }))];
  return (
    <AdminPage title="Videos" description="Paste a TikTok URL. Title and thumbnail are pulled from TikTok's oEmbed.">
      <Section title="Add a video">
        <AdminForm action={addVideoAction} submitLabel="Add video">
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="TikTok URL" name="url" required placeholder="https://www.tiktok.com/@handle/video/7300000000000000000" className="md:col-span-2" />
            <TextInput label="Title (optional, defaults to TikTok caption)" name="title" />
            <TextInput label="Series" name="series" placeholder={series.join(", ")} />
            <SelectInput label="Linked template" name="templateId" options={tplOptions} />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Cats in this video</p>
              <div className="flex flex-wrap gap-3">
                {cats.map((c) => (
                  <label key={c.id} className="flex items-center gap-1 text-sm"><input type="checkbox" name="catIds" value={c.id} /> {c.name}</label>
                ))}
              </div>
            </div>
            <Checkbox label="Feature on home page hero" name="featured" />
          </div>
        </AdminForm>
      </Section>
      <div className="space-y-3">
        {videos.map((v) => (
          <details key={v.id} className="rounded-lg border-2 border-ink/50 bg-paper">
            <summary className="flex cursor-pointer items-center gap-3 p-3">
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-ink">
                {v.thumbnailUrl && <Image src={v.thumbnailUrl} alt="" fill sizes="40px" className="object-cover" />}
              </div>
              <span className="flex-1 truncate font-semibold">{v.featured && "⭐ "}{v.title}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">{v.series} · {v.template?.name ?? "no template"}</span>
            </summary>
            <div className="space-y-3 border-t border-ink/20 p-3">
              <AdminForm action={updateVideoAction.bind(null, v.id)} submitLabel="Save">
                <div className="grid gap-3 md:grid-cols-4">
                  <TextInput label="Title" name="title" defaultValue={v.title} className="md:col-span-2" />
                  <TextInput label="Series" name="series" defaultValue={v.series} />
                  <TextInput label="Sort order" name="sortOrder" type="number" defaultValue={v.sortOrder} />
                  <SelectInput label="Template" name="templateId" defaultValue={v.templateId} options={tplOptions} className="md:col-span-2" />
                  <Checkbox label="Featured on home" name="featured" defaultChecked={v.featured} />
                </div>
              </AdminForm>
              <div className="flex gap-2">
                <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Open on TikTok</a>
                <ActionButton action={refreshVideoAction.bind(null, v.id)} successMessage="Refreshed from TikTok">Refresh thumbnail</ActionButton>
                <ConfirmButton action={deleteVideoAction.bind(null, v.id)} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </AdminPage>
  );
}
