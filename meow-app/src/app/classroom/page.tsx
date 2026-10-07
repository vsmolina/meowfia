import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Calculator, PackageOpen, School } from "lucide-react";
import { db } from "@/lib/db";
import { bundlePriceCents } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { SectionHeading, FileTag } from "@/components/brand/stamp";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Classroom & bulk: STEM cardboard engineering",
  description: "Cardboard engineering for classrooms, libraries, and makerspaces. Classroom licenses, STEM bundles, and bulk pre-cut kit pricing.",
  alternates: { canonical: "/classroom" },
};

const TIERS = [
  { qty: "10–24 kits", off: "15% off" },
  { qty: "25–49 kits", off: "20% off" },
  { qty: "50–99 kits", off: "25% off" },
  { qty: "100+ kits", off: "Let's talk" },
];

export default async function ClassroomPage() {
  const arsenal = await db.bundle.findUnique({ where: { slug: "complete-arsenal" }, include: { items: { include: { template: true } } } });
  const arsenalPrice = arsenal ? bundlePriceCents(arsenal.items.map((i) => i.template), arsenal.discountPercent) : null;
  const classroomUpgrade = arsenal?.items.reduce((a, i) => a + i.template.classroomUpgradeCents, 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Education division" title="Classroom & Bulk" description="Real engineering with free materials: measuring, scoring, structural strength, and design iteration. And yes, a cat (or stuffed animal) test pilot." />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          { icon: BookOpenCheck, title: "Classroom license", body: "Print a template for every student in your class, library, or workshop. Add it to any template at checkout." },
          { icon: School, title: "STEM bundle", body: "Every template with a classroom license, plus lesson prompts on measurement, load-bearing structures, and design." },
          { icon: PackageOpen, title: "Bulk pre-cut kits", body: "No knives in the classroom. Die-cut kits that fold and tape together, ideal for ages 7+ with adult help." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border-2 border-ink bg-paper p-5 shadow-stamp-sm">
            <f.icon className="size-8 text-olive" aria-hidden="true" />
            <h2 className="mt-3 font-stencil text-xl">{f.title}</h2>
            <p className="mt-1 text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {arsenal && arsenalPrice && (
          <section className="rounded-2xl border-2 border-ink bg-olive-camo p-6 text-paper shadow-stamp">
            <FileTag className="text-[#e7d27c]">STEM bundle</FileTag>
            <h2 className="mt-1 font-stencil text-3xl">Complete Arsenal + Classroom license</h2>
            <p className="mt-2 text-paper/85">All {arsenal.items.length} public templates, licensed for unlimited printing within one school or organization.</p>
            <p className="mt-4 font-stencil text-4xl">{formatMoney(arsenalPrice.priceCents + classroomUpgrade)}</p>
            <p className="text-sm text-paper/70">Purchase orders accepted. Use the form for an invoice.</p>
            <Button asChild variant="kraft" className="mt-5">
              <Link href="/fleet/bundles/complete-arsenal">Buy with classroom license</Link>
            </Button>
          </section>
        )}
        <section className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-stamp">
          <div className="flex items-center gap-2">
            <Calculator className="size-6 text-olive" aria-hidden="true" />
            <h2 className="font-stencil text-2xl">Bulk kit pricing</h2>
          </div>
          <table className="mt-4 w-full text-left">
            <caption className="sr-only">Bulk pre-cut kit discounts</caption>
            <thead>
              <tr className="border-b-2 border-ink font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-2">Quantity</th>
                <th className="py-2 text-right">Discount</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.qty} className="border-b border-dashed border-ink/25">
                  <td className="py-2.5 font-semibold">{t.qty}</td>
                  <td className="py-2.5 text-right font-stencil text-lg text-olive-dark">{t.off}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted-foreground">Applies to any mix of pre-cut kits. Shipping quoted separately for bulk orders. PLACEHOLDER: confirm pricing before launch.</p>
        </section>
      </div>

      <section id="quote" className="mt-14 scroll-mt-24 rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp sm:p-8">
        <FileTag>Form ED-7 · Quote request</FileTag>
        <h2 className="mt-1 mb-6 font-stencil text-3xl text-olive-dark">Request a classroom quote</h2>
        <InquiryForm
          kind="CLASSROOM"
          submitLabel="Request quote"
          fields={[
            { name: "name", label: "Your name", required: true, half: true },
            { name: "email", label: "School email", type: "email", required: true, half: true },
            { name: "company", label: "School / organization", half: true },
            { name: "students", label: "Number of students", type: "number", half: true },
            { name: "kitsWanted", label: "Which templates or kits?", placeholder: "e.g. 28 Kitten Jeep kits", half: true },
            { name: "needBy", label: "Needed by", type: "date", half: true },
            { name: "message", label: "Tell us about your class or event", type: "textarea", required: true },
          ]}
        />
      </section>
    </div>
  );
}
