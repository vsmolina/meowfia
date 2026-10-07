import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { Stamp } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Thank you!", robots: { index: false } };

export default async function TipThanks({ searchParams }: PageProps<"/support/thanks">) {
  const id = String((await searchParams).tip ?? "");
  const tip = id ? await db.tip.findUnique({ where: { id } }) : null;
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Stamp size="lg" color="olive">Salute!</Stamp>
      <h1 className="mt-6 font-stencil text-4xl text-olive-dark">Thank you{tip?.name ? `, ${tip.name}` : ""}!</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {tip?.paid ? `Your ${formatMoney(tip.amountCents)} tip just landed. ` : "Your tip is processing. "}
        {siteConfig.cats[0]?.name ?? "The crew"} has been informed and is reportedly purring.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild><Link href="/support#wall">See the wall</Link></Button>
        <Button asChild variant="outline"><Link href="/fleet">Browse the Fleet</Link></Button>
      </div>
    </div>
  );
}
