# Meowfia Motor Pool

A mobile-first storefront and community site for a TikTok creator who builds cardboard tanks, planes, and warships for her cats. It sells printable templates (free, fixed, and pay-what-you-want, with license upgrades), pre-cut kits, print-on-demand merch, custom commissions, gift cards, memberships, and tips. It also runs a community gallery with ranks, build guides, scheduled drops, email marketing, referrals, affiliate links, sponsorship inquiries, and a full admin dashboard.

**Everything runs locally with zero API keys.** Every integration has a mock mode (see [Mock mode](#mock-mode)).

> **Stack:** Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Framer Motion · Prisma 7 (SQLite locally, Postgres in production) · Auth.js v5 · Stripe · Resend + React Email · S3/R2 storage · Printful · Vitest

---

## Contents

1. [Run it locally](#run-it-locally)
2. [Demo accounts](#demo-accounts)
3. [Mock mode](#mock-mode)
4. [Fill in the brand](#fill-in-the-brand)
5. [Environment variables](#environment-variables)
6. [Accounts she'll need](#accounts-shell-need)
7. [Making someone an admin](#making-someone-an-admin)
8. [Testing Stripe locally](#testing-stripe-locally)
9. [Switching to Postgres](#switching-to-postgres)
10. [File storage (Cloudflare R2 / S3)](#file-storage-cloudflare-r2--s3)
11. [Scheduled jobs](#scheduled-jobs)
12. [Deploying to Vercel](#deploying-to-vercel)
13. [Go-live checklist](#go-live-checklist)
14. [Project tour](#project-tour)
15. [Scripts and tests](#scripts-and-tests)
16. [Notes and known limitations](#notes-and-known-limitations)

---

## Run it locally

**The dev server runs on port 3847** (`next dev -p 3847`), not 3000.

Requirements: Node.js 20.9+ (tested on 22) and npm.

```bash
cd meow-app
npm install                     # also runs `prisma generate`
cp .env.example .env            # every key is optional locally
npm run setup                   # creates ./dev.db, generates placeholder art + PDFs, seeds data
npm run dev                     # → http://localhost:3847
```

Optional but recommended, so sessions and download links use real secrets:

```bash
# paste these into .env
AUTH_SECRET="$(openssl rand -base64 32)"
DOWNLOAD_SIGNING_SECRET="$(openssl rand -base64 32)"
CRON_SECRET="$(openssl rand -hex 16)"
```

To start fresh at any time, run `npm run db:reset`. It wipes and reseeds the database, and also signs everyone out.

### Signing in locally

Sign-in uses email magic links. Without a Resend key, **the link is printed in the terminal running `npm run dev`** (look for `📬 EMAIL (console mode)` and the `Links:` list). Every email the app sends is also viewable at **Admin → Email log**.

## Demo accounts

The seed creates these (sign in with the email, then grab the link from the terminal):

| Email | What it shows |
|---|---|
| `admin@example.com` | Admin (whoever is in `ADMIN_EMAILS` gets promoted on sign-in) |
| `commander@example.com` | Commander-tier member: all paid templates included, orders, a referral history |
| `recruit@example.com` | Regular customer with no membership |

## Mock mode

| Integration | Without keys | With keys |
|---|---|---|
| **Payments** (Stripe) | `/checkout/mock` "pays" and runs the *exact same* fulfillment code as the webhook | Stripe Checkout (test or live) + webhooks |
| **Email** (Resend) | Rendered and printed to the console + saved in Admin → Email log | Delivered via Resend |
| **Google sign-in** | Button hidden (email links still work) | "Continue with Google" |
| **File storage** | `./storage` on local disk | S3 / Cloudflare R2 |
| **Printful** | Mock catalog; orders logged, not placed | Real sync + draft orders |
| **Rate limiting** | In-memory | Upstash Redis (shared across serverless instances) |
| **TikTok embeds** | Styled placeholder card (seed URLs are fake) | oEmbed thumbnails for real videos (no key needed) |
| **Analytics / pixels** | Off | Vercel Analytics, Plausible, TikTok Pixel, Meta Pixel |

> 🔒 Mock checkout **never runs when `STRIPE_SECRET_KEY` is set**, and is disabled in production unless you explicitly set `ALLOW_MOCK_PAYMENTS=true` (only for a private staging demo).

## Fill in the brand

All brand details live in **one file: [`src/config/site.ts`](src/config/site.ts)**. That covers the site name, creator name and bio, TikTok handle, social and Ko-fi/Patreon links, follower stats, media-kit numbers, cats, colors, membership tiers and prices, tip and gift-card presets, the commission deposit, referral reward, the order-bump product, rank thresholds, and navigation.

- **Cats** are seeded from `siteConfig.cats`. After seeding, edit them in **Admin → Cats** (or change the config and run `npm run db:seed`).
- **Colors**: the CSS theme tokens are in `src/app/globals.css` (`:root`). Keep them in sync with `siteConfig.colors`, which emails and share images use.
- **Legal pages** are placeholders, clearly marked *REVIEW BEFORE LAUNCH*, in [`src/content/legal.ts`](src/content/legal.ts).
- **Placeholder art and PDFs** are generated by the seed. Replace them with real photos and PDFs in **Admin → Templates / Products / Cats**.

## Environment variables

Everything is documented inline in [`.env.example`](.env.example). Here is the summary:

| Variable | Needed for | Where to get it |
|---|---|---|
| `DATABASE_URL` | Always | Local: `file:./dev.db`. Production: Postgres URL from [Neon](https://neon.tech) or [Supabase](https://supabase.com) (see [Switching to Postgres](#switching-to-postgres)) |
| `NEXT_PUBLIC_SITE_URL` | Production | Your domain, e.g. `https://meowfia.com` (used in emails, Stripe redirects, sitemap, share images) |
| `AUTH_SECRET` | **Required in prod** | `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_URL` | Production | Same as your site URL |
| `ADMIN_EMAILS` | Admin access | Comma-separated emails promoted to admin on sign-in |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in | [Google Cloud Console → Credentials → OAuth client (Web)](https://console.cloud.google.com/apis/credentials). Redirect URI: `https://YOURDOMAIN/api/auth/callback/google` |
| `STRIPE_SECRET_KEY` | Payments | [Stripe → Developers → API keys](https://dashboard.stripe.com/test/apikeys) (`sk_test_…` until launch) |
| `STRIPE_WEBHOOK_SECRET` | Payments | Local: printed by `stripe listen`. Production: Stripe → Developers → Webhooks (see [Go-live](#go-live-checklist)) |
| `RESEND_API_KEY` | Real email | [resend.com/api-keys](https://resend.com/api-keys) |
| `EMAIL_FROM` | Real email | e.g. `Meowfia <hq@yourdomain.com>` on a [verified domain](https://resend.com/domains) |
| `EMAIL_REPLY_TO` | Optional | Where replies go |
| `STORAGE_DRIVER` | Production | `s3` on Vercel (its filesystem isn't persistent); `local` for dev |
| `LOCAL_STORAGE_DIR` | Optional | Defaults to `storage` |
| `S3_ENDPOINT` `S3_REGION` `S3_BUCKET` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` | Production storage | Cloudflare R2 → Manage API tokens (endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`) or AWS IAM |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | Production storage | Public URL of the bucket (R2 public bucket / custom domain), for images |
| `PRINTFUL_API_KEY` | Merch | [Printful → Developer portal](https://developers.printful.com/) → private token (scopes: orders, sync products) |
| `PRINTFUL_STORE_ID` | Optional | Only if the token can access several stores |
| `DOWNLOAD_SIGNING_SECRET` | Recommended | `openssl rand -base64 32` (falls back to `AUTH_SECRET`) |
| `CRON_SECRET` | **Required in prod** | `openssl rand -hex 16`. Vercel sends it automatically to cron routes |
| `ALLOW_MOCK_PAYMENTS` | Never in real prod | `true` only for a private staging demo without Stripe |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Recommended in prod | [console.upstash.com](https://console.upstash.com) → Redis → REST API |
| `NEXT_PUBLIC_VERCEL_ANALYTICS` | Optional | `1` (also enable Web Analytics in the Vercel dashboard) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | Your domain as configured in Plausible |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | Optional | TikTok Ads Manager → Assets → Events → Web Events |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional | Meta Events Manager → Data sources |

## Accounts she'll need

| Service | Why | Cost to start |
|---|---|---|
| **Stripe** | Payments, subscriptions, refunds, billing portal | Free; per-transaction fees |
| **Resend** | Transactional + marketing email | Free tier (3k emails/month); paid as the list grows |
| **Printful** | Print-on-demand merch | Free; pay per order |
| **Cloudflare R2** (or AWS S3) | Images, template PDFs, uploads | R2 free tier is generous, with no egress fees |
| **Neon** or **Supabase** | Postgres database | Free tier |
| **Google Cloud** | "Continue with Google" | Free |
| **Vercel** | Hosting + cron jobs | **Pro plan needed** for this site: Hobby is for non-commercial use and only allows once-a-day crons, so a deploy with the 15-minute/hourly schedules in `vercel.json` is rejected on Hobby |
| *Optional:* Upstash, Plausible, TikTok Ads, Meta Business | Rate limiting, analytics, ad pixels | Free tiers / varies |

## Making someone an admin

Pick any one of these:

1. **Env var:** add their email to `ADMIN_EMAILS` (comma-separated). They're promoted the next time they sign in.
2. **CLI:** `npm run make-admin -- them@example.com` (revoke with `--revoke`). This works against whatever `DATABASE_URL` points to, including production.
3. **Admin UI:** Admin → Customers → "Make admin".

Admin lives at **`/admin`**. Non-admins get a 404 there, so its existence isn't revealed.

## Testing Stripe locally

```bash
# 1. Put your TEST secret key in .env:  STRIPE_SECRET_KEY="sk_test_..."
# 2. In another terminal:
stripe login
stripe listen --forward-to localhost:3847/api/stripe/webhook
# 3. Copy the printed whsec_... into .env as STRIPE_WEBHOOK_SECRET, restart `npm run dev`
# 4. Pay with test card 4242 4242 4242 4242, any future date, any CVC
```

Memberships use inline prices, so you don't have to create Products or Prices in Stripe first. For members to **switch plans** in the Stripe billing portal, create matching Products/Prices in Stripe and enable plan switching in the portal settings. Cancel, resume, and card updates work out of the box.

## Switching to Postgres

SQLite is great locally, but use Postgres in production (Neon or Supabase):

1. `npm install @prisma/adapter-pg`
2. Edit **[`src/lib/db-adapter.ts`](src/lib/db-adapter.ts)**, the only file that picks the driver: `import { PrismaPg } from "@prisma/adapter-pg"` and `return new PrismaPg({ connectionString: url })`.
3. In `prisma/schema.prisma`, set `provider = "postgresql"`.
4. Set `DATABASE_URL` to the Postgres URL (with Neon, use the **pooled** connection string), then:
   ```bash
   npx prisma migrate dev --name init   # creates prisma/migrations; commit it
   npx prisma migrate deploy            # in production / CI
   ```
5. Optional: run `npm run db:seed` once on a staging database for demo data. **Don't seed production** (it clears tables first).

## File storage (Cloudflare R2 / S3)

- Public images are served from `NEXT_PUBLIC_MEDIA_BASE_URL`.
- Template PDFs and commission photos are stored under the `private/` prefix and **only ever streamed through the app**: downloads use expiring signed links checked against ownership, and private photos are admin-only.
- Admin uploads go **straight from the browser to the bucket** via presigned URLs (this avoids Vercel's 4.5 MB request limit for big PDFs). Add a CORS rule to the bucket:

```json
[{ "AllowedOrigins": ["https://YOURDOMAIN"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
```

- Keep the bucket's `private/` keys non-public. If you make the whole bucket public for images, put images and PDFs in **separate buckets**, or serve public images through a custom domain that only exposes non-`private/` paths.
- The seed only writes to local disk. In production, upload real images and PDFs through the admin.

## Scheduled jobs

Defined in [`vercel.json`](vercel.json) and run by Vercel Cron (authorized by `CRON_SECRET`):

| Job | Schedule | What it does |
|---|---|---|
| `/api/cron/drops` | every 15 min | Emails members when early access opens, then announces released templates to "notify me" signups and subscribers (deduplicated, never twice) |
| `/api/cron/welcome` | hourly | Day-2 and day-5 welcome emails |
| `/api/cron/abandoned-carts` | hourly | One reminder per abandoned cart, with a signed link that restores it |
| `/api/cron/printful-sync` | daily | Imports and updates Printful products (new ones arrive hidden for review) |

Locally, run them from **Admin → Jobs** or with `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3847/api/cron/drops`.

## Deploying to Vercel

1. Push the repo to GitHub and **import it in Vercel** with the **Root Directory** set to `meow-app`.
2. Add the environment variables (Production + Preview). At minimum: `DATABASE_URL` (Postgres), `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `STORAGE_DRIVER=s3` + the S3/R2 vars, `STRIPE_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS`.
3. The build runs `npm install` (which generates the Prisma client) and then `next build`. Run `npx prisma migrate deploy` against production before or as part of deploys.
4. Add the custom domain, then update `NEXT_PUBLIC_SITE_URL` / `AUTH_URL`.

## Go-live checklist

**Content and brand**
- [ ] Real name, handle, cats, links, stats, and prices in `src/config/site.ts`
- [ ] Real template PDFs (Letter **and** A4) and photos uploaded; seed placeholders replaced
- [ ] Lead-magnet template chosen (Admin → Templates → "Lead magnet")
- [ ] Real TikTok URLs added in Admin → Videos (thumbnails auto-fill); one marked featured for the home hero
- [ ] Affiliate links swapped for real tagged URLs (Admin → Affiliate links); affiliate disclosure reviewed
- [ ] Media kit numbers and rates updated
- [ ] **Legal pages reviewed and replaced by a professional** (`src/content/legal.ts`)

**Infrastructure**
- [ ] Postgres set up, migrations deployed, **not** seeded
- [ ] R2/S3 bucket with CORS; `NEXT_PUBLIC_MEDIA_BASE_URL` serving images; `private/` not publicly listable
- [ ] `AUTH_SECRET`, `DOWNLOAD_SIGNING_SECRET`, `CRON_SECRET` set to strong random values
- [ ] `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` set to the real domain
- [ ] Upstash configured for rate limiting
- [ ] `ALLOW_MOCK_PAYMENTS` **unset**

**Stripe**
- [ ] Business details, branding, and statement descriptor set; account activated
- [ ] Live keys in production env (`sk_live_…`)
- [ ] Webhook endpoint `https://YOURDOMAIN/api/stripe/webhook` with events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `charge.refunded`; signing secret in `STRIPE_WEBHOOK_SECRET`
- [ ] Customer billing portal configured (cancellation, payment method updates, invoice history)
- [ ] Stripe Tax enabled or a sales-tax approach decided (not included in this build)
- [ ] One real end-to-end purchase + refund tested in live mode

**Email**
- [ ] Sending domain verified in Resend (SPF/DKIM/DMARC); `EMAIL_FROM` uses it
- [ ] Test every email: magic link, receipt, gift card, welcome series, drop, abandoned cart, broadcast, shipped notice
- [ ] Physical mailing address added to marketing emails if required in her jurisdiction (CAN-SPAM)

**Auth and admin**
- [ ] Google OAuth consent screen published; production redirect URI added
- [ ] Her email in `ADMIN_EMAILS`; signed in and confirmed `/admin` works

**Shop**
- [ ] Printful connected, products synced, reviewed, and set visible; `createPrintfulOrder` is set to **draft** orders (`confirm=false` in `src/lib/printful.ts`). Switch to auto-confirm when ready
- [ ] Shipping rates and the free-shipping threshold reviewed (seeded in the `ShippingRate` table)
- [ ] Kit inventory counts set

**Analytics and SEO**
- [ ] Analytics/pixel IDs set; a cookie consent banner added if targeting the EU/UK (not included)
- [ ] Sitemap submitted in Google Search Console (`/sitemap.xml`)
- [ ] Share previews checked (template, product, and recruit pages generate their own share images)

## Project tour

```
meow-app/
├─ prisma/
│  ├─ schema.prisma         # full data model (portable to Postgres)
│  ├─ seed.ts               # realistic demo data
│  └─ seed-assets.ts        # generates placeholder art (sharp) + Letter/A4 PDFs (pdf-lib)
├─ scripts/make-admin.ts
├─ src/
│  ├─ config/site.ts        # ⭐ all brand settings
│  ├─ content/legal.ts      # placeholder legal text
│  ├─ app/                  # routes (public site, /account, /admin, /api)
│  ├─ actions/              # server actions (all Zod-validated; admin ones call assertAdmin)
│  ├─ components/           # brand (stamps, rank badges, countdown, TikTok embed), fleet, shop, admin, ui (shadcn)
│  ├─ emails/               # React Email templates
│  └─ lib/
│     ├─ pricing.ts         # pure pricing engine (bundles, PWYW, licenses, coupons, credit, gift cards)
│     ├─ cart.ts orders.ts payments.ts   # cart → order → Stripe/mock → fulfillment
│     ├─ access.ts          # membership perks, early access
│     ├─ downloads.ts       # HMAC-signed expiring download tokens
│     ├─ jobs.ts marketing.ts            # crons, segments, broadcasts
│     ├─ storage.ts         # local/S3 driver + presigned uploads
│     ├─ email.ts stripe.ts printful.ts tiktok.ts rate-limit.ts env.ts
│     └─ db.ts db-adapter.ts
└─ storage/                 # local files (gitignored; recreated by the seed)
```

**Security highlights:** Zod validation on every action and route, Stripe signature verification and idempotency, timing-safe secret checks, signed expiring downloads with ownership checks, private storage for PDFs and commission photos, image re-encoding that strips EXIF/GPS from user uploads, rate limits on forms, uploads, checkout, and likes, admin checks on both pages and actions, honeypots on public forms, sandboxed email previews, formula-safe CSV exports, and security headers.

## Scripts and tests

| Command | What it does |
|---|---|
| `npm run dev` / `npm start` | Dev / production server on **port 3847** |
| `npm run build` | Production build |
| `npm run typecheck` | Next route typegen + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest: pricing engine, download tokens, ranks, rate limiter, CSV, **order fulfillment integration**, and **Stripe webhook integration** (each integration test uses a throwaway SQLite DB) |
| `npm run setup` | Create the DB + seed |
| `npm run db:reset` | Wipe + reseed |
| `npm run db:studio` | Prisma Studio |
| `npm run make-admin -- email` | Grant/revoke admin |

## Notes and known limitations

- **Pinned versions:** Prisma is pinned to **7.10** (npm's `latest` tag currently points at an 8.0 release candidate). Auth.js is **v5 beta**, the version that supports the App Router.
- **Dev server tip:** after changing `prisma/schema.prisma` or installing/removing packages, **restart `npm run dev`**. The Prisma client is cached across hot reloads, and Turbopack can get stuck in a reload loop otherwise.
- **Pages render on demand** (they read the session for the header), and queries are indexed and fast. If traffic spikes, the next step is caching catalog queries or moving the header's user state client-side.
- **Big email lists:** broadcasts send from a single request with modest concurrency. Past a few thousand subscribers, switch `sendToMany` to Resend's batch API or a queue (Inngest / QStash) to stay within serverless time limits.
- **Not included:** sales tax calculation (enable Stripe Tax), a cookie-consent banner, multi-currency, and an in-app editor for build guides (guides are seeded and can be edited in Prisma Studio).
- **Lighthouse (mobile, production build, local):** Performance 88–90, Accessibility 100, Best Practices 100, SEO 100 on the home, catalog, template, product, and gallery pages. Mobile LCP is about 3.5s on Lighthouse's simulated slow 4G; the main cost is the stencil display font.
