import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@/lib/storage";
import { verifyLocalUpload } from "@/lib/upload-sign";

/** Local-disk target for admin direct uploads (S3/R2 uses presigned URLs instead) */
export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") return new Response("Unauthorized", { status: 401 });
  const u = new URL(req.url);
  const key = u.searchParams.get("key") ?? "";
  const ct = u.searchParams.get("ct") ?? "";
  if (!verifyLocalUpload(key, ct, Number(u.searchParams.get("exp")), u.searchParams.get("sig") ?? "")) return new Response("Bad signature", { status: 403 });
  const body = Buffer.from(await req.arrayBuffer());
  if (body.length > 50 * 1024 * 1024) return new Response("Too large", { status: 413 });
  await storage().put(key, body, ct);
  return Response.json({ ok: true, key });
}
