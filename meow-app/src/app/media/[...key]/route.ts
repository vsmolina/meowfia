import { contentTypeFor, storage } from "@/lib/storage";

/** Serves PUBLIC files from storage (local driver). Private keys are never served here. */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key: parts } = await ctx.params;
  const key = parts.map(decodeURIComponent).join("/");
  if (key.startsWith("private/") || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  const file = await storage().get(key).catch(() => null);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": contentTypeFor(key),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
