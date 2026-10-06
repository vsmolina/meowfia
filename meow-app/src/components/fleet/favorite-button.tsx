"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/actions/account";
import { cn } from "@/lib/utils";

export function FavoriteButton({ templateId, initial, className }: { templateId: string; initial: boolean; className?: string }) {
  const [fav, setFav] = useOptimistic(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? "Remove from saved" : "Save for later"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setFav(!fav);
          const res = await toggleFavoriteAction(templateId);
          if (!res.ok && res.error === "signin") {
            toast("Sign in to save templates", { action: { label: "Sign in", onClick: () => router.push(`/sign-in?callbackUrl=${encodeURIComponent(location.pathname)}`) } });
          } else if (res.ok) {
            toast.success(res.favorited ? "Saved to your dossier" : "Removed from saved");
          }
        })
      }
      className={cn(
        "grid size-9 place-items-center rounded-full border-2 border-ink bg-paper/90 text-ink shadow-stamp-sm backdrop-blur transition hover:scale-105",
        fav && "bg-olive text-paper",
        className,
      )}
    >
      <Bookmark className={cn("size-4", fav && "fill-current")} />
    </button>
  );
}
