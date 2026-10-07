import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL } from "@/content/legal";
import { FileTag } from "@/components/brand/stamp";

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const doc = LEGAL[(await params).slug];
  return doc ? { title: doc.title, alternates: { canonical: `/legal/${(await params).slug}` } } : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const doc = LEGAL[slug];
  if (!doc) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div role="note" className="mb-8 rounded-lg border-2 border-stamp bg-stamp/10 p-4 text-sm">
        <p className="font-bold text-stamp">⚠️ PLACEHOLDER: REVIEW BEFORE LAUNCH</p>
        <p className="mt-1">This page contains template text only and is not legal advice. Have it reviewed and replaced by a qualified professional. Edit in <code>src/content/legal.ts</code>.</p>
      </div>
      <FileTag>Last updated: {doc.updated}</FileTag>
      <h1 className="mt-1 font-stencil text-4xl text-olive-dark">{doc.title}</h1>
      <div className="mt-8 space-y-8">
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-stencil text-xl">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 leading-relaxed">{p}</p>
            ))}
          </section>
        ))}
      </div>
      <nav aria-label="Other policies" className="mt-12 flex flex-wrap gap-3 border-t-2 border-dashed border-ink/30 pt-6 text-sm">
        {Object.entries(LEGAL).filter(([k]) => k !== slug).map(([k, d]) => (
          <Link key={k} href={`/legal/${k}`} className="underline">{d.title}</Link>
        ))}
      </nav>
    </article>
  );
}
