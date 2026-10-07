import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, className, size = "sm" }: { rating: number; className?: string; size?: "sm" | "md" }) {
  const s = size === "md" ? "size-5" : "size-4";
  return (
    <span className={cn("inline-flex", className)} role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(s, i <= Math.round(rating) ? "fill-[#d4a72c] text-[#d4a72c]" : "text-ink/25")} aria-hidden="true" />
      ))}
    </span>
  );
}
