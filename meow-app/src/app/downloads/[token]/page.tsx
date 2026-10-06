import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { verifyDownloadToken, downloadUrl } from "@/lib/downloads";
import { publicUrl } from "@/lib/media";
import { Stamp, FileTag } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your download", robots: { index: false, follow: false } };

/** Landing page linked from emails: verifies the 7-day token, then offers fresh short-lived links for each paper size */
export default async function DownloadLandingPage({ params }: PageProps<"/downloads/[token]">) {
  const { token } = await params;
  const parsed = verifyDownloadToken(token);
  const ent = parsed ? await db.entitlement.findUnique({ where: { id: parsed.entitlementId }, include: { template: true } }) : null;

  if (!ent) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Stamp size="lg">Link expired</Stamp>
        <h1 className="mt-6 font-stencil text-3xl text-olive-dark">This link has self-destructed</h1>
        <p className="mt-3 text-muted-foreground">Download links in emails last 7 days. Sign in with the same email to grab your files any time.</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/account/downloads">Go to my downloads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="overflow-hidden rounded-xl border-2 border-ink bg-dossier shadow-stamp">
        <div className="relative aspect-[4/3]">
          <Image src={publicUrl(ent.template.coverImageKey)} alt={ent.template.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 512px" priority />
        </div>
        <div className="space-y-4 p-6">
          <FileTag>Clearance confirmed · {ent.license.toLowerCase()} license</FileTag>
          <h1 className="font-stencil text-3xl text-olive-dark">{ent.template.name}</h1>
          <p className="text-muted-foreground">Choose your paper size. Print at 100% scale and check the 1-inch square on page 1.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg">
              <a href={downloadUrl(ent.id, "letter")}>
                <Download /> US Letter
              </a>
            </Button>
            <Button asChild size="lg" variant="kraft">
              <a href={downloadUrl(ent.id, "a4")}>
                <Download /> A4
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your files are saved forever in <Link href="/account/downloads" className="font-semibold underline">your account</Link>. Sign in with the email this was sent to.
          </p>
        </div>
      </div>
    </div>
  );
}
