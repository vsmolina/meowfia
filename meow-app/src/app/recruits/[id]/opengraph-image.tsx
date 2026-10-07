import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { rankFor } from "@/lib/ranks";
import { OG_SIZE, OgFrame, stencilFont, storageImageDataUrl } from "@/lib/og";

export const alt = "A recruit in a cardboard build";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.galleryPost.findFirst({ where: { id, status: "APPROVED" }, include: { template: { select: { name: true } } } });
  const approved = p ? await db.galleryPost.count({ where: { userId: p.userId, status: "APPROVED" } }) : 0;
  const [font, image] = await Promise.all([stencilFont(), storageImageDataUrl(p?.imageKey, 640, 630)]);
  return new ImageResponse(
    <OgFrame eyebrow="Recruit reporting for duty" title={p?.catName ?? "Recruit"} subtitle={p?.template ? `in the ${p.template.name}` : undefined} badge={rankFor(approved).name.toUpperCase()} image={image} />,
    { ...size, fonts: [{ name: "Stencil", data: font, style: "normal" }] },
  );
}
