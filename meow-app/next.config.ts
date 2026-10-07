import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  // TikTok oEmbed thumbnails
  { protocol: "https", hostname: "**.tiktokcdn.com" },
  { protocol: "https", hostname: "**.tiktokcdn-us.com" },
  // Google profile photos
  { protocol: "https", hostname: "lh3.googleusercontent.com" },
  // Printful mockups
  { protocol: "https", hostname: "files.cdn.printful.com" },
];
if (process.env.NEXT_PUBLIC_MEDIA_BASE_URL) {
  const u = new URL(process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
  remotePatterns.push({ protocol: u.protocol.replace(":", "") as "https", hostname: u.hostname });
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Photo uploads (gallery, commissions) go through Server Actions. Images are downscaled
    // in the browser first; 4mb stays under Vercel's 4.5MB request limit.
    serverActions: { bodySizeLimit: "4mb" },
  },
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "sharp"],
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
