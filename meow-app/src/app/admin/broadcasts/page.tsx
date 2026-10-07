import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { segmentCounts } from "@/lib/marketing";
import { deleteBroadcastAction, saveBroadcastAction, sendBroadcastAction, sendTestBroadcastAction } from "@/actions/admin/marketing";
import { AdminPage, Section, Table } from "@/components/admin/ui";
import { ActionButton, AdminForm, ConfirmButton, SelectInput, TextArea, TextInput } from "@/components/admin/form";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Broadcasts" };

const SEGMENT_LABELS = { ALL: "Everyone subscribed", FREE: "Free subscribers (never bought)", BUYERS: "Buyers", MEMBERS: "Barracks members" } as const;

export default async function AdminBroadcasts({ searchParams }: PageProps<"/admin/broadcasts">) {
  const sp = await searchParams;
  const [list, counts] = await Promise.all([db.broadcast.findMany({ orderBy: { createdAt: "desc" } }), segmentCounts()]);
  const editing = typeof sp.edit === "string" ? list.find((b) => b.id === sp.edit && b.status === "DRAFT") : null;
  return (
    <AdminPage
      title="Broadcasts"
      description="Newsletter emails to a segment. Every email includes an unsubscribe link."
      actions={
        <>
          {(["ALL", "FREE", "BUYERS", "MEMBERS"] as const).map((s) => (
            <Button key={s} asChild variant="outline" size="sm"><a href={`/api/admin/export/subscribers?segment=${s}`} download>Export {s.toLowerCase()} ({counts[s]})</a></Button>
          ))}
        </>
      }
    >
      <Section title={editing ? "Edit draft" : "Compose"}>
        <AdminForm action={saveBroadcastAction.bind(null, editing?.id ?? null)} submitLabel="Save draft">
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Subject" name="subject" defaultValue={editing?.subject} required />
            <TextInput label="Preview text" name="previewText" defaultValue={editing?.previewText} />
          </div>
          <SelectInput label="Segment" name="segment" defaultValue={editing?.segment ?? "ALL"} options={(Object.keys(SEGMENT_LABELS) as (keyof typeof SEGMENT_LABELS)[]).map((s) => ({ value: s, label: `${SEGMENT_LABELS[s]} (${counts[s]})` }))} />
          <TextArea
            label="Body"
            name="body"
            defaultValue={editing?.body}
            rows={10}
            hint="Blank line = new paragraph · ## Heading · [button: Shop now](https://…) · ![alt](https://image-url)"
          />
        </AdminForm>
      </Section>
      <Table head={["Subject", "Segment", "Status", "Recipients", "Sent", ""]}>
        {list.map((b) => (
          <tr key={b.id}>
            <td className="font-semibold">{b.subject}</td>
            <td>{SEGMENT_LABELS[b.segment]}</td>
            <td><StatusBadge status={b.status} /></td>
            <td>{b.status === "SENT" ? b.recipientCount : `~${counts[b.segment]}`}</td>
            <td className="text-xs">{b.sentAt ? formatDate(b.sentAt) : "-"}</td>
            <td>
              {b.status === "DRAFT" && (
                <div className="flex flex-wrap gap-1">
                  <Button asChild size="sm" variant="outline"><a href={`/admin/broadcasts?edit=${b.id}`}>Edit</a></Button>
                  <ActionButton action={sendTestBroadcastAction.bind(null, b.id)} successMessage="Test sent to you">Send test</ActionButton>
                  <ConfirmButton action={sendBroadcastAction.bind(null, b.id)} label={`Send to ${counts[b.segment]}`} confirmLabel="Click again to SEND" />
                  <ConfirmButton action={deleteBroadcastAction.bind(null, b.id)} label="Delete" />
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
