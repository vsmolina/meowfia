import { features, env } from "@/lib/env";
import { runJobAction } from "@/actions/admin/marketing";
import { AdminPage, Section } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/form";

export const metadata = { title: "Jobs" };

const JOBS = [
  { id: "drops", title: "Drops", desc: "Emails members when early access opens, then announces released templates to notify-me signups and subscribers.", schedule: "every 15 min" },
  { id: "welcome", title: "Welcome series", desc: "Sends the day-2 and day-5 welcome emails to new subscribers.", schedule: "hourly" },
  { id: "abandoned-carts", title: "Abandoned carts", desc: "One reminder for carts with an email, idle 1h to 3 days.", schedule: "hourly" },
  { id: "printful-sync", title: "Printful sync", desc: "Imports/updates print-on-demand products and variants. New products arrive hidden.", schedule: "daily" },
];

export default function AdminJobs() {
  return (
    <AdminPage title="Jobs" description="These run automatically on Vercel Cron (vercel.json). Run them manually here, which is handy in local dev.">
      {!env.CRON_SECRET && <p className="rounded-md border-2 border-stamp bg-stamp/10 p-3 text-sm font-semibold">CRON_SECRET is not set. Scheduled runs will be rejected in production.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {JOBS.map((j) => (
          <Section key={j.id} title={j.title} actions={<span className="text-xs text-muted-foreground">{j.schedule}</span>}>
            <p className="text-sm text-muted-foreground">{j.desc}</p>
            {j.id === "printful-sync" && !features.printful && <p className="text-xs">Mock mode (no PRINTFUL_API_KEY)</p>}
            <ActionButton action={runJobAction.bind(null, j.id)}>Run now</ActionButton>
          </Section>
        ))}
      </div>
    </AdminPage>
  );
}
