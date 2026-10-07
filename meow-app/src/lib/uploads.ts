import "server-only";
import { randomUUID } from "node:crypto";
import sharp, { type OutputInfo } from "sharp";
import { storage } from "@/lib/storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);
const MAX_BYTES = 4 * 1024 * 1024;

export class UploadError extends Error {}

/**
 * Validate and store an uploaded image:
 *  - checks declared MIME + size, then decodes with sharp (rejects non-images)
 *  - auto-rotates from EXIF, then STRIPS all metadata (incl. GPS location) by re-encoding
 *  - caps dimensions and converts to WebP
 */
export async function storeImageUpload(file: File, opts: { prefix: string; private?: boolean; maxDimension?: number }) {
  if (!(file instanceof File) || file.size === 0) throw new UploadError("Please choose a photo.");
  if (file.size > MAX_BYTES) throw new UploadError("That photo is too large (max 4MB).");
  if (file.type && !ALLOWED.has(file.type)) throw new UploadError("Please upload a JPG, PNG, or WebP image.");

  let out: { data: Buffer; info: OutputInfo };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const max = opts.maxDimension ?? 2000;
    out = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new UploadError("We couldn't read that image. Try a JPG or PNG.");
  }
  const key = `${opts.private ? "private/" : ""}${opts.prefix}/${randomUUID()}.webp`;
  await storage().put(key, out.data, "image/webp");
  return { key, width: out.info.width, height: out.info.height };
}
