import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { VEHICLE_LABELS } from "@/lib/labels";
import { OG_SIZE, OgFrame, stencilFont, storageImageDataUrl } from "@/lib/og";

export const alt = "Cardboard cat vehicle template";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await db.template.findUnique({ where: { slug } });
  const [font, image] = await Promise.all([stencilFont(), storageImageDataUrl(t?.coverImageKey, 640, 630)]);
  const price = !t ? "" : t.pricingMode === "FREE" ? "FREE" : t.pricingMode === "PWYW" ? "PAY WHAT YOU WANT" : formatMoney(t.priceCents);
  return new ImageResponse(
    <OgFrame eyebrow={t ? `${VEHICLE_LABELS[t.vehicleType]} template` : "Template"} title={t?.name ?? "The Fleet"} subtitle={t?.tagline} badge={price} image={image} />,
    { ...size, fonts: [{ name: "Stencil", data: await font, style: "normal" }] },
  );
}
