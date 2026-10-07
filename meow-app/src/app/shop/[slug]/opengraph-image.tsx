import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { OG_SIZE, OgFrame, stencilFont, storageImageDataUrl } from "@/lib/og";

export const alt = "Shop product";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug } });
  const [font, image] = await Promise.all([stencilFont(), storageImageDataUrl((p?.imageKeys as string[] | undefined)?.[0], 640, 630)]);
  return new ImageResponse(
    <OgFrame eyebrow={p?.type === "KIT" ? "Pre-cut kit" : (p?.category ?? "Shop")} title={p?.name ?? "The Shop"} badge={p ? formatMoney(p.priceCents) : undefined} image={image} />,
    { ...size, fonts: [{ name: "Stencil", data: font, style: "normal" }] },
  );
}
