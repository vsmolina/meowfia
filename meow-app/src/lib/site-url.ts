import { siteConfig } from "@/config/site";

/** Absolute base URL for links in emails, OG images, Stripe redirects, sitemaps. */
export function siteUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.NODE_ENV === "production" ? siteConfig.url : "http://localhost:3847");
  return `${base.replace(/\/$/, "")}${path.startsWith("/") || path === "" ? path : `/${path}`}`;
}
