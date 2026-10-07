import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { publicUrl } from "@/lib/media";
import { SectionHeading } from "@/components/brand/stamp";
import { GiftCardForm } from "@/components/shop/gift-card-form";

export const metadata: Metadata = { title: "Gift cards", description: "Digital gift cards for cardboard cat vehicle templates, kits, and merch. Any amount, delivered instantly.", alternates: { canonical: "/shop/gift-cards" } };

export default function GiftCardsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" eyebrow="Supply vouchers" title="Gift Cards" description="For the cat person who has everything except a cardboard battleship." />
      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-start">
        <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-ink shadow-stamp">
          <Image src={publicUrl("seed/products/gift-card.png")} alt="Gift card" fill priority sizes="(max-width: 768px) 100vw, 440px" className="object-cover" />
        </div>
        <div className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-stamp">
          <GiftCardForm presets={siteConfig.commerce.giftCardPresetsCents} />
        </div>
      </div>
    </div>
  );
}
