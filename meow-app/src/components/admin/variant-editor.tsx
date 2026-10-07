"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = { id: string; name: string; sku: string; price: string; inventory: string; printful: string };

export function VariantEditor({ initial }: { initial: { id: string; name: string; sku: string; priceCents: number | null; inventory: number | null; printfulVariantId: string | null }[] }) {
  const [rows, setRows] = useState<Row[]>(
    initial.length
      ? initial.map((v) => ({ id: v.id, name: v.name, sku: v.sku, price: v.priceCents != null ? (v.priceCents / 100).toFixed(2) : "", inventory: v.inventory != null ? String(v.inventory) : "", printful: v.printfulVariantId ?? "" }))
      : [{ id: "", name: "Standard", sku: "", price: "", inventory: "", printful: "" }],
  );
  const cell = "h-9 w-full rounded border-2 border-ink/30 bg-sand/40 px-2 text-sm";
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_1fr_auto] gap-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground sm:grid">
        <span>Name</span><span>SKU</span><span>Price override</span><span>Inventory</span><span>Printful variant</span><span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_1fr_auto]">
          <input type="hidden" name="v_id" value={r.id} />
          {(["name", "sku", "price", "inventory", "printful"] as const).map((k) => (
            <input
              key={k}
              name={`v_${k}`}
              value={r[k]}
              placeholder={k === "price" ? "base" : k === "inventory" ? "∞ (POD)" : k === "printful" ? "optional" : ""}
              aria-label={`Variant ${i + 1} ${k}`}
              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))}
              className={cell}
            />
          ))}
          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded border-2 border-ink/30" aria-label={`Remove variant ${i + 1}`}>
            <X className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setRows([...rows, { id: "", name: "", sku: "", price: "", inventory: "", printful: "" }])}>
        <Plus /> Add variant
      </Button>
      <p className="text-xs text-muted-foreground">Leave inventory blank for print-on-demand (unlimited). Variants with past orders are kept even if removed here.</p>
    </div>
  );
}
