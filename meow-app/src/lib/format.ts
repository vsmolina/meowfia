export function formatMoney(cents: number, opts: { free?: boolean } = {}) {
  if (opts.free && cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(d: Date | string, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en-US", style === "long" ? { dateStyle: "long" } : { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
}

export function formatBuildTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}

/** "$12.50" → 1250. Returns null for invalid input. */
export function parseDollarsToCents(input: string | number): number | null {
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** True if `date` is within `ms` of now */
export function isWithin(date: Date, ms: number) {
  return Date.now() - date.getTime() < ms;
}

/** Current time in ms (wrapped so request-time reads are explicit in server components) */
export function nowMs() {
  return Date.now();
}
