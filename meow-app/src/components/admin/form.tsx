"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Server-action form with toasts, field errors, and optional redirect */
export function AdminForm({ action, children, submitLabel = "Save", className }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; children: React.ReactNode; submitLabel?: string; className?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      if (state.redirectTo) router.push(state.redirectTo);
      else router.refresh();
    } else if (state.error) toast.error(state.error);
  }, [state, router]);
  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {children}
      {state.error && <p role="alert" className="text-sm font-semibold text-stamp">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {submitLabel}
      </Button>
    </form>
  );
}

const inputCls = "h-10 w-full rounded-md border-2 border-ink/40 bg-sand/40 px-3 text-sm focus-visible:border-ink focus-visible:outline-none";

export function Field({ label, name, hint, className, children }: { label: string; name?: string; hint?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={name ? `f-${name}` : undefined} className="text-sm font-semibold">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, name, defaultValue, hint, required, type = "text", className, placeholder, step }: { label: string; name: string; defaultValue?: string | number | null; hint?: string; required?: boolean; type?: string; className?: string; placeholder?: string; step?: string }) {
  return (
    <Field label={label} name={name} hint={hint} className={className}>
      <input id={`f-${name}`} name={name} type={type} step={step} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} className={inputCls} />
    </Field>
  );
}

export function MoneyInput({ label, name, cents, hint, required, className }: { label: string; name: string; cents?: number | null; hint?: string; required?: boolean; className?: string }) {
  return (
    <Field label={label} name={name} hint={hint} className={className}>
      <div className="flex items-center gap-1">
        <span className="font-semibold">$</span>
        <input id={`f-${name}`} name={name} inputMode="decimal" defaultValue={cents != null ? (cents / 100).toFixed(2) : ""} required={required} className={inputCls} />
      </div>
    </Field>
  );
}

export function TextArea({ label, name, defaultValue, hint, rows = 4, className, required }: { label: string; name: string; defaultValue?: string | null; hint?: string; rows?: number; className?: string; required?: boolean }) {
  return (
    <Field label={label} name={name} hint={hint} className={className}>
      <textarea id={`f-${name}`} name={name} rows={rows} defaultValue={defaultValue ?? ""} required={required} className={cn(inputCls, "h-auto py-2")} />
    </Field>
  );
}

export function SelectInput({ label, name, options, defaultValue, hint, className }: { label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string | null; hint?: string; className?: string }) {
  return (
    <Field label={label} name={name} hint={hint} className={className}>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue ?? ""} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--olive)]" />
      <span>
        <span className="font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/** Two-step destructive button (no browser confirm dialogs) */
export function ConfirmButton({ action, label = "Delete", confirmLabel = "Click again to confirm", size = "sm" }: { action: () => Promise<unknown>; label?: string; confirmLabel?: string; size?: "sm" | "default" }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button
      type="button"
      size={size}
      variant="destructive"
      disabled={pending}
      onClick={async () => {
        if (!armed) return setArmed(true);
        setPending(true);
        try {
          await action();
          toast.success("Done");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
          setPending(false);
          setArmed(false);
        }
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} {armed ? confirmLabel : label}
    </Button>
  );
}

/** Small inline action button (approve, feature, run job, etc.) */
export function ActionButton({ action, children, variant = "outline", size = "sm", successMessage }: { action: () => Promise<unknown>; children: React.ReactNode; variant?: "outline" | "default" | "kraft" | "stamp"; size?: "sm" | "default"; successMessage?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const r = await action();
          toast.success(successMessage ?? (typeof r === "object" && r ? `Done: ${JSON.stringify(r)}` : "Done"));
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending && <Loader2 className="animate-spin" />} {children}
    </Button>
  );
}
