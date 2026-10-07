import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { OG_SIZE, OgFrame, stencilFont, storageImageDataUrl } from "@/lib/og";

export const alt = siteConfig.name;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [font, image] = await Promise.all([stencilFont(), storageImageDataUrl("seed/templates/box-tiger/cover.png", 640, 630)]);
  return new ImageResponse(<OgFrame eyebrow={`@${siteConfig.social.tiktokHandle}`} title="Cardboard war machines for cats" subtitle="Templates · Kits · Merch" badge="CLASSIFIED" image={image} />, {
    ...size,
    fonts: [{ name: "Stencil", data: font, style: "normal" }],
  });
}
