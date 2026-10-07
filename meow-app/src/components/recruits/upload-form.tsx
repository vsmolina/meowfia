"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { submitGalleryPostAction } from "@/actions/recruits";
import { initialActionState } from "@/lib/action-state";
import { downscaleImage } from "@/lib/client-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function UploadForm({ templates, defaultTemplateId }: { templates: { id: string; name: string }[]; defaultTemplateId?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitGalleryPostAction, initialActionState);
  const [, start] = useTransition();
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (state.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!photo) return;
        const fd = new FormData(e.currentTarget);
        fd.set("photo", photo.file);
        start(() => action(fd));
      }}
    >
      <label className="relative grid aspect-[4/5] w-full max-w-sm cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-ink/60 bg-paper text-center hover:border-ink">
        {photo ? (
          <Image src={photo.url} alt="Your photo preview" fill className="object-cover" unoptimized />
        ) : (
          <span className="space-y-2 p-6">
            {preparing ? <Loader2 className="mx-auto size-10 animate-spin" /> : <Camera className="mx-auto size-10 text-olive" />}
            <span className="block font-stencil text-lg">Tap to add a photo</span>
            <span className="block text-sm text-muted-foreground">Your cat in the build, please! JPG/PNG, portrait works best.</span>
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setPreparing(true);
            const small = await downscaleImage(f, 1600);
            setPhoto({ file: small, url: URL.createObjectURL(small) });
            setPreparing(false);
          }}
        />
      </label>
      {photo && (
        <button type="button" onClick={() => setPhoto(null)} className="text-sm font-semibold underline">
          Choose a different photo
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="u-cat">Cat&apos;s name *</Label>
          <Input id="u-cat" name="catName" required maxLength={40} className="h-11 bg-paper" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="u-tpl">Which template?</Label>
          <select id="u-tpl" name="templateId" defaultValue={defaultTemplateId ?? ""} className="h-11 w-full rounded-md border-2 border-input bg-paper px-3">
            <option value="">Custom / other build</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="u-cap">Caption</Label>
          <Textarea id="u-cap" name="caption" maxLength={280} rows={3} placeholder="Tell us about the mission…" className="bg-paper" />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[var(--olive)]" />
        I took this photo (or have permission), and it may be featured on the site and socials with credit.
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending || preparing || !photo} className="h-14 font-stencil text-lg tracking-wider">
        {pending && <Loader2 className="animate-spin" />} Submit for review
      </Button>
    </form>
  );
}
