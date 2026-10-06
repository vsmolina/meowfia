import { siteConfig } from "@/config/site";

export type RankName = (typeof siteConfig.ranks)[number]["name"];

/** Rank from number of approved gallery builds: Private → Corporal → … → General */
export function rankFor(approvedBuilds: number): { name: RankName; index: number; next?: { name: RankName; needed: number } } {
  const ranks = siteConfig.ranks;
  let index = 0;
  ranks.forEach((r, i) => {
    if (approvedBuilds >= r.min) index = i;
  });
  const next = ranks[index + 1];
  return {
    name: ranks[index].name,
    index,
    next: next ? { name: next.name, needed: next.min - approvedBuilds } : undefined,
  };
}
