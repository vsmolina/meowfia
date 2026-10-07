"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { addBundleToCart } from "@/actions/cart";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/button";

export function AddBundleButton({ bundleId, name, priceCents, upgrades }: { bundleId: string; name: string; priceCents: number; upgrades: { COMMERCIAL: number; CLASSROOM: number } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [license, setLicense] = useState<"PERSONAL" | "COMMERCIAL" | "CLASSROOM">("PERSONAL");
  const total = priceCents + (license === "PERSONAL" ? 0 : upgrades[license]);
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">License</span>
        <select value={license} onChange={(e) => setLicense(e.target.value as typeof license)} className="h-10 rounded-md border-2 border-ink/60 bg-paper px-2 font-semibold">
          <option value="PERSONAL">Personal (included)</option>
          <option value="COMMERCIAL">Commercial (+{formatMoney(upgrades.COMMERCIAL)})</option>
          <option value="CLASSROOM">Classroom (+{formatMoney(upgrades.CLASSROOM)})</option>
        </select>
      </label>
      <Button
        size="lg"
        className="h-14 w-full font-stencil text-lg tracking-wider"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await addBundleToCart({ bundleId, license });
            if (!r.ok) return void toast.error(r.error);
            track("AddToCart", { value: total / 100, content_name: name });
            router.push("/cart");
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />} Deploy the bundle · {formatMoney(total)}
      </Button>
    </div>
  );
}
