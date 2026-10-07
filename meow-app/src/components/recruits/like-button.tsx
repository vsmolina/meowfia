"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { m } from "framer-motion";
import { toggleLikeAction } from "@/actions/recruits";
import { cn } from "@/lib/utils";

export function LikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked: boolean; initialCount: number }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-pressed={liked}
      onClick={() => {
        const next = !liked;
        setLiked(next);
        setCount((c) => c + (next ? 1 : -1));
        start(async () => {
          const r = await toggleLikeAction(postId);
          if (!r.ok) {
            setLiked(!next);
            setCount((c) => c + (next ? -1 : 1));
            if (r.error === "signin") toast("Sign in to salute recruits", { action: { label: "Sign in", onClick: () => router.push(`/sign-in?callbackUrl=/recruits/${postId}`) } });
            else toast.error(r.error);
          } else if (r.count !== undefined) setCount(r.count);
        });
      }}
      className={cn("inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink px-4 font-bold shadow-stamp-sm transition", liked ? "bg-stamp text-paper" : "bg-paper hover:bg-muted")}
    >
      <m.span key={String(liked)} initial={{ scale: liked ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }}>
        <Heart className={cn("size-5", liked && "fill-current")} aria-hidden="true" />
      </m.span>
      {count} <span className="sr-only">likes</span>
    </button>
  );
}
