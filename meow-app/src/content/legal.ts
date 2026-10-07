import { siteConfig } from "@/config/site";

/**
 * ⚠️ PLACEHOLDER LEGAL TEXT. Have a qualified professional review and replace
 * every document before launch. These are starting points, not legal advice.
 */
export type LegalDoc = { title: string; updated: string; sections: { heading: string; body: string[] }[] };

const name = siteConfig.name;
const email = siteConfig.creator.email;

export const LEGAL: Record<string, LegalDoc> = {
  terms: {
    title: "Terms of Service",
    updated: "PLACEHOLDER DATE",
    sections: [
      { heading: "Agreement", body: [`By using ${name} (the "Site"), you agree to these Terms. If you don't agree, please don't use the Site.`] },
      { heading: "Accounts", body: ["You're responsible for activity on your account and for keeping access to your email secure, since we sign you in with email links.", "We may suspend accounts that violate these Terms or community guidelines."] },
      { heading: "Purchases", body: ["Prices are in USD. Digital templates are delivered instantly after payment. Physical goods ship per our Shipping Policy.", "Pay-what-you-want amounts are final once paid. Thank you for your generosity."] },
      { heading: "Community content", body: ["When you post photos to the Recruits gallery, you confirm you own them and grant us a non-exclusive, royalty-free license to display them on the Site and in our social channels with credit.", "We moderate submissions and may decline or remove content at our discretion. Please only post cats in safe builds."] },
      { heading: "Memberships", body: ["Memberships renew automatically until canceled. You can cancel anytime from your account. Access continues to the end of the paid period.", "Templates included with membership remain available while your membership is active."] },
      { heading: "Safety", body: ["Cardboard builds require sharp tools. Use them carefully and supervise children and pets. Follow the Cat Safety briefing. You assume responsibility for how you build and use any template."] },
      { heading: "Limitation of liability", body: ["PLACEHOLDER: standard limitation of liability and disclaimer of warranties language to be provided by counsel."] },
      { heading: "Contact", body: [`Questions? Email ${email}.`] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "PLACEHOLDER DATE",
    sections: [
      { heading: "What we collect", body: ["Account info (email, name, optional handle), order and shipping details, photos you upload, and basic usage analytics.", "Payments are processed by Stripe. We never see or store full card numbers."] },
      { heading: "How we use it", body: ["To deliver purchases, provide downloads, run memberships, send the emails you've opted into, prevent fraud and abuse, and improve the Site."] },
      { heading: "Email", body: ["Marketing emails are opt-in and every one includes an unsubscribe link. Transactional emails (receipts, sign-in links) are always sent."] },
      { heading: "Service providers", body: ["We share the minimum necessary data with: Stripe (payments), Resend (email), Printful (merch fulfillment), our hosting and storage providers, and analytics providers if enabled. PLACEHOLDER: list final vendors."] },
      { heading: "Cookies & pixels", body: ["We use essential cookies for sign-in, cart, and referral attribution. If enabled, analytics and advertising pixels (e.g. TikTok, Meta) may set cookies. PLACEHOLDER: add consent mechanism details as required for your audience's regions (GDPR/UK/CCPA)."] },
      { heading: "Your rights", body: [`You can request access to, correction of, or deletion of your data by emailing ${email}.`] },
      { heading: "Children", body: ["The Site is not directed to children under 13, and we don't knowingly collect their personal information."] },
    ],
  },
  refunds: {
    title: "Refund Policy",
    updated: "PLACEHOLDER DATE",
    sections: [
      { heading: "Digital templates", body: ["Because downloads are delivered instantly, digital sales are generally final. If a file is broken or you can't print it, contact us and we'll fix it or refund you."] },
      { heading: "Pre-cut kits & merch", body: ["Unused items in original condition can be returned within 30 days of delivery. Items damaged in transit will be replaced free: just send a photo within 7 days.", "Print-on-demand merch can't be returned for sizing, but misprints and defects are always replaced."] },
      { heading: "Memberships", body: ["Cancel anytime; you keep access through the end of the billing period. We don't prorate partial months. PLACEHOLDER: confirm annual plan refund terms."] },
      { heading: "Commissions", body: ["Deposits are credited toward your final price. If we can't accept your commission, the deposit is refunded in full. Once work begins, deposits are non-refundable."] },
      { heading: "Gift cards", body: ["Gift cards are non-refundable and don't expire."] },
    ],
  },
  license: {
    title: "Template License",
    updated: "PLACEHOLDER DATE",
    sections: [
      { heading: "Personal license (included)", body: ["Print and build any number of copies for yourself, your household, and gifts.", "Share photos and videos of your builds anywhere. Tagging us is appreciated!", "Do not resell, share, or redistribute the PDF files, or sell finished builds."] },
      { heading: "Commercial license (upgrade)", body: ["Everything in Personal, plus: sell finished, built vehicles (handmade, not the files), use builds in monetized content, and use builds as props for your business.", "Still not permitted: reselling or redistributing the template files themselves."] },
      { heading: "Classroom license (upgrade)", body: ["Everything in Personal, plus: print unlimited copies for students and participants within one school, library, makerspace, or organization.", "Templates may be shared on a password-protected class portal but not publicly."] },
      { heading: "Upgrading", body: ["Already own a template? Upgrade from its page or your Downloads library: you only pay the difference."] },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    updated: "PLACEHOLDER DATE",
    sections: [
      { heading: "Processing", body: ["Pre-cut kits ship within 2–4 business days. Print-on-demand merch is produced by our fulfillment partner in 2–7 business days before shipping."] },
      { heading: "Rates", body: ["Standard US shipping is free over $75. Expedited and international options are shown in your cart. PLACEHOLDER: confirm rates and carriers."] },
      { heading: "International", body: ["We ship to most countries. Customs duties and taxes are the recipient's responsibility unless stated otherwise."] },
      { heading: "Tracking", body: ["You'll receive a tracking email when your order ships. You can also see it in your account under Orders."] },
      { heading: "Lost or damaged packages", body: [`Contact ${email} within 14 days of the expected delivery date and we'll make it right.`] },
    ],
  },
};
