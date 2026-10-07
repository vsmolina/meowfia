/**
 * Seeds a realistic, fully-populated local database.
 *   npm run db:seed      (or `npm run db:reset` to wipe and reseed)
 * Safe to re-run: it clears seeded tables first.
 */
import "dotenv/config";
import { createDbAdapter } from "../src/lib/db-adapter";
import { PrismaClient, type Channel, type Prisma } from "../src/generated/prisma/client";
import { siteConfig } from "../src/config/site";
import * as A from "./seed-assets";

const db = new PrismaClient({ adapter: createDbAdapter() });

// Deterministic randomness so every seed looks the same
let s = 42;
const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const daysAgo = (d: number, h = int(0, 23)) => new Date(Date.now() - d * 86_400_000 - h * 3_600_000);
const VID = (n: number) => `https://www.tiktok.com/@${siteConfig.social.tiktokHandle}/video/73${String(9000000000000000 + n * 7919).padStart(17, "0")}`;

type TSeed = {
  slug: string;
  name: string;
  codename: string;
  tagline: string;
  vehicleType: "TANK" | "PLANE" | "BOAT" | "OTHER";
  difficulty: "RECRUIT" | "SOLDIER" | "VETERAN" | "ELITE";
  catSize: "KITTEN" | "STANDARD" | "CHONK";
  minutes: number;
  pricing: "FREE" | "FIXED" | "PWYW";
  price: number;
  suggested?: number;
  featured?: boolean;
  leadMagnet?: boolean;
  membersOnly?: boolean;
  releaseInDays?: number;
  earlyAccessHours?: number;
  materials: string[];
  description: string;
};

const BASE_MATERIALS = ["Printed template (all sheets)", "Craft knife + cutting mat", "Metal ruler", "Low-temp glue gun or water-activated kraft tape"];

const TEMPLATES: TSeed[] = [
  {
    slug: "kitten-jeep", name: "Kitten Jeep", codename: "OPERATION FIRST WHEELS", tagline: "The free starter build every recruit begins with.",
    vehicleType: "OTHER", difficulty: "RECRUIT", catSize: "KITTEN", minutes: 45, pricing: "FREE", price: 0, leadMagnet: true,
    materials: [...BASE_MATERIALS, "1 medium shipping box (approx. 16×12×12 in)", "Bottle caps for headlights (optional)"],
    description: "A small, open-top scout jeep that comes together in under an hour. It's the perfect first mission: four panels, two wheels per side, and a windshield your cat will immediately ignore. Sized for kittens and petite adults.",
  },
  {
    slug: "box-tiger", name: "Box Tiger MBT", codename: "OPERATION HEAVY LOAF", tagline: "Our flagship main battle tank, built for loafing under armor.",
    vehicleType: "TANK", difficulty: "SOLDIER", catSize: "STANDARD", minutes: 120, pricing: "FIXED", price: 800, featured: true,
    materials: [...BASE_MATERIALS, "2 large boxes (approx. 24×18×18 in)", "Paper towel tube (barrel)", "Bottle caps ×12 (road wheels)"],
    description: "The vehicle that started it all, as seen in the 4.2M-view video. A rotating turret with a cat-sized hatch, tracked hull with reinforced double-wall floor, and a barrel that points at whoever forgot dinner. Every panel is labeled and keyed so it goes together like a kit.",
  },
  {
    slug: "purrsche-panther", name: "Purrsche Panther", codename: "OPERATION CHONK ARMOR", tagline: "Heavy tank engineered for the larger cat.",
    vehicleType: "TANK", difficulty: "VETERAN", catSize: "CHONK", minutes: 180, pricing: "PWYW", price: 500, suggested: 1000,
    materials: [...BASE_MATERIALS, "2 extra-large boxes (approx. 30×20×20 in)", "Double-wall cardboard sheet for floor", "Wrapping paper tube (barrel)"],
    description: "Wide stance, sloped armor, and a floor rated for a 20 lb loaf. The Panther is pay-what-you-want because every chonk deserves armor. Includes optional side skirts and a commander's cupola for the curious.",
  },
  {
    slug: "mewstang-p51", name: "P-51 Mewstang", codename: "OPERATION TOP GUN", tagline: "Classic fighter with a cockpit built for dramatic entries.",
    vehicleType: "PLANE", difficulty: "SOLDIER", catSize: "STANDARD", minutes: 150, pricing: "FIXED", price: 900, featured: true,
    materials: [...BASE_MATERIALS, "1 long box (approx. 36×12×12 in)", "Poster board for wings", "Paper plate (propeller hub)"],
    description: "Pickles' personal favorite. Detachable wings for storage, an extra-wide cockpit, and a spinning propeller (non-motorized, hand-powered only). Includes nose art stencils for the 'Mewstang' and 'Lucky Paws' liveries.",
  },
  {
    slug: "spitfur", name: "Spitfur Mk. IX", codename: "OPERATION BLITZ BISCUIT", tagline: "Elegant elliptical wings, maximum zoomies.",
    vehicleType: "PLANE", difficulty: "VETERAN", catSize: "STANDARD", minutes: 200, pricing: "FIXED", price: 1000,
    materials: [...BASE_MATERIALS, "1 long box (approx. 36×14×12 in)", "Poster board ×2", "Clear PET sheet for canopy (optional)"],
    description: "The Spitfur's curved wings are scored with our 'kerf fold' technique, so no bending tools are needed. A step up in difficulty with a seriously good-looking result. Includes roundel and invasion-stripe guides.",
  },
  {
    slug: "biscuit-bomber", name: "B-17 Biscuit Bomber", codename: "OPERATION FLYING FORTRESS", tagline: "Four engines, two cats, zero chill.",
    vehicleType: "PLANE", difficulty: "ELITE", catSize: "CHONK", minutes: 300, pricing: "FIXED", price: 1400,
    materials: [...BASE_MATERIALS, "3 large boxes", "Poster board ×4", "Paper plates ×4 (engine cowlings)", "Dowels for wing spar (optional)"],
    description: "Our most ambitious aircraft: a 5-foot wingspan, twin cat compartments (pilot and tail gunner), and four spinning props. It's an elite build for experienced recruits with a full weekend and a cooperative crew.",
  },
  {
    slug: "uss-purrsylvania", name: "USS Purrsylvania", codename: "OPERATION SLEEPY ADMIRAL", tagline: "A battleship built for the long nap.",
    vehicleType: "BOAT", difficulty: "VETERAN", catSize: "CHONK", minutes: 240, pricing: "FIXED", price: 1200, featured: true,
    materials: [...BASE_MATERIALS, "2 long boxes (approx. 36×16×12 in)", "Toilet paper tubes ×6 (gun barrels)", "Skewer (flag mast)"],
    description: "Noodle's flagship. A full-length battleship with a sunken 'bridge bed' for horizontal command, rotating turrets fore and aft, and a smokestack scratch post. Includes a printable flag sheet and hull number decals.",
  },
  {
    slug: "pt-whiskers", name: "PT Boat Whiskers", codename: "OPERATION SWIFT PAWS", tagline: "A quick-build patrol boat for small sailors.",
    vehicleType: "BOAT", difficulty: "RECRUIT", catSize: "KITTEN", minutes: 60, pricing: "PWYW", price: 300, suggested: 600,
    materials: [...BASE_MATERIALS, "1 medium box", "Straws for antennae"],
    description: "A fast, beginner-friendly torpedo boat. Great as a second build after the Kitten Jeep, and it's pay-what-you-want so the whole household can get a fleet going.",
  },
  {
    slug: "sub-meow-rine", name: "Sub-Meow-Rine", codename: "OPERATION SILENT PURR", tagline: "A stealth hideout with a periscope your cat can bat.",
    vehicleType: "BOAT", difficulty: "SOLDIER", catSize: "STANDARD", minutes: 120, pricing: "FIXED", price: 900,
    materials: [...BASE_MATERIALS, "1 long box", "Paper towel tube (periscope)", "String + pom-pom (periscope toy)"],
    description: "A fully enclosed hideout disguised as a submarine. A porthole window, a dangling periscope toy, and a rear hatch for discreet exits. Cats who prefer covert operations love this one.",
  },
  {
    slug: "hiss-copter", name: "AH-64 Hiss-copter", codename: "OPERATION ROTOR RAGE", tagline: "Attack helicopter with spinning rotors and a tandem cockpit.",
    vehicleType: "OTHER", difficulty: "ELITE", catSize: "STANDARD", minutes: 240, pricing: "FIXED", price: 1200,
    materials: [...BASE_MATERIALS, "2 large boxes", "Paper plate + brad (rotor hub)", "Poster board ×2 (rotor blades)"],
    description: "The rotor spins, the cat does not care, and the humans are thrilled. Tandem cockpit, stub wings with 'hellfur' pods, and a tail rotor that actually turns. A great showpiece build.",
  },
  {
    slug: "officers-staff-car", name: "Officer's Staff Car", codename: "MEMBERS ONLY · OCT", tagline: "This month's exclusive build for Barracks members.",
    vehicleType: "OTHER", difficulty: "SOLDIER", catSize: "STANDARD", minutes: 100, pricing: "FIXED", price: 1000, membersOnly: true,
    materials: [...BASE_MATERIALS, "1 large box", "Bottle caps ×4 (hubcaps)", "Ribbon (flags)"],
    description: "A vintage open-top staff car with fender flags and a back seat fit for a general. Free for Officer and Commander members, and available to everyone else as a paid template.",
  },
  {
    slug: "catillery-howitzer", name: "M109 Catillery", codename: "OPERATION BIG BOOM (UPCOMING)", tagline: "Self-propelled howitzer. Dropping soon.",
    vehicleType: "TANK", difficulty: "VETERAN", catSize: "CHONK", minutes: 210, pricing: "FIXED", price: 1100, releaseInDays: 5, earlyAccessHours: 48,
    materials: [...BASE_MATERIALS, "2 large boxes", "Wrapping paper tube (barrel)", "Bottle caps ×14"],
    description: "A boxy self-propelled gun with a huge enclosed turret, a perfect cave for chonks. Members get 48-hour early access.",
  },
];

const FIRST = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Quinn", "Dakota", "Reese", "Harper", "Rowan"];
const LAST = ["Nguyen", "Smith", "Garcia", "Okafor", "Kowalski", "Rossi", "Tanaka", "Haddad", "Silva", "Brown", "Murphy", "Patel"];
const CAT_NAMES = ["Mochi", "Tater Tot", "Sergeant Floof", "Pancake", "Ziggy", "Olive", "Meatball", "Luna", "Gizmo", "Nugget", "Pumpkin", "Waffles", "Captain Fluff", "Bean", "Toast", "Salem", "Cleo", "Biscotti", "Major Tom", "Pixel"];
const CAPTIONS = [
  "Reporting for duty. Refused to exit for 3 hours.",
  "First build ever and she hasn't left it since!",
  "Added a little flag. He salutes it (by sleeping in it).",
  "My kids and I built this in an afternoon. 10/10 mission.",
  "The floor survived the loaf. Engineering confirmed.",
  "Took longer than the instructions said but WORTH IT.",
  "Painted ours in desert camo. Commander approves.",
  "She attacked the periscope for 40 minutes straight.",
  "Two cats, one tank, zero peace.",
  "Built from three Amazon boxes and pure determination.",
];
const REVIEW_SNIPPETS = [
  ["Best cat thing I've ever made", "Clear instructions and the pieces line up perfectly. My cat moved in immediately."],
  ["Chonk approved", "Finally a template that fits my 17 lb boy. The double floor tip is a must."],
  ["Fun weekend project", "Built it with my niece. Took a bit longer than listed but we were taking it slow."],
  ["Worth every penny", "The A4 version printed perfectly here in the UK. Love the scale check square."],
  ["Great, one tricky step", "The turret ring was fiddly, but the video helped. Looks amazing."],
  ["My cat ignored it for a day…", "…and now she sleeps in it every night. Classic. 5 stars."],
];

async function clear() {
  // Order matters for FKs
  const tables = [
    "referralConversion", "referralClick", "like", "galleryPost", "pollVote", "pollOption", "poll", "membership",
    "downloadLog", "entitlement", "orderItem", "order", "revenueEvent", "cartItem", "cart", "review", "favorite", "dropNotify",
    "bundleItem", "bundle", "productVariant", "product", "guideStep", "guide", "video", "template", "cat",
    "affiliateLink", "subscriber", "broadcast", "emailLog", "inquiry", "commission", "tip", "giftCard", "coupon", "shippingRate",
    "stripeEvent", "session", "account", "user",
  ] as const;
  for (const t of tables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)[t].deleteMany();
  }
}

async function main() {
  console.log("🧹 Clearing tables…");
  await clear();

  console.log("🎨 Generating placeholder artwork + PDFs (first run takes ~20s)…");
  await A.placeholderPng();
  await A.creatorPortrait();

  // ── Cats
  const cats: { id: string }[] = [];
  for (const [i, c] of siteConfig.cats.entries()) {
    const imageKey = await A.catPortrait(c.slug, c.name, c.rank, i);
    cats.push(await db.cat.create({ data: { ...c, imageKey, sortOrder: i } }));
  }

  // ── Templates
  const templates: Awaited<ReturnType<typeof db.template.create>>[] = [];
  for (const [i, t] of TEMPLATES.entries()) {
    const imgs = await A.templateImages(t.slug, t.name, t.vehicleType, i);
    const pdfs = await A.templatePdfs(t.slug, t.name, t.materials, t.minutes);
    templates.push(
      await db.template.create({
        data: {
          slug: t.slug,
          name: t.name,
          codename: t.codename,
          tagline: t.tagline,
          description: t.description,
          vehicleType: t.vehicleType,
          difficulty: t.difficulty,
          catSize: t.catSize,
          buildTimeMinutes: t.minutes,
          materials: t.materials,
          pricingMode: t.pricing,
          priceCents: t.price,
          suggestedPriceCents: t.suggested ?? null,
          coverImageKey: imgs.cover,
          imageKeys: imgs.images,
          pdfLetterKey: pdfs.letter,
          pdfA4Key: pdfs.a4,
          tiktokUrl: VID(i + 1),
          featured: Boolean(t.featured),
          isLeadMagnet: Boolean(t.leadMagnet),
          membersOnly: Boolean(t.membersOnly),
          earlyAccessHours: t.earlyAccessHours ?? 0,
          releaseAt: t.releaseInDays ? new Date(Date.now() + t.releaseInDays * 86_400_000) : daysAgo(200 - i * 15),
          // Already-released templates count as announced so the drops cron doesn't email about them
          dropAnnouncedAt: t.releaseInDays ? null : daysAgo(200 - i * 15),
          earlyAccessNotifiedAt: t.releaseInDays ? null : daysAgo(200 - i * 15),
          createdAt: daysAgo(200 - i * 15),
        },
      }),
    );
  }
  const T = Object.fromEntries(templates.map((t) => [t.slug, t]));
  const publicPaid = templates.filter((t) => t.pricingMode !== "FREE" && !t.membersOnly && t.releaseAt! < new Date());

  // ── Bundles
  const bundles = [
    { slug: "armored-division", name: "Armored Division", discountPercent: 20, items: ["box-tiger", "purrsche-panther"], description: "Both tanks: the Box Tiger and the chonk-rated Purrsche Panther. Roll out together." },
    { slug: "air-force", name: "Air Force", discountPercent: 25, items: ["mewstang-p51", "spitfur", "biscuit-bomber", "hiss-copter"], description: "Every aircraft in the hangar: two fighters, a bomber, and an attack helicopter." },
    { slug: "navy", name: "Navy", discountPercent: 25, items: ["uss-purrsylvania", "pt-whiskers", "sub-meow-rine"], description: "Battleship, patrol boat, and submarine. Rule the living-room seas." },
    { slug: "complete-arsenal", name: "Complete Arsenal", discountPercent: 35, items: publicPaid.map((t) => t.slug), description: "Every public paid template in the Fleet, at our biggest discount. Future-you will thank you." },
  ];
  for (const [i, b] of bundles.entries()) {
    const cover = await A.genericCover(`seed/bundles/${b.slug}.png`, b.name, (["TANK", "PLANE", "BOAT", "OTHER"] as const)[i], i);
    await db.bundle.create({
      data: { slug: b.slug, name: b.name, description: b.description, discountPercent: b.discountPercent, coverImageKey: cover, items: { create: b.items.map((slug) => ({ templateId: T[slug].id })) } },
    });
  }

  // ── Shipping
  await db.shippingRate.createMany({
    data: [
      { name: "Standard (USPS Ground)", priceCents: 595, minDays: 3, maxDays: 6, freeOverCents: 7500, sortOrder: 0 },
      { name: "Expedited (2–3 day)", priceCents: 1295, minDays: 2, maxDays: 3, sortOrder: 1 },
      { name: "International", priceCents: 1995, minDays: 7, maxDays: 21, sortOrder: 2 },
    ],
  });

  // ── Products
  const P: Record<string, Awaited<ReturnType<typeof db.product.create>>> = {};
  const mkProduct = async (
    slug: string,
    data: Omit<Prisma.ProductCreateInput, "slug" | "imageKeys" | "variants"> & { kind: Parameters<typeof A.productImage>[2]; vt?: A.Vehicle },
    variants: { name: string; sku: string; priceCents?: number; inventory?: number | null; printfulVariantId?: string }[],
  ) => {
    const { kind, vt, ...rest } = data;
    const img = await A.productImage(slug, String(rest.name), kind, Object.keys(P).length, vt);
    P[slug] = await db.product.create({ data: { ...rest, slug, imageKeys: [img], variants: { create: variants } } });
  };
  await mkProduct("classified-sticker-pack", { name: "Classified Sticker Pack", description: "Six waterproof vinyl stickers: tank, plane, warship, jeep, 'CLASSIFIED' stamp, and the Motor Pool crest. Dishwasher-safe, cat-proof (mostly).", type: "MERCH", category: "Stickers", priceCents: 600, kind: "sticker" }, [{ name: "6-pack", sku: "STK-CLASS-6", inventory: 240 }]);
  await mkProduct("mewstang-sticker", { name: "Mewstang Nose-Art Sticker", description: "A single 3\" die-cut sticker of Pickles' Mewstang nose art.", type: "MERCH", category: "Stickers", priceCents: 300, kind: "sticker", vt: "PLANE" }, [{ name: "3 inch", sku: "STK-MEW-3", inventory: 400 }]);
  await mkProduct("box-tiger-kit", { name: "Box Tiger Pre-Cut Kit", description: "Every panel of the Box Tiger, die-cut from double-wall corrugated board, plus kraft tape and a printed field manual. Just fold, tape, and deploy. No knife required.", type: "KIT", category: "Kits", priceCents: 3900, compareAtCents: 4500, featured: true, template: { connect: { id: T["box-tiger"].id } }, upsellProductId: null, kind: "kit", vt: "TANK" }, [
    { name: "Standard", sku: "KIT-TIGER-STD", inventory: 34 },
    { name: "Chonk XL (+20%)", sku: "KIT-TIGER-XL", priceCents: 4900, inventory: 12 },
  ]);
  await mkProduct("mewstang-kit", { name: "P-51 Mewstang Pre-Cut Kit", description: "Die-cut Mewstang with pre-scored wings, a printed nose-art sheet, and a spinning prop hub.", type: "KIT", category: "Kits", priceCents: 4400, featured: true, template: { connect: { id: T["mewstang-p51"].id } }, kind: "kit", vt: "PLANE" }, [{ name: "Standard", sku: "KIT-MEW-STD", inventory: 21 }]);
  await mkProduct("purrsylvania-kit", { name: "USS Purrsylvania Pre-Cut Kit", description: "The full battleship, die-cut, with turret rings and a pre-assembled smokestack scratch post.", type: "KIT", category: "Kits", priceCents: 4900, template: { connect: { id: T["uss-purrsylvania"].id } }, kind: "kit", vt: "BOAT" }, [{ name: "Standard", sku: "KIT-PURR-STD", inventory: 3 }]);
  await mkProduct("kitten-jeep-kit", { name: "Kitten Jeep Pre-Cut Kit", description: "Our easiest kit, great for kids and first-timers. Done in 20 minutes.", type: "KIT", category: "Kits", priceCents: 2400, template: { connect: { id: T["kitten-jeep"].id } }, kind: "kit", vt: "OTHER" }, [{ name: "Standard", sku: "KIT-JEEP-STD", inventory: 0 }]);
  await mkProduct("motor-pool-tee", { name: "Motor Pool Crew Tee", description: "Soft ringspun cotton tee with the Motor Pool tank crest. Printed on demand.", type: "MERCH", category: "Apparel", priceCents: 2700, featured: true, printfulProductId: "mock-tee", kind: "shirt" },
    ["S", "M", "L", "XL", "2XL"].map((sz, i) => ({ name: `${sz} / Olive`, sku: `PF-TEE-OLV-${sz}`, priceCents: i >= 4 ? 2900 : undefined, inventory: null, printfulVariantId: `mock-tee-${sz}` })));
  await mkProduct("armored-division-hoodie", { name: "Armored Division Hoodie", description: "Heavyweight khaki hoodie with the Box Tiger on the back.", type: "MERCH", category: "Apparel", priceCents: 4800, printfulProductId: "mock-hoodie", kind: "hoodie" },
    ["S", "M", "L", "XL"].map((sz) => ({ name: `${sz} / Khaki`, sku: `PF-HOOD-KHK-${sz}`, inventory: null, printfulVariantId: `mock-hoodie-${sz}` })));
  await mkProduct("rank-patch-set", { name: "Rank Patch Set", description: "Six embroidered iron-on patches, one for every rank from Private to General.", type: "MERCH", category: "Patches", priceCents: 1200, kind: "patch" }, [{ name: "Set of 6", sku: "PATCH-RANK-6", inventory: 80 }]);
  await mkProduct("cat-collar-tag", { name: "Dog Tag… for Cats", description: "Stamped aluminum collar tag with your cat's rank and name. Lightweight and breakaway-collar friendly.", type: "MERCH", category: "Cat Gear", priceCents: 1400, kind: "tag" },
    ["Private", "Sergeant", "Captain", "General"].map((r) => ({ name: r, sku: `TAG-${r.toUpperCase()}`, inventory: 50 })));
  await mkProduct("i-want-you-poster", { name: "'I Want YOU' Recruitment Poster", description: "Museum-quality matte poster. Biscuit wants you to build more boxes.", type: "MERCH", category: "Posters", priceCents: 1800, printfulProductId: "mock-poster", kind: "poster" }, [
    { name: '12×18"', sku: "PF-POSTER-1218", inventory: null, printfulVariantId: "mock-poster-1218" },
    { name: '18×24"', sku: "PF-POSTER-1824", priceCents: 2400, inventory: null, printfulVariantId: "mock-poster-1824" },
  ]);
  // Upsell links ("add the matching sticker")
  await db.product.update({ where: { id: P["mewstang-kit"].id }, data: { upsellProductId: P["mewstang-sticker"].id } });
  await db.product.update({ where: { id: P["box-tiger-kit"].id }, data: { upsellProductId: P["classified-sticker-pack"].id } });
  await db.product.update({ where: { id: P["motor-pool-tee"].id }, data: { upsellProductId: P["classified-sticker-pack"].id } });
  await A.productImage("gift-card", "Gift Card", "giftcard", 99);

  // ── Users
  const adminEmail = (process.env.ADMIN_EMAILS ?? "admin@example.com").split(",")[0].trim().toLowerCase();
  const admin = await db.user.create({ data: { email: adminEmail, name: siteConfig.creator.firstName, role: "ADMIN", handle: "hq", emailVerified: new Date() } });
  const users: Awaited<ReturnType<typeof db.user.create>>[] = [];
  for (let i = 0; i < 14; i++) {
    const first = FIRST[i];
    const last = pick(LAST);
    users.push(
      await db.user.create({
        data: {
          email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
          name: `${first} ${last[0]}.`,
          handle: `${first.toLowerCase()}${int(10, 99)}`,
          emailVerified: new Date(),
          createdAt: daysAgo(int(10, 180)),
          referredById: i > 9 ? undefined : undefined,
        },
      }),
    );
  }
  // Well-known demo accounts (documented in the README)
  await db.user.update({ where: { id: users[2].id }, data: { email: "commander@example.com", name: "Jordan T." } });
  await db.user.update({ where: { id: users[13].id }, data: { email: "recruit@example.com", name: "Rowan P." } });
  users[2] = await db.user.findUniqueOrThrow({ where: { id: users[2].id } });
  users[13] = await db.user.findUniqueOrThrow({ where: { id: users[13].id } });

  // A couple of referred users
  await db.user.update({ where: { id: users[11].id }, data: { referredById: users[0].id } });
  await db.user.update({ where: { id: users[12].id }, data: { referredById: users[0].id } });
  await db.user.update({ where: { id: users[13].id }, data: { referredById: users[2].id } });

  // ── Memberships
  const tiers = ["RECRUIT", "OFFICER", "COMMANDER"] as const;
  for (let i = 0; i < 7; i++) {
    const tier = tiers[i % 3];
    const interval = i % 4 === 0 ? "YEAR" : "MONTH";
    await db.membership.create({
      data: { userId: users[i].id, tier, interval, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + int(3, 28) * 86_400_000), createdAt: daysAgo(int(30, 120)) },
    });
  }

  // ── Reviews
  for (const t of templates.slice(0, 10)) {
    const n = int(2, 5);
    for (let k = 0; k < n; k++) {
      const [title, body] = pick(REVIEW_SNIPPETS);
      const u = pick(users);
      await db.review.create({ data: { userId: u.id, authorName: u.name ?? "Recruit", rating: pick([5, 5, 5, 4, 4, 3]), title, body, templateId: t.id, createdAt: daysAgo(int(1, 90)) } });
    }
  }
  for (const p of Object.values(P).slice(0, 8)) {
    for (let k = 0; k < int(1, 3); k++) {
      const u = pick(users);
      await db.review.create({ data: { userId: u.id, authorName: u.name ?? "Recruit", rating: pick([5, 5, 4]), title: pick(["Great quality", "Love it", "Exactly as pictured", "Fast shipping"]), body: pick(["Sturdy, well made, and my cat approves.", "Bought as a gift. Huge hit.", "Fits perfectly, colors are great."]), productId: p.id, createdAt: daysAgo(int(1, 60)) } });
    }
  }

  // ── Gallery
  const galleryTemplates = templates.filter((t) => !t.membersOnly && t.releaseAt! < new Date());
  const posts: Awaited<ReturnType<typeof db.galleryPost.create>>[] = [];
  for (let i = 0; i < 22; i++) {
    const u = users[i % users.length];
    const t = galleryTemplates[i % galleryTemplates.length];
    const catName = CAT_NAMES[i % CAT_NAMES.length];
    const img = await A.galleryImage(`post-${i}`, t.vehicleType, i, catName);
    const status = i >= 19 ? "PENDING" : "APPROVED";
    posts.push(
      await db.galleryPost.create({
        data: {
          userId: u.id,
          templateId: t.id,
          catName,
          caption: CAPTIONS[i % CAPTIONS.length],
          imageKey: img.key,
          width: img.width,
          height: img.height,
          status,
          moderatedAt: status === "APPROVED" ? daysAgo(30 - i) : null,
          featuredAt: i === 4 ? daysAgo(2) : i === 9 ? daysAgo(9) : null,
          createdAt: daysAgo(Math.max(0, 40 - i * 2)),
        },
      }),
    );
  }
  // Likes
  for (const p of posts.filter((p) => p.status === "APPROVED")) {
    const likers = users.filter(() => rand() < 0.45);
    for (const u of likers) await db.like.create({ data: { postId: p.id, userId: u.id } });
    await db.galleryPost.update({ where: { id: p.id }, data: { likesCount: likers.length } });
  }

  // ── Videos
  const series = ["Armored Division", "Air Force", "Navy", "Behind the Scenes", "Cat Reactions"];
  const vids = [
    { title: "Building my cat a tank out of Amazon boxes", series: "Armored Division", t: "box-tiger", cats: [0], featured: true },
    { title: "He refused to leave the tank for 6 hours", series: "Cat Reactions", t: "box-tiger", cats: [0] },
    { title: "Chonk-rated armor: the Purrsche Panther", series: "Armored Division", t: "purrsche-panther", cats: [0, 2] },
    { title: "Pickles gets her wings ✈️", series: "Air Force", t: "mewstang-p51", cats: [1] },
    { title: "The Spitfur has elliptical wings and I'm emotional", series: "Air Force", t: "spitfur", cats: [1] },
    { title: "Two cats, one bomber, total chaos", series: "Air Force", t: "biscuit-bomber", cats: [0, 1] },
    { title: "Admiral Noodle takes command of the USS Purrsylvania", series: "Navy", t: "uss-purrsylvania", cats: [2] },
    { title: "Tiny PT boat for the tiniest sailor", series: "Navy", t: "pt-whiskers", cats: [3] },
    { title: "The submarine periscope was a mistake (she loves it)", series: "Navy", t: "sub-meow-rine", cats: [3] },
    { title: "How I source free cardboard (it's not what you think)", series: "Behind the Scenes", t: null, cats: [] },
    { title: "The rotor spins. The cat does not care.", series: "Cat Reactions", t: "hiss-copter", cats: [1, 3] },
    { title: "Day in the life of a cardboard engineer", series: "Behind the Scenes", t: null, cats: [0, 1, 2, 3] },
  ];
  const usedUrls = new Set<string>();
  for (const [i, v] of vids.entries()) {
    // The first video for a template uses the template's TikTok URL; extras get their own
    const url = v.t && !usedUrls.has(T[v.t].tiktokUrl!) ? T[v.t].tiktokUrl! : VID(50 + i);
    usedUrls.add(url);
    await db.video.create({
      data: {
        url,
        tiktokId: url.split("/video/")[1],
        title: v.title,
        series: v.series,
        templateId: v.t ? T[v.t].id : null,
        featured: Boolean(v.featured),
        sortOrder: i,
        publishedAt: daysAgo(120 - i * 9),
        authorName: siteConfig.social.tiktokHandle,
        cats: { connect: v.cats.map((c) => ({ id: cats[c].id })) },
      },
    });
  }
  void series;

  // ── Guides
  const guideDefs: { slug: string; title: string; summary: string; category: "BUILD" | "SOURCING" | "ADHESIVES" | "TECHNIQUE"; premium: boolean; t?: string; vt: A.Vehicle; steps: [string, string][] }[] = [
    {
      slug: "box-tiger-build-guide", title: "Box Tiger: Full Build Guide", summary: "Step-by-step assembly of our flagship tank, from flat box to fully armored loaf.", category: "BUILD", premium: false, t: "box-tiger", vt: "TANK",
      steps: [
        ["Print and check scale", "Print every sheet at 100% (no 'fit to page'). Measure the scale-check square: it should be exactly 1 inch. If it's off, check your printer's scaling settings before cutting anything."],
        ["Trace and cut the hull", "Tape the hull sheets to your box with low-tack tape, then trace with a ballpoint, pressing hard to score the lines. Cut along solid lines with a fresh blade and a metal ruler. Keep your fingers behind the blade."],
        ["Double the floor", "Glue a second layer of cardboard under the floor panel with grain running the opposite direction. This is the single most important step for loaf survival."],
        ["Assemble the turret", "Fold the turret walls along the dotted lines, glue tabs A1–A6, then attach the hatch ring. Let it dry fully before your cat inspects it."],
        ["Tracks and wheels", "Glue bottle caps to the wheel guides. Wrap the track strip (corrugation facing out for texture) and secure at the rear."],
        ["Final inspection", "Run your hand over every inside edge. Cover any rough spots with kraft tape. Remove loose bits. The vehicle is ready to deploy."],
      ],
    },
    {
      slug: "mewstang-build-guide", title: "P-51 Mewstang: Full Build Guide", summary: "Fuselage, detachable wings, and a spinning prop.", category: "BUILD", premium: false, t: "mewstang-p51", vt: "PLANE",
      steps: [
        ["Prep the fuselage box", "Choose a long box and tape it closed. Mark the cockpit opening using sheet 2. It should be wider than your cat at the shoulders plus two inches."],
        ["Cut the cockpit", "Cut the opening and fold the edges inward to make a smooth, rounded rim. Glue the folds down."],
        ["Wings with slots", "Cut both wings from poster board and the wing slot from the fuselage. Wings slide in for display and pull out for storage."],
        ["Prop hub", "Attach the paper-plate hub with a paper fastener so it spins freely. Keep it on the outside, away from paws."],
        ["Nose art", "Use the included stencils for the nose art. Water-based paint only, and let it dry overnight."],
      ],
    },
    {
      slug: "biscuit-bomber-advanced", title: "B-17 Biscuit Bomber: Advanced Techniques", summary: "Wing spars, twin compartments, and four props. A premium guide for elite builders.", category: "BUILD", premium: true, t: "biscuit-bomber", vt: "PLANE",
      steps: [
        ["Planning the build", "Lay out all three boxes and map the panel layout before cutting. This guide includes an optimal cutting map that saves about one box."],
        ["Wing spar", "Laminate three strips of cardboard with the grain alternating, or use a dowel. The spar is what keeps a 5-foot wing from drooping."],
        ["Twin compartments", "Build the pilot and tail-gunner compartments as separate boxes, then join them with the fuselage skin."],
        ["Four engines", "Assemble each nacelle around a paper-plate cowling. Use the jig on sheet 9 to keep all four identical."],
        ["Finishing", "Panel lines with a fine marker, plus exhaust streaks with dry-brushed watercolor."],
      ],
    },
    {
      slug: "purrsylvania-build-guide", title: "USS Purrsylvania: Build Guide", summary: "Battleship hull, bridge bed, and rotating turrets.", category: "BUILD", premium: true, t: "uss-purrsylvania", vt: "BOAT",
      steps: [
        ["Hull shaping", "Score the bow panels with the kerf technique so the hull curves smoothly to a point."],
        ["Bridge bed", "The sunken bridge is a removable tray. Line it with a towel for maximum admiral comfort."],
        ["Turrets", "Each turret sits on a paper-plate bearing with a brad through the center, so they rotate."],
        ["Smokestack scratch post", "Wrap the smokestack tube in sisal rope, glued at the top and bottom only."],
      ],
    },
    {
      slug: "sourcing-free-cardboard", title: "Sourcing Free (and Great) Cardboard", summary: "Where to find sturdy boxes for free, and how to tell good cardboard from bad.", category: "SOURCING", premium: false, vt: "OTHER",
      steps: [
        ["Ask local shops", "Appliance, bike, and furniture stores throw out huge double-wall boxes. Ask politely, and ask for the big ones."],
        ["Single vs double wall", "Look at the edge: one wavy layer is single-wall, two is double-wall. Use double-wall for floors and anything a cat sits on."],
        ["Avoid these", "Skip greasy pizza boxes, boxes with heavy ink or glossy coatings, and anything damp or moldy."],
        ["Flatten and store", "Store boxes flat and dry. Mark grain direction with an arrow so you can plan strong panels later."],
      ],
    },
    {
      slug: "cat-safe-glues-and-tapes", title: "Cat-Safe Glues and Tapes", summary: "Which adhesives are safe for cat builds, and which to avoid entirely.", category: "ADHESIVES", premium: false, vt: "TANK",
      steps: [
        ["Best: water-activated kraft tape", "Paper tape with a starch-based adhesive. It's non-toxic, strong, and has no sticky edges for fur to catch on."],
        ["Good: low-temp hot glue", "Strong and fast. Low-temp guns reduce burn risk for you. Let the glue cool completely and peel off any strings."],
        ["Good: white PVA (school) glue", "Non-toxic and strong once dry. Slow, so clamp with clothespins."],
        ["Avoid", "Staples, pins, super glue on interior surfaces, solvent-based contact cement, and plastic packing tape on the inside (cats chew it)."],
      ],
    },
    {
      slug: "kerf-folding-curves", title: "Technique: Kerf Folding for Smooth Curves", summary: "How to bend cardboard into clean curves for wings, hulls, and turrets.", category: "TECHNIQUE", premium: true, vt: "PLANE",
      steps: [
        ["What is a kerf?", "A kerf is a shallow cut through one face of the cardboard. A series of parallel kerfs lets the board bend smoothly."],
        ["Spacing", "Tight spacing (1 cm) gives a tight curve, wider spacing a gentle curve. Practice on scrap first."],
        ["Locking the curve", "Glue a strip of paper or poster board across the inside of the curve to hold its shape."],
      ],
    },
  ];
  for (const [i, g] of guideDefs.entries()) {
    const cover = await A.genericCover(`seed/guides/${g.slug}.png`, g.title.split(":")[0], g.vt, i);
    await db.guide.create({
      data: {
        slug: g.slug,
        title: g.title,
        summary: g.summary,
        category: g.category,
        premium: g.premium,
        coverImageKey: cover,
        templateId: g.t ? T[g.t].id : null,
        intro: `${g.summary} Read the Cat Safety briefing before you start, and keep your workspace clear of curious paws while cutting.`,
        steps: {
          create: g.steps.map(([title, body], k) => ({
            order: k + 1,
            title,
            body,
            imageKey: g.t && k % 2 === 0 ? (T[g.t].imageKeys as string[])[(k / 2) % 4] : null,
            videoUrl: g.t && k === 1 ? T[g.t].tiktokUrl : null,
          })),
        },
      },
    });
  }

  // ── Affiliate links (PLACEHOLDER URLs, replace with real affiliate links in admin)
  await db.affiliateLink.createMany({
    data: [
      { name: "Self-healing cutting mat (A2)", description: "The big one. It saves your table and your blades.", url: "https://www.amazon.com/dp/PLACEHOLDER1?tag=YOURTAG-20", category: "Cutting", priceHint: "$25", badge: "Her pick", sortOrder: 0 },
      { name: "Snap-off utility knife (heavy duty)", description: "18 mm blades and a locking slider. Snap often, because sharp is safer.", url: "https://www.amazon.com/dp/PLACEHOLDER2?tag=YOURTAG-20", category: "Cutting", priceHint: "$12", sortOrder: 1 },
      { name: "Precision craft knife set", description: "For turret rings and fine details.", url: "https://www.amazon.com/dp/PLACEHOLDER3?tag=YOURTAG-20", category: "Cutting", priceHint: "$15", sortOrder: 2 },
      { name: "Cork-backed steel ruler (24 in)", description: "Doesn't slip and doesn't get nicked.", url: "https://www.amazon.com/dp/PLACEHOLDER4?tag=YOURTAG-20", category: "Measuring", priceHint: "$14", sortOrder: 3 },
      { name: "Low-temp mini glue gun", description: "Kinder to fingers, still strong enough for double-wall.", url: "https://www.amazon.com/dp/PLACEHOLDER5?tag=YOURTAG-20", category: "Adhesives", priceHint: "$18", badge: "Cat-safe", sortOrder: 4 },
      { name: "Water-activated kraft tape + dispenser", description: "The gold standard for cat builds: paper, starch glue, no sticky edges.", url: "https://www.amazon.com/dp/PLACEHOLDER6?tag=YOURTAG-20", category: "Adhesives", priceHint: "$22", badge: "Her pick", sortOrder: 5 },
      { name: "Cardboard scoring tool (bone folder)", description: "For crisp folds without cracking.", url: "https://www.amazon.com/dp/PLACEHOLDER7?tag=YOURTAG-20", category: "Folding", priceHint: "$8", badge: "Budget", sortOrder: 6 },
      { name: "Water-based acrylic paint set (military colors)", description: "Olive drab, khaki, field gray, desert tan. Non-toxic once dry.", url: "https://www.amazon.com/dp/PLACEHOLDER8?tag=YOURTAG-20", category: "Finishing", priceHint: "$20", sortOrder: 7 },
      { name: "Cut-resistant gloves", description: "Level 5 cut protection. Wear them on the non-knife hand.", url: "https://www.amazon.com/dp/PLACEHOLDER9?tag=YOURTAG-20", category: "Safety", priceHint: "$11", sortOrder: 8 },
      { name: "Sisal rope (for scratch-post details)", description: "Wrap smokestacks and gun barrels to make scratchable accessories.", url: "https://www.amazon.com/dp/PLACEHOLDER10?tag=YOURTAG-20", category: "Finishing", priceHint: "$10", sortOrder: 9 },
    ],
  });

  // ── Polls
  const openPoll = await db.poll.create({
    data: {
      title: "What should we build in November?",
      description: "Members vote, the winner becomes next month's template. Officers get 2 votes, Commanders 3.",
      status: "OPEN",
      closesAt: new Date(Date.now() + 9 * 86_400_000),
      options: { create: [{ label: "Sherman 'Shermeow' Tank" }, { label: "Zero 'Purr-o' Fighter" }, { label: "Aircraft Carrier (two-cat deck)" }, { label: "Lunar Rover (Space Force)" }] },
    },
    include: { options: true },
  });
  const memberUsers = users.slice(0, 7);
  for (const [i, u] of memberUsers.entries()) {
    await db.pollVote.create({ data: { pollId: openPoll.id, optionId: openPoll.options[i % 3 === 0 ? 2 : i % 4].id, userId: u.id, weight: (i % 3) + 1 } });
  }
  await db.poll.create({
    data: {
      title: "October build (closed)",
      status: "CLOSED",
      closesAt: daysAgo(20),
      options: { create: [{ label: "Officer's Staff Car" }, { label: "Half-track" }, { label: "Hovercraft" }] },
    },
  });

  // ── Coupons
  await db.coupon.createMany({
    data: [
      { code: siteConfig.commerce.referral.newCustomerCouponCode, description: "Referral welcome: 10% off", percentOff: 10 },
      { code: "WELCOME5", description: "$5 off orders $25+", amountOffCents: 500, minSubtotalCents: 2500 },
      { code: "CHONK20", description: "20% off (expired)", percentOff: 20, expiresAt: daysAgo(10), active: true },
    ],
  });

  // ── Orders + revenue ledger (last 90 days, spread across channels)
  let orderNo = 1001;
  const variants = await db.productVariant.findMany({ include: { product: true } });
  const shipping = await db.shippingRate.findFirst({ orderBy: { sortOrder: "asc" } });
  for (let i = 0; i < 70; i++) {
    const buyer = rand() < 0.75 ? pick(users) : null;
    const email = buyer?.email ?? `guest${i}@example.com`;
    const paidAt = daysAgo(int(0, 89));
    const items: { kind: "TEMPLATE" | "PRODUCT"; channel: Channel; name: string; templateId?: string; variantId?: string; quantity: number; unitPriceCents: number; totalCents: number }[] = [];
    const nT = rand() < 0.7 ? int(1, 2) : 0;
    for (let k = 0; k < nT; k++) {
      const t = pick(publicPaid);
      if (items.some((it) => it.templateId === t.id)) continue;
      const price = t.pricingMode === "PWYW" ? t.suggestedPriceCents ?? t.priceCents : t.priceCents;
      items.push({ kind: "TEMPLATE", channel: "TEMPLATES", name: t.name, templateId: t.id, quantity: 1, unitPriceCents: price, totalCents: price });
    }
    if (rand() < 0.45 || items.length === 0) {
      const v = pick(variants);
      const q = rand() < 0.85 ? 1 : 2;
      const price = v.priceCents ?? v.product.priceCents;
      items.push({ kind: "PRODUCT", channel: v.product.type === "KIT" ? "KITS" : "MERCH", name: `${v.product.name} (${v.name})`, variantId: v.id, quantity: q, unitPriceCents: price, totalCents: price * q });
    }
    const subtotal = items.reduce((a, b) => a + b.totalCents, 0);
    const physical = items.some((it) => it.kind === "PRODUCT");
    const shippingCents = physical ? (subtotal >= 7500 ? 0 : shipping!.priceCents) : 0;
    const referrer = buyer && [users[11].id, users[12].id, users[13].id].includes(buyer.id) ? (buyer.id === users[13].id ? users[2] : users[0]) : null;
    const order = await db.order.create({
      data: {
        number: orderNo++,
        userId: buyer?.id,
        email,
        status: "PAID",
        fulfillmentStatus: physical ? (paidAt < daysAgo(7) ? "DELIVERED" : pick(["UNFULFILLED", "PROCESSING", "SHIPPED"] as const)) : "NOT_REQUIRED",
        subtotalCents: subtotal,
        shippingCents,
        totalCents: subtotal + shippingCents,
        shippingRateId: physical ? shipping!.id : null,
        shippingAddress: physical ? { name: buyer?.name ?? "Guest Recruit", line1: `${int(10, 999)} Cardboard Ave`, city: "Boxford", state: "MA", postal_code: "01921", country: "US" } : undefined,
        referrerId: referrer?.id,
        paidAt,
        createdAt: paidAt,
        items: { create: items.map((it) => ({ ...it, license: "PERSONAL" })) },
      },
    });
    for (const it of items) {
      await db.revenueEvent.create({ data: { channel: it.channel, amountCents: it.totalCents, description: it.name, orderId: order.id, referred: Boolean(referrer), occurredAt: paidAt } });
      if (it.templateId) {
        await db.entitlement.upsert({
          where: { email_templateId: { email, templateId: it.templateId } },
          create: { email, userId: buyer?.id, templateId: it.templateId, source: "PURCHASE", orderId: order.id, createdAt: paidAt },
          update: {},
        });
      }
    }
    if (referrer) {
      const reward = Math.round((order.totalCents * siteConfig.commerce.referral.rewardPercent) / 100);
      await db.referralConversion.create({ data: { referrerId: referrer.id, orderId: order.id, referredEmail: email, orderTotalCents: order.totalCents, rewardCents: reward, createdAt: paidAt } });
      await db.user.update({ where: { id: referrer.id }, data: { storeCreditCents: { increment: reward } } });
    }
  }
  // Free lead-magnet claims
  for (const u of users.slice(0, 10)) {
    await db.entitlement.upsert({ where: { email_templateId: { email: u.email, templateId: T["kitten-jeep"].id } }, create: { email: u.email, userId: u.id, templateId: T["kitten-jeep"].id, source: "FREE" }, update: {} });
  }
  // Referral clicks
  for (let i = 0; i < 37; i++) await db.referralClick.create({ data: { referrerId: i % 3 === 0 ? users[2].id : users[0].id, createdAt: daysAgo(int(0, 60)) } });

  // Membership revenue (monthly renewals)
  const memberships = await db.membership.findMany();
  for (const m of memberships) {
    const tier = siteConfig.membership.tiers.find((t) => t.id === m.tier)!;
    const amount = m.interval === "YEAR" ? tier.annualCents : tier.monthlyCents;
    const periods = m.interval === "YEAR" ? 1 : 3;
    for (let k = 0; k < periods; k++) {
      await db.revenueEvent.create({ data: { channel: "MEMBERSHIPS", amountCents: amount, description: `${tier.name} membership (${m.interval.toLowerCase()})`, occurredAt: daysAgo(k * 30 + int(0, 5)) } });
    }
  }

  // Tips
  const tipMsgs = ["For Biscuit's snack fund 🐟", "Your videos got me through finals week!", "Pickles deserves a raise", "From one box hoarder to another", null, "Keep building!", null, "My cat watches with me ❤️"];
  for (let i = 0; i < 14; i++) {
    const amt = pick([300, 500, 500, 1000, 1000, 2500, 700]);
    const paidAt = daysAgo(int(0, 80));
    await db.tip.create({ data: { name: rand() < 0.75 ? `${pick(FIRST)} ${pick(LAST)[0]}.` : null, amountCents: amt, message: pick(tipMsgs), showOnWall: rand() < 0.8, paid: true, paidAt, createdAt: paidAt } });
    await db.revenueEvent.create({ data: { channel: "TIPS", amountCents: amt, description: "Tip", occurredAt: paidAt } });
  }

  // Commissions
  const commissionStatuses = ["DEPOSIT_PAID", "QUOTED", "IN_PROGRESS", "COMPLETED"] as const;
  const subjects = ["car", "truck", "motorcycle", "house"];
  for (let i = 0; i < 4; i++) {
    const u = users[i + 3];
    const paidAt = daysAgo(int(5, 60));
    const photo = await A.genericCover(`seed/commissions/req-${i}.png`, `Request: ${subjects[i]}`, i === 2 ? "OTHER" : "TANK", i);
    await db.commission.create({
      data: {
        userId: u.id, name: u.name!, email: u.email, subjectType: subjects[i],
        description: ["Our 1998 Jeep Wrangler, please! Our cat Luna rides shotgun in real life.", "My dad's red pickup truck for his birthday. He has two cats.", "My Vespa scooter. Cat is small (6 lb).", "Our little blue house with the round window, cat-sized."][i],
        catCount: i === 1 ? 2 : 1, photoKeys: [photo], status: commissionStatuses[i], depositCents: siteConfig.commerce.commissionDepositCents,
        quoteCents: i > 0 ? [0, 22000, 18000, 30000][i] : null, depositPaidAt: paidAt, createdAt: paidAt,
      },
    });
    await db.revenueEvent.create({ data: { channel: "COMMISSIONS", amountCents: siteConfig.commerce.commissionDepositCents, description: `Commission deposit (${subjects[i]})`, occurredAt: paidAt } });
  }

  // Gift cards
  for (let i = 0; i < 3; i++) {
    const amt = [2500, 5000, 1000][i];
    const paidAt = daysAgo(int(1, 50));
    await db.giftCard.create({ data: { code: `MEOW-${["ALPHA", "BRAVO", "CHARL"][i]}-${1000 + i}`, initialCents: amt, balanceCents: i === 0 ? 1200 : amt, purchaserEmail: users[i].email, recipientEmail: `friend${i}@example.com`, recipientName: pick(FIRST), message: "Happy birthday! Build your cat a tank.", createdAt: paidAt } });
    await db.revenueEvent.create({ data: { channel: "GIFT_CARDS", amountCents: amt, description: "Gift card", occurredAt: paidAt } });
  }

  // Subscribers
  for (const u of users) await db.subscriber.create({ data: { email: u.email, name: u.name, source: pick(["lead_magnet", "footer", "checkout"]), createdAt: u.createdAt } });
  for (let i = 0; i < 30; i++) await db.subscriber.create({ data: { email: `fan${i}@example.com`, source: pick(["lead_magnet", "lead_magnet", "footer", "drop_notify"]), createdAt: daysAgo(int(0, 120)), status: i % 13 === 0 ? "UNSUBSCRIBED" : "SUBSCRIBED" } });

  // Drop notifications for the upcoming template
  for (let i = 0; i < 18; i++) await db.dropNotify.create({ data: { email: `fan${i}@example.com`, templateId: T["catillery-howitzer"].id } });

  // Inquiries
  await db.inquiry.createMany({
    data: [
      { kind: "SPONSORSHIP", name: "Dana from PurrFect Litter", email: "partnerships@purrfect.example", company: "PurrFect Litter Co.", budget: "$2,000–$5,000", message: "We'd love a dedicated video featuring our new litter box built into a cardboard bunker." },
      { kind: "CLASSROOM", name: "Ms. Alvarez", email: "alvarez@school.example", company: "Lincoln Elementary", message: "Looking for 28 Kitten Jeep kits for our STEM week.", data: { students: 28, kits: "Kitten Jeep Kit", needBy: "2026-11-15" } },
      { kind: "SPONSORSHIP", name: "Jules", email: "jules@boxco.example", company: "BoxCo Shipping", budget: "$5,000+", message: "Ongoing partnership for branded boxes with printed templates?", status: "IN_PROGRESS" },
    ],
  });

  // A sent broadcast for history
  await db.broadcast.create({ data: { subject: "🚢 The USS Purrsylvania has launched", body: "The battleship template is live! Members get it 20% off this week.", segment: "ALL", status: "SENT", recipientCount: 41, sentAt: daysAgo(30) } });

  // Favorites
  for (const u of users.slice(0, 5)) {
    for (const t of templates.slice(1, 4)) await db.favorite.create({ data: { userId: u.id, templateId: t.id } });
  }

  console.log(`✅ Seeded: ${templates.length} templates, ${bundles.length} bundles, ${Object.keys(P).length} products, ${cats.length} cats, ${posts.length} gallery posts, ${orderNo - 1001} orders.`);
  console.log(`👑 Admin: ${admin.email} · 🎖️ Commander member: commander@example.com · 🪖 Customer: recruit@example.com`);
  console.log("   Sign in at /sign-in with any of these; the magic link is printed in the dev server console.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
