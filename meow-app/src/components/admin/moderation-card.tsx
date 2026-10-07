"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { featurePostAction, moderatePostAction } from "@/actions/admin/content";
import { publicUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";

const REASONS = ["No cat visible in the build", "Photo is unclear or too dark", "Unsafe build (staples, sharp edges)", "Not a cardboard build", "Duplicate submission", "Inappropriate content"];

export function ModerationCard({ post }: { post: { id: string; catName: string; caption: string | null; imageKey: string; width: number; height: number; user: { name: string | null; email: string }; template: { name: string } | null } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reason, setReason] = useState(REASONS[0]);
  const run = (fn: () => Promise<unknown>, msg: string) =>
    start(async () => {
      try {
        await fn();
        toast.success(msg);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  return (
    <div className="overflow-hidden rounded-lg border-2 border-ink bg-paper">
      <div className="relative" style={{ aspectRatio: `${post.width}/${post.height}` }}>
        <Image src={publicUrl(post.imageKey)} alt={post.catName} fill sizes="320px" className="object-cover" />
      </div>
      <div className="space-y-2 p-3 text-sm">
        <p className="font-stencil text-lg">{post.catName}</p>
        <p className="text-xs text-muted-foreground">{post.user.name ?? post.user.email} · {post.template?.name ?? "Custom build"}</p>
        {post.caption && <p className="italic">&ldquo;{post.caption}&rdquo;</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => run(() => moderatePostAction(post.id, "APPROVED"), "Approved")}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />} Approve
          </Button>
          <Button size="sm" variant="kraft" disabled={pending} onClick={() => run(() => featurePostAction(post.id), "Approved & featured")}>
            <Star /> Feature
          </Button>
        </div>
        <div className="flex gap-2">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-8 min-w-0 flex-1 rounded border-2 border-ink/30 bg-sand/40 text-xs" aria-label="Rejection reason">
            {REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => moderatePostAction(post.id, "REJECTED", reason), "Rejected")}>
            <X /> Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
