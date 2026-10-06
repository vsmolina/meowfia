import "server-only";
import { env, features } from "@/lib/env";

/**
 * Minimal Printful API client (https://developers.printful.com/docs/).
 * With no PRINTFUL_API_KEY it returns a mock catalog and logs orders instead of placing them.
 */
const API = "https://api.printful.com";

export type PrintfulSyncProduct = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  variants: { id: string; name: string; retailPriceCents: number; sku: string }[];
};

export type PrintfulRecipient = {
  name: string;
  address1: string;
  address2?: string | null;
  city: string;
  state_code?: string | null;
  country_code: string;
  zip: string;
  email?: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
      ...(env.PRINTFUL_STORE_ID ? { "X-PF-Store-Id": env.PRINTFUL_STORE_ID } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const json = (await res.json()) as { code: number; result: T; error?: { message: string } };
  if (!res.ok) throw new Error(`Printful ${res.status}: ${json.error?.message ?? "unknown error"}`);
  return json.result;
}

const MOCK_CATALOG: PrintfulSyncProduct[] = [
  {
    id: "mock-tee",
    name: "Meowfia Motor Pool Tee",
    thumbnailUrl: null,
    variants: ["S", "M", "L", "XL", "2XL"].map((s, i) => ({
      id: `mock-tee-${s}`,
      name: `${s} / Olive`,
      retailPriceCents: i >= 4 ? 2900 : 2700,
      sku: `PF-TEE-OLV-${s}`,
    })),
  },
  {
    id: "mock-hoodie",
    name: "Armored Division Hoodie",
    thumbnailUrl: null,
    variants: ["S", "M", "L", "XL"].map((s) => ({ id: `mock-hoodie-${s}`, name: `${s} / Khaki`, retailPriceCents: 4800, sku: `PF-HOOD-KHK-${s}` })),
  },
];

export async function listSyncProducts(): Promise<PrintfulSyncProduct[]> {
  if (!features.printful) return MOCK_CATALOG;
  type Raw = { id: number; name: string; thumbnail_url: string | null };
  type RawDetail = {
    sync_product: Raw;
    sync_variants: { id: number; name: string; retail_price: string; sku: string }[];
  };
  const list = await call<Raw[]>("/store/products?limit=100");
  const details = await Promise.all(list.map((p) => call<RawDetail>(`/store/products/${p.id}`)));
  return details.map((d) => ({
    id: String(d.sync_product.id),
    name: d.sync_product.name,
    thumbnailUrl: d.sync_product.thumbnail_url,
    variants: d.sync_variants.map((v) => ({
      id: String(v.id),
      name: v.name.replace(`${d.sync_product.name} - `, ""),
      retailPriceCents: Math.round(parseFloat(v.retail_price) * 100),
      sku: v.sku,
    })),
  }));
}

export async function createPrintfulOrder(args: {
  externalId: string;
  recipient: PrintfulRecipient;
  items: { syncVariantId: string; quantity: number }[];
}): Promise<{ id: string; mock: boolean }> {
  if (!features.printful) {
    console.log(`[printful:mock] Would create order ${args.externalId} with`, args.items);
    return { id: `mock-pf-${args.externalId}`, mock: true };
  }
  // confirm=false creates a draft order she can review in the Printful dashboard.
  // Flip to confirm=true to auto-submit for fulfillment once she's comfortable.
  const result = await call<{ id: number }>("/orders?confirm=false", {
    method: "POST",
    body: JSON.stringify({
      external_id: args.externalId,
      recipient: args.recipient,
      items: args.items.map((i) => ({ sync_variant_id: Number(i.syncVariantId), quantity: i.quantity })),
    }),
  });
  return { id: String(result.id), mock: false };
}
