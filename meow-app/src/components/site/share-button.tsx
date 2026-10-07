"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ url, title, text }: { url: string; title: string; text?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 rounded-full"
      onClick={async () => {
        if (navigator.share) {
          await navigator.share({ url, title, text }).catch(() => {});
        } else {
          await navigator.clipboard.writeText(url).catch(() => {});
          toast.success("Link copied!");
        }
      }}
    >
      <Share2 /> Share
    </Button>
  );
}
