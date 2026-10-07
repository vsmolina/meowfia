import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { setInquiryStatusAction } from "@/actions/admin/marketing";
import { AdminPage } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/form";
import { StatusBadge } from "@/components/site/status-badge";

export const metadata = { title: "Inquiries" };

export default async function AdminInquiries() {
  const list = await db.inquiry.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <AdminPage title="Inquiries" description="Sponsorships, classroom quotes, and contact messages. Each one also emailed you; reply from your inbox.">
      <div className="space-y-3">
        {list.map((q) => (
          <article key={q.id} className="rounded-lg border-2 border-ink bg-paper p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="mr-2 rounded bg-ink px-2 py-0.5 font-mono text-[0.65rem] uppercase text-paper">{q.kind}</span>
                <span className="font-semibold">{q.company ?? q.name}</span>
                <span className="ml-2 text-sm text-muted-foreground">{q.name} · <a className="underline" href={`mailto:${q.email}`}>{q.email}</a> · {formatDate(q.createdAt)}</span>
              </div>
              <StatusBadge status={q.status} />
            </header>
            <p className="mt-2 whitespace-pre-line text-sm">{q.message}</p>
            {(q.budget || q.data) && (
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {q.budget && <div><dt className="inline font-semibold">Budget:</dt> <dd className="inline">{q.budget}</dd></div>}
                {q.data && Object.entries(q.data as Record<string, unknown>).map(([k, v]) => <div key={k}><dt className="inline font-semibold">{k}:</dt> <dd className="inline">{String(v)}</dd></div>)}
              </dl>
            )}
            <div className="mt-3 flex flex-wrap gap-1">
              {(["NEW", "IN_PROGRESS", "WON", "CLOSED"] as const).filter((s) => s !== q.status).map((s) => (
                <ActionButton key={s} action={setInquiryStatusAction.bind(null, q.id, s)} successMessage="Updated">Mark {s.replace("_", " ").toLowerCase()}</ActionButton>
              ))}
            </div>
          </article>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No inquiries yet.</p>}
      </div>
    </AdminPage>
  );
}
