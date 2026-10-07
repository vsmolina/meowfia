import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const c = siteConfig.colors;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: c.olive }}>
        <svg width="140" height="110" viewBox="0 0 64 48" fill={c.sand}>
          <path d="M22 14 L25 4 L30 13 Z" />
          <path d="M34 13 L39 4 L42 14 Z" />
          <rect x="20" y="12" width="24" height="12" rx="4" />
          <rect x="43" y="15" width="19" height="4" rx="1.5" />
          <path d="M6 26 H58 L54 34 H10 Z" />
          <rect x="6" y="35" width="52" height="10" rx="5" />
        </svg>
      </div>
    ),
    size,
  );
}
