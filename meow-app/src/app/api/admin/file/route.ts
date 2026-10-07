import { getSessionUser } from "@/lib/auth-helpers";
import { contentTypeFor, storage } from "@/lib/storage";

/** Admin-only viewer for private files (commission reference photos, PDFs) */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") return new Response("Not found", { status: 404 });
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key.startsWith("private/") || key.includes("..")) return new Response("Bad key", { status: 400 });
  const file = await storage().stream(key);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.stream, { headers: { "Content-Type": contentTypeFor(key), "Cache-Control": "private, no-store" } });
}
