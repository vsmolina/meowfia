"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateProfileAction } from "@/actions/account";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileForm({ defaults }: { defaults: { name: string; handle: string; bio: string } }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialActionState);
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required maxLength={60} className="h-11 bg-paper" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="handle">Recruit handle</Label>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">@</span>
          <Input id="handle" name="handle" defaultValue={defaults.handle} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" className="h-11 bg-paper" aria-describedby="handle-hint" />
        </div>
        <p id="handle-hint" className="text-xs text-muted-foreground">Your public profile lives at /recruits/u/handle.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={defaults.bio} maxLength={280} rows={3} className="bg-paper" placeholder="Two cats, one tank, zero regrets." />
      </div>
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm font-semibold text-olive">✅ {state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Save changes
      </Button>
    </form>
  );
}
