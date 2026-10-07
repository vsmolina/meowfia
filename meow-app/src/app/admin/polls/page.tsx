import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { createPollAction, deletePollAction, setPollStatusAction } from "@/actions/admin/content";
import { AdminPage, Section } from "@/components/admin/ui";
import { ActionButton, AdminForm, ConfirmButton, TextArea, TextInput } from "@/components/admin/form";
import { StatusBadge } from "@/components/site/status-badge";

export const metadata = { title: "Polls" };

export default async function AdminPolls() {
  const polls = await db.poll.findMany({ orderBy: { createdAt: "desc" }, include: { options: true, votes: true } });
  return (
    <AdminPage title="Polls" description="Members vote on upcoming builds at /barracks/vote. Officer votes count ×2, Commander ×3.">
      <Section title="New poll">
        <AdminForm action={createPollAction} submitLabel="Open poll">
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Question" name="title" required placeholder="What should we build in December?" />
            <TextInput label="Closes at" name="closesAt" type="datetime-local" />
          </div>
          <TextInput label="Description" name="description" />
          <TextArea label="Options (one per line)" name="options" rows={4} />
        </AdminForm>
      </Section>
      {polls.map((p) => {
        const total = p.votes.reduce((a, v) => a + v.weight, 0) || 1;
        return (
          <Section key={p.id} title={p.title} actions={<StatusBadge status={p.status} />}>
            <p className="text-xs text-muted-foreground">{p.votes.length} voters · {p.closesAt ? `closes ${formatDate(p.closesAt)}` : "no close date"}</p>
            <ul className="space-y-1">
              {p.options
                .map((o) => ({ o, w: p.votes.filter((v) => v.optionId === o.id).reduce((a, v) => a + v.weight, 0) }))
                .sort((a, b) => b.w - a.w)
                .map(({ o, w }) => (
                  <li key={o.id} className="relative overflow-hidden rounded border border-ink/30 px-3 py-1.5 text-sm">
                    <span className="absolute inset-y-0 left-0 bg-olive/15" style={{ width: `${(w / total) * 100}%` }} />
                    <span className="relative flex justify-between"><span>{o.label}</span><span className="font-semibold">{w} pts</span></span>
                  </li>
                ))}
            </ul>
            <div className="flex gap-2">
              <ActionButton action={setPollStatusAction.bind(null, p.id, p.status === "OPEN" ? "CLOSED" : "OPEN")}>{p.status === "OPEN" ? "Close voting" : "Reopen"}</ActionButton>
              <ConfirmButton action={deletePollAction.bind(null, p.id)} />
            </div>
          </Section>
        );
      })}
    </AdminPage>
  );
}
