"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { emailSignInAction } from "@/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailSignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(emailSignInAction, initialActionState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" className="h-12 border-2 border-ink/70 bg-paper text-base" aria-invalid={Boolean(state.error)} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-stamp">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Mail />}
        Email me a sign-in link
      </Button>
    </form>
  );
}
