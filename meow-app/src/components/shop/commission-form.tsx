"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { commissionAction } from "@/actions/support";
import { initialActionState } from "@/lib/action-state";
import { downscaleImage } from "@/lib/client-image";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CommissionForm({ depositCents }: { depositCents: number }) {
  const [state, action, pending] = useActionState(commissionAction, initialActionState);
  const [, start] = useTransition();
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [preparing, setPreparing] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    setPreparing(true);
    const next = [...photos];
    for (const f of Array.from(list).slice(0, 4 - photos.length)) {
      const small = await downscaleImage(f, 2400);
      next.push({ file: small, url: URL.createObjectURL(small) });
    }
    setPhotos(next);
    setPreparing(false);
  };

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.delete("photos");
        photos.forEach((p) => fd.append("photos", p.file));
        start(() => action(fd));
      }}
    >
      <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Your name *</Label>
        <Input id="c-name" name="name" required autoComplete="name" className="h-11 bg-paper" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-email">Email *</Label>
        <Input id="c-email" name="email" type="email" required autoComplete="email" className="h-11 bg-paper" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-subject">What should we build? *</Label>
        <select id="c-subject" name="subjectType" required className="h-11 w-full rounded-md border-2 border-input bg-paper px-3">
          <option value="">Choose…</option>
          <option value="car">Car</option>
          <option value="truck">Truck</option>
          <option value="motorcycle">Motorcycle / scooter</option>
          <option value="house">House / building</option>
          <option value="other">Something else</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-cats">How many cats will ride?</Label>
        <Input id="c-cats" name="catCount" type="number" min={1} max={6} defaultValue={1} className="h-11 bg-paper" />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="c-desc">Details *</Label>
        <Textarea id="c-desc" name="description" required minLength={20} rows={5} placeholder="Make/model/color, special details (roof rack! license plate!), your cat's weight, and when you need it." className="bg-paper" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <p className="text-sm font-semibold">Reference photos * (up to 4)</p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.url} className="relative size-24 overflow-hidden rounded-lg border-2 border-ink">
              <Image src={p.url} alt={`Reference photo ${i + 1}`} fill sizes="96px" className="object-cover" unoptimized />
              <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink text-paper" aria-label={`Remove photo ${i + 1}`}>
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < 4 && (
            <label className="grid size-24 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-ink/50 bg-paper text-center text-xs font-semibold hover:border-ink">
              {preparing ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
              Add photo
              <input type="file" name="photos" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending || preparing || photos.length === 0} className="h-14 font-stencil text-lg tracking-wider">
          {pending && <Loader2 className="animate-spin" />} Submit &amp; pay {formatMoney(depositCents)} deposit
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">The deposit is credited toward your final price, and it&apos;s fully refunded if we can&apos;t take the commission.</p>
      </div>
    </form>
  );
}
