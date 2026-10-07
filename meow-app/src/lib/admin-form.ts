import "server-only";
import { z } from "zod";

/** Helpers for parsing admin FormData */
export const fd = {
  str: (f: FormData, k: string) => String(f.get(k) ?? "").trim(),
  opt: (f: FormData, k: string) => {
    const v = String(f.get(k) ?? "").trim();
    return v === "" ? null : v;
  },
  bool: (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true",
  int: (f: FormData, k: string, fallback = 0) => {
    const n = parseInt(String(f.get(k) ?? ""), 10);
    return Number.isFinite(n) ? n : fallback;
  },
  cents: (f: FormData, k: string): number | null => {
    const raw = String(f.get(k) ?? "").replace(/[$,\s]/g, "");
    if (raw === "") return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  },
  date: (f: FormData, k: string): Date | null => {
    const v = String(f.get(k) ?? "").trim();
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  },
  all: (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean),
  lines: (f: FormData, k: string) =>
    String(f.get(k) ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
};

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, and dashes");

export function zodMessage(e: unknown) {
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? "Invalid input";
  if (e instanceof Error && e.message.includes("Unique constraint")) return "That slug/code is already in use.";
  return e instanceof Error ? e.message : "Something went wrong";
}
