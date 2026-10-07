"use client";

import { useActionState, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { submitReviewAction } from "@/actions/reviews";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ReviewForm({ templateId, productId }: { templateId?: string; productId?: string }) {
  const [state, action, pending] = useActionState(submitReviewAction, initialActionState);
  const [rating, setRating] = useState(0);
  const [open, setOpen] = useState(false);

  if (state.ok) return <p role="status" className="text-sm font-semibold text-olive">✅ {state.message}</p>;
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)} className="w-full">Write a review</Button>;

  return (
    <form action={action} className="space-y-3 rounded-lg border-2 border-ink/70 bg-paper p-3">
      <input type="hidden" name="templateId" value={templateId ?? ""} />
      <input type="hidden" name="productId" value={productId ?? ""} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} star${i > 1 ? "s" : ""}`} aria-pressed={rating === i}>
              <Star className={cn("size-6", i <= rating ? "fill-[#d4a72c] text-[#d4a72c]" : "text-ink/30")} />
            </button>
          ))}
        </div>
      </fieldset>
      <Input name="title" placeholder="Headline (optional)" maxLength={80} className="bg-sand/50" aria-label="Review headline" />
      <Textarea name="body" required minLength={10} maxLength={1500} rows={4} placeholder="How did the build go? How did your cat react?" className="bg-sand/50" aria-label="Review" />
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      <Button type="submit" disabled={pending || rating === 0} className="w-full">
        {pending && <Loader2 className="animate-spin" />} Submit report
      </Button>
    </form>
  );
}
