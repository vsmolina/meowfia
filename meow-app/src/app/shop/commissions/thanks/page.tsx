import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Stamp } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Commission received", robots: { index: false } };

export default async function CommissionThanks({ searchParams }: PageProps<"/shop/commissions/thanks">) {
  const id = String((await searchParams).id ?? "");
  const c = id ? await db.commission.findUnique({ where: { id }, select: { status: true, name: true } }) : null;
  const paid = c && c.status !== "REQUESTED";
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Stamp size="lg" color="olive">{paid ? "Deposit received" : "Processing"}</Stamp>
      <h1 className="mt-6 font-stencil text-3xl text-olive-dark">{paid ? `Blueprints received${c?.name ? `, ${c.name.split(" ")[0]}` : ""}!` : "Confirming your deposit…"}</h1>
      <p className="mt-3 text-muted-foreground">You&apos;ll get a quote and estimated ship date by email within 3 business days. Keep an eye on your inbox (and spam folder).</p>
      <Button asChild className="mt-6"><Link href="/fleet">Browse templates meanwhile</Link></Button>
    </div>
  );
}
