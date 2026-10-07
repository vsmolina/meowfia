import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { AdminPage, Table } from "@/components/admin/ui";

export const metadata = { title: "Email log" };

export default async function AdminEmails({ searchParams }: PageProps<"/admin/emails">) {
  const sp = await searchParams;
  const view = typeof sp.view === "string" ? await db.emailLog.findUnique({ where: { id: sp.view } }) : null;
  const logs = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, to: true, subject: true, template: true, provider: true, status: true, error: true, createdAt: true } });
  return (
    <AdminPage title="Email log" description={features.resend ? "Sending via Resend." : "Console mode: emails are logged here and printed to the server console, not delivered."}>
      {view?.html && (
        <div className="overflow-hidden rounded-lg border-2 border-ink">
          <p className="border-b-2 border-ink bg-muted px-3 py-2 text-sm font-semibold">{view.subject} → {view.to}</p>
          {/* Sandboxed: no scripts, no same-origin access */}
          <iframe srcDoc={view.html} sandbox="" title="Email preview" className="h-[600px] w-full bg-white" />
        </div>
      )}
      <Table head={["When", "To", "Subject", "Template", "Status"]}>
        {logs.map((l) => (
          <tr key={l.id}>
            <td className="text-xs whitespace-nowrap">{l.createdAt.toLocaleString()}</td>
            <td className="max-w-48 truncate">{l.to}</td>
            <td>{l.provider === "console" ? <a href={`/admin/emails?view=${l.id}`} className="underline">{l.subject}</a> : l.subject}</td>
            <td className="font-mono text-xs">{l.template}</td>
            <td className={l.status === "failed" ? "font-semibold text-stamp" : ""} title={l.error ?? ""}>{l.status}</td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
