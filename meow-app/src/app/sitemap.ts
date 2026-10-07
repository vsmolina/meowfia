import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";
import { releasedWhere } from "@/lib/catalog";
import { LEGAL } from "@/content/legal";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [templates, bundles, products, guides, cats, posts, drops] = await Promise.all([
    db.template.findMany({ where: releasedWhere(), select: { slug: true, updatedAt: true } }),
    db.bundle.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
    db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.guide.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.cat.findMany({ select: { slug: true } }),
    db.galleryPost.findMany({ where: { status: "APPROVED" }, select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    db.template.findMany({ where: { status: "PUBLISHED", releaseAt: { gt: new Date() } }, select: { slug: true } }),
  ]);
  const staticPaths = ["", "/fleet", "/fleet/bundles", "/shop", "/shop/gift-cards", "/shop/commissions", "/recruits", "/guides", "/cat-safety", "/barracks", "/videos", "/crew", "/support", "/supply-depot", "/classroom", "/work-with-us", "/drops"];
  return [
    ...staticPaths.map((p) => ({ url: siteUrl(p), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...templates.map((t) => ({ url: siteUrl(`/fleet/${t.slug}`), lastModified: t.updatedAt, priority: 0.9 })),
    ...bundles.map((b) => ({ url: siteUrl(`/fleet/bundles/${b.slug}`), lastModified: b.createdAt, priority: 0.8 })),
    ...products.map((p) => ({ url: siteUrl(`/shop/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
    ...guides.map((g) => ({ url: siteUrl(`/guides/${g.slug}`), lastModified: g.updatedAt, priority: 0.6 })),
    ...cats.map((c) => ({ url: siteUrl(`/crew/${c.slug}`), priority: 0.5 })),
    ...posts.map((p) => ({ url: siteUrl(`/recruits/${p.id}`), lastModified: p.createdAt, priority: 0.4 })),
    ...drops.map((d) => ({ url: siteUrl(`/drops/${d.slug}`), priority: 0.6 })),
    ...Object.keys(LEGAL).map((k) => ({ url: siteUrl(`/legal/${k}`), priority: 0.2 })),
  ];
}
