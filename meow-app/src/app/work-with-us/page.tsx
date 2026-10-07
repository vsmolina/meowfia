import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { formatCompact } from "@/lib/format";
import { SectionHeading, FileTag, Stamp } from "@/components/brand/stamp";
import { InquiryForm } from "@/components/forms/inquiry-form";

export const metadata: Metadata = {
  title: "Work With Us: media kit & sponsorships",
  description: `Brand partnerships with ${siteConfig.name}: audience stats, demographics, past collaborations, and sponsorship packages.`,
  alternates: { canonical: "/work-with-us" },
};

function Bars({ title, data }: { title: string; data: readonly { label: string; value: number }[] }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-paper p-5">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {data.map((d) => (
          <li key={d.label}>
            <div className="flex justify-between text-sm">
              <span>{d.label}</span>
              <span className="font-semibold">{d.value}%</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded bg-ink/10" role="presentation">
              <div className="h-full bg-olive" style={{ width: `${d.value}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WorkWithUsPage() {
  const s = siteConfig.stats;
  const mk = siteConfig.mediaKit;
  const stats = [
    { label: "TikTok followers", value: formatCompact(s.tiktokFollowers) },
    { label: "Total likes", value: formatCompact(s.tiktokLikes) },
    { label: "Total views", value: formatCompact(s.totalViews) },
    { label: "Avg views / video", value: formatCompact(s.avgViewsPerVideo) },
    { label: "Engagement rate", value: `${s.engagementRate}%` },
    { label: "Email subscribers", value: formatCompact(s.emailSubscribers) },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading as="h1" eyebrow="Joint operations" title="Work With Us" description="Wholesome, highly shareable content with an audience that actually builds things. Let's put your product in the cockpit." />
        <Stamp size="lg" color="olive" rotate={5}>Media kit</Stamp>
      </div>

      <section aria-label="Audience stats" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((x) => (
          <div key={x.label} className="rounded-xl border-2 border-ink bg-ink p-4 text-center text-paper shadow-stamp-sm">
            <p className="font-stencil text-2xl text-[#e7d27c]">{x.value}</p>
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-paper/70">{x.label}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="demo-h" className="mt-12">
        <h2 id="demo-h" className="mb-4 font-stencil text-2xl text-olive-dark">Audience</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Bars title="Gender" data={mk.audience.gender} />
          <Bars title="Age" data={mk.audience.age} />
          <Bars title="Top countries" data={mk.audience.topCountries} />
        </div>
      </section>

      <section aria-labelledby="partners-h" className="mt-12">
        <h2 id="partners-h" className="mb-4 font-stencil text-2xl text-olive-dark">Past collaborations</h2>
        <ul className="flex flex-wrap gap-3">
          {mk.pastPartners.map((p) => (
            <li key={p} className="rounded-lg border-2 border-ink/70 bg-paper px-4 py-2 font-semibold">{p}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pkg-h" className="mt-12">
        <h2 id="pkg-h" className="mb-4 font-stencil text-2xl text-olive-dark">Packages</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {mk.packages.map((p) => (
            <div key={p.name} className="rounded-xl border-2 border-ink bg-paper p-5 shadow-stamp-sm">
              <h3 className="font-stencil text-xl">{p.name}</h3>
              <p className="mt-1 font-semibold text-olive-dark">{p.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Rates are placeholders. Update them in src/config/site.ts → mediaKit.packages.</p>
      </section>

      <section id="inquire" className="mt-14 scroll-mt-24 rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp sm:p-8">
        <FileTag>Form JO-1 · Partnership inquiry</FileTag>
        <h2 className="mt-1 mb-6 font-stencil text-3xl text-olive-dark">Start a mission together</h2>
        <InquiryForm
          kind="SPONSORSHIP"
          submitLabel="Send inquiry"
          fields={[
            { name: "name", label: "Your name", required: true, half: true },
            { name: "email", label: "Work email", type: "email", required: true, half: true },
            { name: "company", label: "Brand / company", half: true },
            { name: "budget", label: "Budget", type: "select", options: ["Under $1,000", "$1,000–$2,000", "$2,000–$5,000", "$5,000+", "Product / affiliate only"], half: true },
            { name: "timeline", label: "Timeline", placeholder: "e.g. Q4 holiday campaign", half: true },
            { name: "deliverables", label: "Deliverables of interest", placeholder: "Dedicated video, custom vehicle…", half: true },
            { name: "message", label: "Tell us about the campaign", type: "textarea", required: true },
          ]}
        />
      </section>
    </div>
  );
}
