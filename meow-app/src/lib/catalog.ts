import "server-only";
import { db, type Prisma } from "@/lib/db";

export const templateCardSelect = {
  id: true,
  slug: true,
  name: true,
  codename: true,
  tagline: true,
  vehicleType: true,
  difficulty: true,
  catSize: true,
  buildTimeMinutes: true,
  pricingMode: true,
  priceCents: true,
  suggestedPriceCents: true,
  coverImageKey: true,
  membersOnly: true,
  releaseAt: true,
  featured: true,
  _count: { select: { galleryPosts: { where: { status: "APPROVED" } } } },
} satisfies Prisma.TemplateSelect;

export type TemplateCardData = Prisma.TemplateGetPayload<{ select: typeof templateCardSelect }>;

/** Templates visible in the public catalog: published and released (scheduled drops excluded) */
export function releasedWhere(now = new Date()): Prisma.TemplateWhereInput {
  return { status: "PUBLISHED", OR: [{ releaseAt: null }, { releaseAt: { lte: now } }] };
}

export type FleetFilters = {
  type?: string;
  difficulty?: string;
  size?: string;
  price?: "free" | "paid" | "under10" | "10plus" | string;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "popular" | string;
  q?: string;
};

const VEHICLES = ["TANK", "PLANE", "BOAT", "OTHER"] as const;
const DIFFICULTIES = ["RECRUIT", "SOLDIER", "VETERAN", "ELITE"] as const;
const SIZES = ["KITTEN", "STANDARD", "CHONK"] as const;

function pickEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.toUpperCase())
    .filter((v): v is T => (allowed as readonly string[]).includes(v));
}

export function parseFleetFilters(sp: Record<string, string | string[] | undefined>): FleetFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  return { type: get("type"), difficulty: get("difficulty"), size: get("size"), price: get("price"), sort: get("sort"), q: get("q")?.slice(0, 80) };
}

export async function listTemplates(f: FleetFilters) {
  const where: Prisma.TemplateWhereInput = { AND: [releasedWhere()] };
  const and = where.AND as Prisma.TemplateWhereInput[];
  const types = pickEnum(f.type, VEHICLES);
  const diffs = pickEnum(f.difficulty, DIFFICULTIES);
  const sizes = pickEnum(f.size, SIZES);
  if (types.length) and.push({ vehicleType: { in: types } });
  if (diffs.length) and.push({ difficulty: { in: diffs } });
  if (sizes.length) and.push({ catSize: { in: sizes } });
  if (f.price === "free") and.push({ pricingMode: "FREE" });
  if (f.price === "paid") and.push({ pricingMode: { not: "FREE" } });
  if (f.price === "under10") and.push({ pricingMode: { not: "FREE" }, priceCents: { lt: 1000 } });
  if (f.price === "10plus") and.push({ priceCents: { gte: 1000 } });
  if (f.q) and.push({ OR: [{ name: { contains: f.q } }, { tagline: { contains: f.q } }, { codename: { contains: f.q } }] });

  const orderBy: Prisma.TemplateOrderByWithRelationInput[] =
    f.sort === "newest"
      ? [{ releaseAt: "desc" }]
      : f.sort === "price-asc"
        ? [{ priceCents: "asc" }]
        : f.sort === "price-desc"
          ? [{ priceCents: "desc" }]
          : f.sort === "popular"
            ? [{ galleryPosts: { _count: "desc" } }]
            : [{ featured: "desc" }, { releaseAt: "desc" }];

  return db.template.findMany({ where, orderBy, select: templateCardSelect });
}

/** Average rating + count per template, for cards */
export async function ratingsFor(templateIds: string[]) {
  if (!templateIds.length) return new Map<string, { avg: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["templateId"],
    where: { templateId: { in: templateIds }, approved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.templateId!, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

/** Template ids the user has favorited */
export async function favoriteIds(userId: string | null | undefined) {
  if (!userId) return new Set<string>();
  const favs = await db.favorite.findMany({ where: { userId }, select: { templateId: true } });
  return new Set(favs.map((f) => f.templateId));
}
