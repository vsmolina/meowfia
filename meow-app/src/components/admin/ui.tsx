import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminPage({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
        <div>
          <h1 className="font-stencil text-3xl text-olive-dark">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, href, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string; tone?: "default" | "alert" }) {
  const body = (
    <div className={cn("h-full rounded-lg border-2 border-ink bg-paper p-4", tone === "alert" && "border-stamp bg-stamp/5", href && "transition hover:-translate-y-0.5 hover:shadow-stamp-sm")}>
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-stencil text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: string }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto rounded-lg border-2 border-ink bg-paper">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b-2 border-ink bg-muted/60">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-ink/20 [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle">
          {hasRows ? children : (
            <tr>
              <td colSpan={head.length} className="py-8 text-center text-muted-foreground">{empty ?? "Nothing here yet."}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border-2 border-ink bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-stencil text-lg">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
