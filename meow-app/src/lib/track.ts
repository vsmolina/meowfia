"use client";

/**
 * Fire conversion events to whichever pixels are loaded (no-ops otherwise).
 * Event names follow each platform's standard events.
 */
type W = Window & {
  ttq?: { track: (e: string, p?: Record<string, unknown>) => void };
  fbq?: (cmd: string, e: string, p?: Record<string, unknown>) => void;
  plausible?: (e: string, o?: { props?: Record<string, unknown> }) => void;
};

const MAP = {
  AddToCart: { tiktok: "AddToCart", meta: "AddToCart" },
  InitiateCheckout: { tiktok: "InitiateCheckout", meta: "InitiateCheckout" },
  Purchase: { tiktok: "CompletePayment", meta: "Purchase" },
  Lead: { tiktok: "SubmitForm", meta: "Lead" },
  Subscribe: { tiktok: "Subscribe", meta: "Subscribe" },
} as const;

export function track(event: keyof typeof MAP, props: { value?: number; currency?: string; content_name?: string } = {}) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const p = { currency: "USD", ...props };
  try {
    w.ttq?.track(MAP[event].tiktok, p);
    w.fbq?.("track", MAP[event].meta, p);
    w.plausible?.(event, { props: p });
  } catch {
    /* analytics must never break the page */
  }
}
