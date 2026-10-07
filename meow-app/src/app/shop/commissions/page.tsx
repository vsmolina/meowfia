import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/format";
import { SectionHeading, FileTag } from "@/components/brand/stamp";
import { CommissionForm } from "@/components/shop/commission-form";

export const metadata: Metadata = { title: "Custom commissions", description: "Turn your car, truck, motorcycle, or house into a custom cardboard vehicle for your cat.", alternates: { canonical: "/shop/commissions" } };

const STEPS = [
  ["Send blueprints", `Upload photos and pay a ${formatMoney(siteConfig.commerce.commissionDepositCents)} deposit to hold your spot.`],
  ["Get a quote", "Within 3 business days you'll get a final price and ship date. Most commissions are $150–$350."],
  ["We build it", "Your build gets documented (with your OK, it might even star in a TikTok)."],
  ["Deployment", "It ships flat-packed with a custom field manual, ready to fold, tape, and present."],
];

export default function CommissionsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Special projects division" title="Custom Commissions" description="Your family car, your dad's pickup, your Vespa, your actual house, rebuilt in cardboard at cat scale." />
      <ol className="mt-10 grid gap-4 sm:grid-cols-4">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="rounded-xl border-2 border-ink bg-paper p-4 shadow-stamp-sm">
            <span className="font-mono text-xs text-muted-foreground">STEP {i + 1}</span>
            <p className="font-stencil text-lg">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </li>
        ))}
      </ol>
      <section className="mt-12 rounded-2xl border-2 border-ink bg-dossier p-6 shadow-stamp sm:p-8">
        <FileTag>Form SP-9 · Commission request</FileTag>
        <h2 className="mt-1 mb-6 font-stencil text-3xl text-olive-dark">Submit your blueprints</h2>
        <CommissionForm depositCents={siteConfig.commerce.commissionDepositCents} />
      </section>
    </div>
  );
}
