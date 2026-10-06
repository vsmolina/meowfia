import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { features } from "@/lib/env";
import { FileTag } from "@/components/brand/stamp";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default function CheckEmailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
      <div className="rounded-xl border-2 border-ink bg-dossier p-8 shadow-stamp">
        <MailCheck className="mx-auto size-12 text-olive" aria-hidden="true" />
        <FileTag className="mt-4 block">Transmission sent</FileTag>
        <h1 className="mt-2 font-stencil text-3xl text-olive-dark">Check your inbox</h1>
        <p className="mt-3 text-muted-foreground">We sent a sign-in link. It&apos;s valid for 24 hours and works once. Check spam if it doesn&apos;t show up within a minute.</p>
        {!features.resend && (
          <p className="mt-4 rounded-md border-2 border-dashed border-olive p-3 text-left text-sm">
            <strong>Dev mode:</strong> no <code>RESEND_API_KEY</code> is set, so the link was printed in the terminal running <code>npm run dev</code>.
          </p>
        )}
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-semibold underline">
          Use a different email
        </Link>
      </div>
    </div>
  );
}
