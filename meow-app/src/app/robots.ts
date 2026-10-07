import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api/", "/cart", "/checkout", "/downloads/", "/sign-in", "/unsubscribe/", "/go/", "/r/"] }],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
