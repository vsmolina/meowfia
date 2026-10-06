/**
 * Public URL for a public storage key. Safe to import from client components.
 * With S3/R2, set NEXT_PUBLIC_MEDIA_BASE_URL to the bucket's public URL
 * (e.g. https://media.example.com). Locally, files are served from /media/*.
 */
export function publicUrl(key: string | null | undefined): string {
  if (!key) return "/placeholder.png";
  if (/^https?:\/\//.test(key) || key.startsWith("/")) return key;
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  return base ? `${base.replace(/\/$/, "")}/${key}` : `/media/${key}`;
}
