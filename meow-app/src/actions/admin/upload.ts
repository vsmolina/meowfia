"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-helpers";
import { storage } from "@/lib/storage";
import { slugify } from "@/lib/format";

const KINDS = {
  image: { prefix: "uploads/images", types: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"], private: false },
  pdf: { prefix: "private/templates", types: ["application/pdf"], private: true },
} as const;

/** Returns a URL the admin's browser can PUT the file to, and the storage key to save */
export async function createUploadTarget(input: { kind: keyof typeof KINDS; filename: string; contentType: string }) {
  await assertAdmin();
  const p = z.object({ kind: z.enum(["image", "pdf"]), filename: z.string().max(200), contentType: z.string().max(100) }).parse(input);
  const cfg = KINDS[p.kind];
  if (!(cfg.types as readonly string[]).includes(p.contentType)) throw new Error(`Unsupported file type: ${p.contentType}`);
  const ext = p.filename.includes(".") ? p.filename.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : p.kind === "pdf" ? "pdf" : "png";
  const base = slugify(p.filename.replace(/\.[^.]+$/, "")) || "file";
  const key = `${cfg.prefix}/${randomUUID().slice(0, 8)}-${base}.${ext}`;
  const target = await storage().presignPut(key, p.contentType);
  return { key, ...target };
}
