import type { Cat } from "@/lib/db";
import { saveCatAction } from "@/actions/admin/content";
import { AdminForm, TextArea, TextInput } from "@/components/admin/form";
import { UploadField } from "@/components/admin/upload-field";

export function CatForm({ cat }: { cat?: Cat | null }) {
  return (
    <AdminForm action={saveCatAction.bind(null, cat?.id ?? null)} submitLabel={cat ? "Save cat" : "Add cat"}>
      <div className="grid gap-3 md:grid-cols-3">
        <TextInput label="Name" name="name" defaultValue={cat?.name} required />
        <TextInput label="Slug" name="slug" defaultValue={cat?.slug} hint="Auto from name if blank" />
        <TextInput label="Rank" name="rank" defaultValue={cat?.rank ?? "Private"} hint="Private, Corporal, Sergeant, Lieutenant, Captain, General" />
        <TextInput label="Callsign" name="callsign" defaultValue={cat?.callsign} />
        <TextInput label="Favorite vehicle" name="favoriteVehicle" defaultValue={cat?.favoriteVehicle} required />
        <TextInput label="Sort order" name="sortOrder" type="number" defaultValue={cat?.sortOrder ?? 0} />
      </div>
      <TextArea label="Personality" name="personality" defaultValue={cat?.personality} rows={2} required />
      <TextArea label="Bio" name="bio" defaultValue={cat?.bio} rows={4} required />
      <UploadField label="Portrait" name="imageKey" kind="image" defaultKeys={cat ? [cat.imageKey] : []} />
    </AdminForm>
  );
}
