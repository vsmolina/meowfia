"use client";

import { useState } from "react";
import Image from "next/image";
import { FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createUploadTarget } from "@/actions/admin/upload";
import { publicUrl } from "@/lib/media";
import { Field } from "@/components/admin/form";

/**
 * Uploads directly from the browser to storage (presigned S3/R2 URL, or the signed
 * local route) and stores the resulting key(s) in hidden inputs named `name`.
 */
export function UploadField({ label, name, kind, defaultKeys = [], multiple = false, hint }: { label: string; name: string; kind: "image" | "pdf"; defaultKeys?: string[]; multiple?: boolean; hint?: string }) {
  const [keys, setKeys] = useState<string[]>(defaultKeys.filter(Boolean));
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files)) {
        const target = await createUploadTarget({ kind, filename: file.name, contentType: file.type || (kind === "pdf" ? "application/pdf" : "image/png") });
        const res = await fetch(target.url, { method: "PUT", headers: target.headers, body: file });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        added.push(target.key);
      }
      setKeys((k) => (multiple ? [...k, ...added] : added.slice(-1)));
      toast.success(`Uploaded ${added.length} file${added.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint}>
      {keys.map((k) => (
        <input key={k} type="hidden" name={name} value={k} />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {keys.map((k, i) => (
          <div key={k} className="relative">
            {kind === "image" ? (
              <div className="relative size-20 overflow-hidden rounded border-2 border-ink/50 bg-sand">
                <Image src={publicUrl(k)} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ) : (
              <a href={`/api/admin/file?key=${encodeURIComponent(k)}`} target="_blank" className="block max-w-56 truncate rounded border-2 border-ink/40 bg-sand px-2 py-1 font-mono text-xs underline">
                {k.split("/").pop()}
              </a>
            )}
            <button type="button" onClick={() => setKeys(keys.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-ink text-paper" aria-label="Remove file">
              <X className="size-3" />
            </button>
          </div>
        ))}
        {(multiple || keys.length === 0) && (
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border-2 border-dashed border-ink/50 px-3 text-sm font-semibold hover:border-ink">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            {keys.length ? "Add" : "Upload"} {kind === "pdf" ? "PDF" : "image"}
            <input type="file" className="sr-only" accept={kind === "pdf" ? "application/pdf" : "image/*"} multiple={multiple} onChange={(e) => upload(e.target.files)} />
          </label>
        )}
        {!multiple && keys.length > 0 && (
          <label className="cursor-pointer text-xs font-semibold underline">
            Replace
            <input type="file" className="sr-only" accept={kind === "pdf" ? "application/pdf" : "image/*"} onChange={(e) => upload(e.target.files)} />
          </label>
        )}
      </div>
    </Field>
  );
}
