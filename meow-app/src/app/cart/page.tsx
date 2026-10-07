import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, Package, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getCart, loadCartView } from "@/lib/cart";
import { getSessionUser } from "@/lib/auth-helpers";
import { isStripeMock } from "@/lib/stripe";
import { publicUrl } from "@/lib/media";
import { formatMoney } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/brand/stamp";
import { EmptyState } from "@/components/account/page-title";
import { Button } from "@/components/ui/button";
import { CheckoutForm, CouponForm, GiftCardForm, LicenseSelect, OrderBump, PwywEditor, QuantityStepper, RemoveButton, ShippingSelect, UpsellButton } from "@/components/cart/cart-controls";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage({ searchParams }: PageProps<"/cart">) {
  const sp = await searchParams;
  const [cart, user] = await Promise.all([getCart(), getSessionUser()]);
  const view = await loadCartView(cart);
  const { pricing } = view;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading as="h1" eyebrow="Supply manifest" title="Your cart" />
        <div className="mt-8">
          <EmptyState title="Supply crate is empty" action={<Button asChild><Link href="/fleet">Browse the Fleet</Link></Button>}>
            Pick a vehicle and your cat will take it from there.
          </EmptyState>
        </div>
      </div>
    );
  }

  const itemsById = new Map(cart.items.map((i) => [i.id, i]));
  const inCartProductIds = new Set(cart.items.flatMap((i) => (i.variant ? [i.variant.productId] : [])));
  const inCartTemplateIds = new Set(cart.items.flatMap((i) => (i.templateId ? [i.templateId] : i.bundle ? i.bundle.items.map((b) => b.templateId) : [])));

  // Upsells: matching add-ons, pre-cut kits for templates in the cart, incomplete bundles
  const upsellIds = [...new Set(cart.items.flatMap((i) => (i.variant?.product.upsellProductId ? [i.variant.product.upsellProductId] : [])))].filter((id) => !inCartProductIds.has(id));
  const [upsellProducts, kitsForTemplates, bundles, bump] = await Promise.all([
    db.product.findMany({ where: { id: { in: upsellIds }, active: true }, include: { variants: { take: 1 } } }),
    db.product.findMany({ where: { type: "KIT", active: true, templateId: { in: [...inCartTemplateIds] }, id: { notIn: [...inCartProductIds] } }, include: { variants: { take: 1 } }, take: 2 }),
    db.bundle.findMany({ where: { active: true }, include: { items: true } }),
    db.product.findUnique({ where: { slug: siteConfig.commerce.orderBump.productSlug }, include: { variants: { take: 1 } } }),
  ]);
  const almostBundles = bundles
    .filter((b) => !cart.items.some((i) => i.bundleId === b.id))
    .map((b) => ({ b, have: b.items.filter((i) => inCartTemplateIds.has(i.templateId)).length }))
    .filter(({ b, have }) => have > 0 && have < b.items.length)
    .sort((x, y) => y.have / y.b.items.length - x.have / x.b.items.length)
    .slice(0, 1);
  const bumpInCart = bump ? inCartProductIds.has(bump.id) : false;

  const licenseOptions = [
    { value: "PERSONAL", label: "Personal" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "CLASSROOM", label: "Classroom" },
  ];

  const summary: [string, number, string?][] = [
    ["Subtotal", pricing.subtotalCents],
    ...pricing.bundleDiscounts.map((d) => [`${d.name} bundle discount`, -d.amountCents] as [string, number]),
    ...(pricing.memberDiscountCents ? [[`Member discount (${view.memberDiscountPercent}%)`, -pricing.memberDiscountCents] as [string, number]] : []),
    ...(pricing.couponDiscountCents ? [[`Promo ${cart.couponCode}`, -pricing.couponDiscountCents] as [string, number]] : []),
    ...(pricing.needsShipping ? [["Shipping", pricing.shippingCents, pricing.shippingCents === 0 ? "Free" : undefined] as [string, number, string?]] : []),
    ...(pricing.creditAppliedCents ? [["Store credit", -pricing.creditAppliedCents] as [string, number]] : []),
    ...(pricing.giftCardAppliedCents ? [["Gift card", -pricing.giftCardAppliedCents] as [string, number]] : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading as="h1" eyebrow="Supply manifest" title="Your cart" />
      {sp.canceled && <p className="mt-4 rounded-md border-2 border-dashed border-ink/40 p-3 text-sm">Checkout canceled. Your cart is right where you left it.</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <ul className="divide-y-2 divide-dashed divide-ink/20 rounded-xl border-2 border-ink bg-paper">
            {pricing.lines.map((line) => {
              const item = itemsById.get(line.id)!;
              const img = item.template?.coverImageKey ?? item.bundle?.coverImageKey ?? (item.variant ? (item.variant.product.imageKeys as string[])[0] : "seed/products/gift-card.png");
              const href = item.template ? `/fleet/${item.template.slug}` : item.bundle ? `/fleet/bundles/${item.bundle.slug}` : item.variant ? `/shop/${item.variant.product.slug}` : "/shop/gift-cards";
              return (
                <li key={line.id} className="flex gap-4 p-4">
                  <Link href={href} className="relative size-20 shrink-0 overflow-hidden rounded-md border border-ink/40 bg-sand sm:size-24">
                    <Image src={publicUrl(img)} alt="" fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={href} className="font-semibold hover:underline">
                          {line.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {line.kind === "PRODUCT" ? (item.variant?.product.type === "KIT" ? "Pre-cut kit · ships flat" : "Merch") : line.kind === "GIFT_CARD" ? `Emailed to ${item.giftRecipientEmail}` : "Instant PDF download · Letter + A4"}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold">{formatMoney(line.lineTotalCents)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {line.kind === "PRODUCT" && <QuantityStepper itemId={item.id} quantity={item.quantity} />}
                      {(line.kind === "TEMPLATE" || line.kind === "BUNDLE") && <LicenseSelect itemId={item.id} value={item.license} options={licenseOptions} />}
                      {item.template?.pricingMode === "PWYW" && !view.ownedTemplateIds.has(item.template.id) && (
                        <PwywEditor itemId={item.id} cents={item.customPriceCents ?? item.template.suggestedPriceCents ?? item.template.priceCents} minCents={item.template.priceCents} />
                      )}
                      <span className="ml-auto">
                        <RemoveButton itemId={item.id} name={line.name} />
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {(upsellProducts.length > 0 || kitsForTemplates.length > 0 || almostBundles.length > 0) && (
            <section aria-label="Recommended add-ons" className="space-y-3">
              <h2 className="font-stencil text-lg">Recommended reinforcements</h2>
              {upsellProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border-2 border-ink/30 bg-paper p-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded">
                    <Image src={publicUrl((p.imageKeys as string[])[0])} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <p className="flex-1 text-sm">
                    <Sparkles className="mr-1 inline size-4 text-olive" aria-hidden="true" />
                    Add the matching <b>{p.name}</b> for {formatMoney(p.priceCents)}
                  </p>
                  {p.variants[0] && <UpsellButton variantId={p.variants[0].id} label="Add" />}
                </div>
              ))}
              {kitsForTemplates.map((k) => (
                <div key={k.id} className="flex items-center gap-3 rounded-lg border-2 border-ink/30 bg-paper p-3">
                  <Package className="size-8 shrink-0 text-kraft-dark" aria-hidden="true" />
                  <p className="flex-1 text-sm">
                    Skip the cutting: <b>{k.name}</b> ({formatMoney(k.priceCents)})
                  </p>
                  {k.variants[0] && <UpsellButton variantId={k.variants[0].id} label="Add kit" />}
                </div>
              ))}
              {almostBundles.map(({ b, have }) => (
                <Link key={b.id} href={`/fleet/bundles/${b.slug}`} className="group flex items-center gap-3 rounded-lg border-2 border-stamp/50 bg-[#e7d27c]/20 p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stamp font-stencil text-xs text-paper">-{b.discountPercent}%</span>
                  <p className="flex-1 text-sm">
                    You have {have} of {b.items.length} in the <b>{b.name}</b>. Complete it and save {b.discountPercent}% automatically.
                  </p>
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-xl border-2 border-ink bg-dossier p-5 shadow-stamp">
            {bump?.variants[0] && <OrderBump checked={bumpInCart} headline={siteConfig.commerce.orderBump.headline} blurb={siteConfig.commerce.orderBump.blurb} priceCents={bump.variants[0].priceCents ?? bump.priceCents} />}
            {pricing.needsShipping && <ShippingSelect rates={view.shippingRates} selected={view.selectedShippingRateId} />}
            <CouponForm applied={pricing.couponDiscountCents > 0 || !view.couponError ? cart.couponCode : null} />
            {view.couponError && cart.couponCode && <p className="text-xs font-semibold text-stamp">{view.couponError}</p>}
            <GiftCardForm applied={view.giftCardError ? null : cart.giftCardCode} />
            {view.storeCreditCents > 0 && (
              <p className="flex items-center gap-1.5 text-sm text-olive-dark">
                <Gift className="size-4" /> {formatMoney(view.storeCreditCents)} store credit applied automatically
              </p>
            )}
            <dl className="space-y-1.5 border-t-2 border-dashed border-ink/25 pt-3 text-sm">
              {summary.map(([k, v, label]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className={v < 0 ? "text-olive-dark" : ""}>{label ?? (v < 0 ? `−${formatMoney(-v)}` : formatMoney(v))}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-ink/20 pt-2 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(pricing.totalCents)}</dd>
              </div>
            </dl>
            <CheckoutForm signedInEmail={user?.email ?? null} defaultEmail={cart.email} totalCents={pricing.totalCents} isMock={isStripeMock()} />
          </div>
          {!user && (
            <p className="text-center text-sm text-muted-foreground">
              Have an account? <Link href="/sign-in?callbackUrl=/cart" className="font-semibold underline">Sign in</Link> to use store credit and member discounts.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
