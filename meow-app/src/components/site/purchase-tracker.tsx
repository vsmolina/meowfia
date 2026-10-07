"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Fires the Purchase pixel event once per order */
export function PurchaseTracker({ value, orderId }: { value: number; orderId: string }) {
  useEffect(() => {
    const key = `tracked-${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    track("Purchase", { value });
  }, [value, orderId]);
  return null;
}
