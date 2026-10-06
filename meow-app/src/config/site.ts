/**
 * ───────────────────────────────────────────────────────────────────────────
 *  BRAND CONFIG: the one file to edit when the real details arrive.
 *
 *  Everything marked "PLACEHOLDER" is fun filler. Swap in the real creator
 *  name, TikTok handle, cat names, links, and stats. Colors here feed the
 *  CSS theme tokens in src/app/globals.css (keep them in sync if you change them).
 *
 *  Cat profiles shown on /crew come from the database (seeded from `cats`
 *  below). After editing cats here, run `npm run db:seed` again or edit them in /admin/cats.
 * ───────────────────────────────────────────────────────────────────────────
 */

export const siteConfig = {
  /** PLACEHOLDER: site / brand name */
  name: "Meowfia Motor Pool",
  shortName: "Meowfia",
  /** Shown under the logo and in metadata */
  tagline: "Cardboard war machines for very serious cats.",
  description:
    "Printable cardboard tank, plane, and warship templates for cats, plus pre-cut kits, merch, build guides, and a community of feline recruits.",

  /** Public base URL in production. Overridden by NEXT_PUBLIC_SITE_URL. */
  url: "https://example.com",

  creator: {
    /** PLACEHOLDER */
    name: "Sgt. Jamie Placeholder",
    firstName: "Jamie",
    title: "Chief Cardboard Engineer",
    bio: "Jamie started taping boxes together for a bored cat in a tiny apartment and accidentally built an armored division. Now 150k+ followers watch every new vehicle roll off the kitchen-floor assembly line. Every template is cat-tested (and cat-approved, eventually, after the mandatory 20-minute ignore period).",
    location: "Somewhere with a lot of Amazon boxes",
    email: "hello@example.com",
    /** Where sponsorship inquiry notifications go (falls back to email) */
    partnershipsEmail: "partnerships@example.com",
    imageKey: "seed/crew/creator.png",
  },

  social: {
    /** PLACEHOLDER: no @ */
    tiktokHandle: "meowfia.motorpool",
    tiktok: "https://www.tiktok.com/@meowfia.motorpool",
    instagram: "https://www.instagram.com/meowfia.motorpool",
    youtube: "https://www.youtube.com/@meowfia.motorpool",
    pinterest: "",
    /** Support links shown on /support. Leave "" to hide. */
    kofi: "https://ko-fi.com/meowfia",
    patreon: "https://www.patreon.com/meowfia",
  },

  /** Social proof numbers. Update by hand or wire to an API later. */
  stats: {
    tiktokFollowers: 152_400,
    tiktokLikes: 4_800_000,
    totalViews: 61_000_000,
    avgViewsPerVideo: 310_000,
    engagementRate: 9.4, // %
    instagramFollowers: 18_200,
    youtubeSubscribers: 6_900,
    emailSubscribers: 4_100,
  },

  /** Media kit (/work-with-us). PLACEHOLDER numbers. */
  mediaKit: {
    audience: {
      gender: [
        { label: "Women", value: 68 },
        { label: "Men", value: 29 },
        { label: "Other", value: 3 },
      ],
      age: [
        { label: "13–17", value: 6 },
        { label: "18–24", value: 31 },
        { label: "25–34", value: 38 },
        { label: "35–44", value: 16 },
        { label: "45+", value: 9 },
      ],
      topCountries: [
        { label: "United States", value: 54 },
        { label: "United Kingdom", value: 11 },
        { label: "Canada", value: 8 },
        { label: "Australia", value: 6 },
        { label: "Germany", value: 4 },
      ],
    },
    pastPartners: ["Chewy-ish Pet Co.", "BoxCo Shipping", "GlueStick Labs", "Purrfect Litter", "Kraft & Co."],
    packages: [
      { name: "Dedicated Video", price: "From $X,XXX", description: "A full build video featuring your product as mission equipment." },
      { name: "Integrated Mention", price: "From $X,XXX", description: "Your product appears naturally in a regular build." },
      { name: "Custom Vehicle", price: "Let's talk", description: "A branded cardboard vehicle designed around your product, plus template rights." },
    ],
  },

  /**
   * Cats. Seeded into the DB. `slug` is used in URLs. PLACEHOLDER names.
   * imageKey points at generated placeholder art in storage.
   */
  cats: [
    {
      slug: "general-biscuit",
      name: "Biscuit",
      rank: "General",
      callsign: "Big Cheese",
      personality: "Supreme commander of the couch. Inspects every build, approves roughly 40% of them, naps in the rest.",
      favoriteVehicle: "M1 Abrams 'Box Tiger'",
      bio: "Biscuit is a 14 lb orange tabby who has never once walked when he could be driven. He's the face of the Armored Division and the reason every tank template has reinforced floor panels.",
    },
    {
      slug: "captain-pickles",
      name: "Pickles",
      rank: "Captain",
      callsign: "Top Gun",
      personality: "Fearless, fast, and mildly unhinged. Will leap into any cockpit before the glue dries.",
      favoriteVehicle: "P-51 'Mewstang'",
      bio: "Pickles is a tuxedo cat and our lead test pilot. Every plane template is tested on her, which is why they all have extra-wide cockpits for dramatic entries.",
    },
    {
      slug: "lieutenant-noodle",
      name: "Noodle",
      rank: "Lieutenant",
      callsign: "Admiral Snooze",
      personality: "Calm under fire. Calm under everything. Mostly asleep.",
      favoriteVehicle: "USS Purrsylvania",
      bio: "Noodle is a long-haired gray floof who commands the Navy from a horizontal position. If a battleship can hold a sleeping Noodle, it can hold any cat.",
    },
    {
      slug: "private-beans",
      name: "Beans",
      rank: "Private",
      callsign: "The Recruit",
      personality: "Newest member of the unit. Chews on the blueprints. Learning fast.",
      favoriteVehicle: "Kitten Jeep",
      bio: "Beans is a small black kitten who joined the motor pool this year. All Kitten-size templates are sized to Beans, with room to grow.",
    },
  ],

  /** Theme colors (hex), used for OG images and emails. CSS tokens live in globals.css. */
  colors: {
    olive: "#4b5320",
    oliveDark: "#2f3514",
    khaki: "#c3b091",
    sand: "#efe6d2",
    kraft: "#b88a57",
    kraftDark: "#8a6239",
    stamp: "#b3261e",
    ink: "#1f2113",
  },

  /** Membership ("The Barracks") tiers. Prices in cents. Stripe price IDs come from env. */
  membership: {
    name: "The Barracks",
    tiers: [
      {
        id: "RECRUIT" as const,
        name: "Recruit",
        monthlyCents: 500,
        annualCents: 5000,
        shopDiscountPercent: 5,
        voteWeight: 1,
        perks: ["Members badge on your profile", "Vote on the next build", "5% off the shop", "Members-only Discord channel (link in welcome email)"],
      },
      {
        id: "OFFICER" as const,
        name: "Officer",
        monthlyCents: 1000,
        annualCents: 10000,
        shopDiscountPercent: 10,
        voteWeight: 2,
        highlight: true,
        perks: ["Everything in Recruit", "One exclusive members-only template every month", "48-hour early access to every new template", "Premium build guides unlocked", "10% off the shop", "Double voting power"],
      },
      {
        id: "COMMANDER" as const,
        name: "Commander",
        monthlyCents: 2500,
        annualCents: 25000,
        shopDiscountPercent: 15,
        voteWeight: 3,
        perks: ["Everything in Officer", "ALL paid templates included while subscribed", "15% off kits and merch", "Name in the credits of new templates", "Triple voting power"],
      },
    ],
  },

  /** Commerce knobs */
  commerce: {
    currency: "usd",
    /** Bundle discount applies automatically when every template in a bundle is in the cart */
    tipPresetsCents: [300, 500, 1000, 2500],
    giftCardPresetsCents: [1000, 2500, 5000, 10000],
    commissionDepositCents: 5000,
    /** Referral program */
    referral: {
      /** Store credit the referrer earns: percent of the referred order's total */
      rewardPercent: 10,
      /** Discount the new customer gets, shown on the landing banner (applied as a coupon code) */
      newCustomerCouponCode: "RECRUIT10",
      cookieDays: 30,
    },
    /** The order bump offered on the cart page */
    orderBump: {
      productSlug: "classified-sticker-pack",
      headline: "Add the Classified Sticker Pack?",
      blurb: "6 waterproof stickers for laptops, water bottles, and suspiciously official cardboard.",
    },
  },

  /** Ranks for community members, by number of approved gallery builds */
  ranks: [
    { name: "Private", min: 0 },
    { name: "Corporal", min: 1 },
    { name: "Sergeant", min: 3 },
    { name: "Lieutenant", min: 6 },
    { name: "Captain", min: 10 },
    { name: "General", min: 20 },
  ],

  nav: [
    { href: "/fleet", label: "The Fleet" },
    { href: "/shop", label: "Shop" },
    { href: "/recruits", label: "Recruits" },
    { href: "/guides", label: "Field Manual" },
    { href: "/barracks", label: "The Barracks" },
    { href: "/videos", label: "Videos" },
  ],
  footerNav: [
    {
      title: "Mission",
      links: [
        { href: "/crew", label: "Meet the Crew" },
        { href: "/support", label: "Support the Mission" },
        { href: "/supply-depot", label: "Supply Depot" },
        { href: "/drops", label: "Upcoming Drops" },
      ],
    },
    {
      title: "Shop",
      links: [
        { href: "/fleet", label: "Templates" },
        { href: "/shop?type=kits", label: "Pre-cut Kits" },
        { href: "/shop?type=merch", label: "Merch" },
        { href: "/shop/commissions", label: "Custom Commissions" },
        { href: "/shop/gift-cards", label: "Gift Cards" },
      ],
    },
    {
      title: "Partners",
      links: [
        { href: "/classroom", label: "Classroom & Bulk" },
        { href: "/work-with-us", label: "Work With Us" },
        { href: "/account/referrals", label: "Referral Program" },
        { href: "/cat-safety", label: "Cat Safety" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/legal/terms", label: "Terms" },
        { href: "/legal/privacy", label: "Privacy" },
        { href: "/legal/refunds", label: "Refunds" },
        { href: "/legal/license", label: "Template License" },
        { href: "/legal/shipping", label: "Shipping" },
      ],
    },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export type MembershipTierId = (typeof siteConfig.membership.tiers)[number]["id"];
