"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { submitInquiryAction } from "@/actions/inquiries";
import { initialActionState } from "@/lib/action-state";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Field = { name: string; label: string; type?: "text" | "email" | "number" | "date" | "textarea" | "select"; required?: boolean; placeholder?: string; options?: string[]; half?: boolean };

export function InquiryForm({ kind, fields, submitLabel = "Send" }: { kind: "SPONSORSHIP" | "CLASSROOM" | "CONTACT"; fields: Field[]; submitLabel?: string }) {
  const [state, action, pending] = useActionState(submitInquiryAction.bind(null, kind), initialActionState);
  if (state.ok) {
    return (
      <div role="status" className="rounded-xl border-2 border-dashed border-olive bg-olive/10 p-6 text-center">
        <p className="font-stencil text-2xl text-olive-dark">Transmission received ✅</p>
        <p className="mt-2 text-muted-foreground">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={action} onSubmit={() => track("Lead", { content_name: kind })} className="grid gap-4 sm:grid-cols-2" noValidate>
      <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {fields.map((f) => {
        const err = state.fieldErrors?.[f.name]?.[0];
        const common = { id: `f-${f.name}`, name: f.name, required: f.required, placeholder: f.placeholder, "aria-invalid": Boolean(err), "aria-describedby": err ? `e-${f.name}` : undefined };
        return (
          <div key={f.name} className={f.half ? "space-y-1.5" : "space-y-1.5 sm:col-span-2"}>
            <Label htmlFor={common.id}>
              {f.label}
              {f.required && <span className="text-stamp"> *</span>}
            </Label>
            {f.type === "textarea" ? (
              <Textarea {...common} rows={5} className="bg-paper" />
            ) : f.type === "select" ? (
              <select {...common} className="h-11 w-full rounded-md border-2 border-input bg-paper px-3">
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <Input {...common} type={f.type ?? "text"} className="h-11 bg-paper" autoComplete={f.type === "email" ? "email" : f.name === "name" ? "name" : undefined} />
            )}
            {err && <p id={`e-${f.name}`} className="text-xs font-semibold text-stamp">{err}</p>}
          </div>
        );
      })}
      {state.error && !state.fieldErrors && <p role="alert" className="text-sm font-semibold text-stamp sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />} {submitLabel}
        </Button>
      </div>
    </form>
  );
}
