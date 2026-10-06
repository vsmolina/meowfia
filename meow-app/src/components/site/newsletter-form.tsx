"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { subscribeAction } from "@/actions/newsletter";
import { initialActionState } from "@/lib/action-state";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  source = "footer",
  tone = "light",
  cta = "Enlist",
  withName = false,
  className,
}: {
  source?: "footer" | "lead_magnet" | "home" | "popup";
  tone?: "light" | "dark";
  cta?: string;
  withName?: boolean;
  className?: string;
}) {
  const [state, action, pending] = useActionState(subscribeAction, initialActionState);

  useEffect(() => {
    if (state.ok) track("Lead", { content_name: source });
  }, [state.ok, source]);

  if (state.ok) {
    return (
      <p role="status" className={cn("rounded-md border-2 border-dashed px-4 py-3 font-semibold", tone === "dark" ? "border-paper/50 text-paper" : "border-olive text-olive-dark", className)}>
        ✅ {state.message}
      </p>
    );
  }

  const input = cn(
    "h-12 w-full min-w-0 rounded-md border-2 px-3 text-base outline-none transition focus-visible:ring-2",
    tone === "dark"
      ? "border-paper/40 bg-paper/95 text-ink placeholder:text-ink/50 focus-visible:ring-[#e7d27c]"
      : "border-ink/70 bg-paper text-ink placeholder:text-ink/50 focus-visible:ring-olive",
  );

  return (
    <form action={action} className={cn("space-y-2", className)} noValidate>
      <input type="hidden" name="source" value={source} />
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Leave blank
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {withName && (
          <>
            <label htmlFor={`nl-name-${source}`} className="sr-only">
              First name
            </label>
            <input id={`nl-name-${source}`} name="name" placeholder="First name" autoComplete="given-name" className={cn(input, "sm:max-w-40")} />
          </>
        )}
        <label htmlFor={`nl-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`nl-email-${source}`}
          type="email"
          name="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? `nl-err-${source}` : undefined}
          className={input}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md border-2 border-ink px-5 font-stencil text-base tracking-wider shadow-stamp-sm transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60",
            tone === "dark" ? "bg-[#e7d27c] text-ink" : "bg-olive text-paper",
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {cta}
        </button>
      </div>
      {state.error && (
        <p id={`nl-err-${source}`} role="alert" className={cn("text-sm font-semibold", tone === "dark" ? "text-[#ffd2c8]" : "text-stamp")}>
          {state.error}
        </p>
      )}
    </form>
  );
}
