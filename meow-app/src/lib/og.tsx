import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { storage } from "@/lib/storage";
import { siteConfig } from "@/config/site";

export const OG_SIZE = { width: 1200, height: 630 };
const c = siteConfig.colors;

let fontPromise: Promise<Buffer> | undefined;
export function stencilFont() {
  fontPromise ??= readFile(join(process.cwd(), "src/assets/fonts/BlackOpsOne-Regular.ttf"));
  return fontPromise;
}

/** Load a storage image as a PNG data URL (Satori can't render WebP) */
export async function storageImageDataUrl(key: string | null | undefined, width = 700, height = 630) {
  if (!key) return null;
  const file = await storage().get(key).catch(() => null);
  if (!file) return null;
  const png = await sharp(file.body).resize(width, height, { fit: "cover" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/** Shared OG layout: photo on the right, dossier panel on the left */
export function OgFrame({ eyebrow, title, subtitle, badge, image }: { eyebrow: string; title: string; subtitle?: string; badge?: string; image?: string | null }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: c.sand, fontFamily: "Stencil" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: image ? 560 : 1200, padding: "48px 48px 40px", background: c.olive, color: c.sand, borderRight: image ? `8px solid ${c.ink}` : "none" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#e7d27c", display: "flex" }}>{eyebrow.toUpperCase()}</div>
          <div style={{ fontSize: title.length > 22 ? 58 : 72, lineHeight: 1.02, marginTop: 18, display: "flex" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 26, marginTop: 18, color: "#efe6d2cc", fontFamily: "Stencil", display: "flex" }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, display: "flex" }}>{siteConfig.name.toUpperCase()}</div>
          {badge && (
            <div style={{ display: "flex", fontSize: 26, padding: "6px 16px", border: `4px solid ${c.stamp}`, color: "#ffb4ab", transform: "rotate(-6deg)" }}>{badge}</div>
          )}
        </div>
      </div>
      {/* Satori (next/og) only supports plain img elements */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image && <img src={image} width={640} height={630} style={{ objectFit: "cover" }} alt="" />}
    </div>
  );
}
