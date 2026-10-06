import { FileTag } from "@/components/brand/stamp";

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-dashed border-ink/30 pb-4">
      <div>
        {eyebrow && <FileTag>{eyebrow}</FileTag>}
        <h1 className="font-stencil text-3xl text-olive-dark">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-ink/40 bg-paper/60 p-8 text-center">
      <p className="font-stencil text-xl text-olive-dark">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-muted-foreground">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
