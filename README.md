# Locker Box: van landing page

A one-page, phone-first website for **Locker Box**, Kevin's one-person mobile business in Central Texas
(moving, small welding jobs, building-material runs, building tear-downs and junk removal). People reach it
by scanning the QR code on the van, so it loads fast and puts **Call, Text, Book and Get a quote** within
a thumb's reach.

> **Status (2026-11-17): LIVE at https://trades-landing-321.pages.dev** (Cloudflare Pages project `trades-landing`,
> deployed from `main`). Locker Box at `/` and `/van` (the QR code) is back to its pre-split design (owner, 11-17: didn't like the
> rebuild). The freight brand, ELEKTRX Freight (renamed from Chalkline 11-17), is at `/freight` (name only in
> `src/data/freight.ts`), and the Locker Box page has a small `#freight` section linking to it. Moving is off the page until the TxDMV number is issued (restore steps are in the comment by
> `headline` in business.ts). The old `delivery-pages` branch is superseded by `/freight`. Deploy note: wrangler 4.15x tries to turn Pages projects into Workers and rewrites astro.config,
> package.json and wrangler.jsonc; the project was created on classic Pages, so `npm run deploy` now works as is.
> If those files ever change during a deploy, revert them.
> See [Status and next steps](#7-status-and-next-steps).

Contents

1. [Owner's guide](#1-owners-guide): change services and prices, publish, the decal, the form
2. [Reference manual](#2-reference-manual): every config field, command, env var and web address
3. [Specification](#3-specification): what the site must do, and the rules it follows
4. [Architecture](#4-architecture): how it's built and why
5. [Reusable pieces and outside services](#5-reusable-pieces-and-outside-services)
6. [Testing and quality](#6-testing-and-quality)
7. [Status and next steps](#7-status-and-next-steps)
8. [Decisions log](#8-decisions-log)
9. [Code review (2026-11-15)](#9-code-review-2026-11-15)

---

## 1. Owner's guide

Everything you'd ever change is in **one file: `src/data/business.ts`**. A blank value (`''` or `[]`)
means "not set", and that piece stays hidden on the live site. Never put made-up information there.

```sh
npm run todo     # what's still blank, and what blocks publishing
npm run dev      # preview on this computer at http://localhost:4321
npm test         # 104 checks at phone sizes (about 1 minute)
npm run deploy   # publish (refuses while something important is missing)
```

This Mac keeps Node in `~/.local/node/bin`. If `npm` isn't found, add this line to `~/.zshrc`:
`export PATH="$HOME/.local/node/bin:$PATH"`

### Change a service or price

1. Open `src/data/business.ts` and find `trades`. Services are grouped by trade, in priority order.
2. Change the name, description or price. The hourly rate is set once at the top (`HOURLY`) and every
   service uses it. Price types:

   | Price | Shows |
   |---|---|
   | `{ type: 'hourly', min: 60, max: 100 }` | $60-$100/hour |
   | `{ type: 'flat', amount: 150 }` | $150 |
   | `{ type: 'from', amount: 150 }` | From $150 |
   | `{ type: 'estimate' }` | Free estimate |
   | `{ type: 'none' }` | no price |

3. `action: 'quote'` opens the quote survey with that service already picked. `action: 'book'` sends
   people to your Square booking page (once `links.booking` is set).
4. `kind` picks which questions the survey asks: `moving`, `welding`, `materials`, `teardown` or `junk`.
   Leave it out for "anything else" (the survey then asks only for details).
5. If you change the rate, also update `rate` and the worked example `rateExample` (plain arithmetic:
   3 hours × $60 and × $100).
6. `npm run deploy`. It's live in about a minute.

### Other common changes

| To... | Change |
|---|---|
| Add a work photo | Put a `.webp` or `.jpg` (about 900 px wide) in `public/work/` and copy a line in `photos.gallery`. The caption is read aloud to blind visitors, but isn't shown. |
| Add a video | Put an `.mp4` (H.264, portrait, under ~4 MB) and a `.webp` cover in `public/work/`, and copy a line in `photos.videos`. |
| Add a real review | Copy the exact wording into `reviews`. Never edit or invent one. |
| Show your Google score | `rating: { score: '5.0', count: 12, source: 'Google' }` |
| Add your USDOT / TxDMV numbers | `credentials.licenses: [{ label: 'USDOT', number: '...' }, { label: 'TxDMV', number: '...' }]` |
| Say you're insured | `credentials.insurance: 'Commercially insured'`, only once the policy is in your name and covers Locker Box |
| Answer an FAQ | Fill the matching line in `faq`. A blank answer hides that question. |
| Offer people who scan the van a deal | `vanOffer.headline` and `vanOffer.terms` (shows only on `/van`) |
| Turn on "brings its own power" | `van.bringsOwnPower: true`, once the van battery setup exists |
| Change the logo | Replace `brand-source/locker-box-logo.png`, then `npm run images` |
| Change colors | `colors`, then `npm run images` (redraws the link preview) |

### Publish it (Cloudflare Pages, free)

**First time, on a computer with a browser:** sign in at dash.cloudflare.com, then run
`npx wrangler login` and click Allow. (The login only waits a short while, so sign in to Cloudflare first.)

**Every time after:** `npm run deploy`. It redraws the images, builds the site, creates the Cloudflare
project the first time, and uploads it. It refuses to publish while something on the "Needed before going
live" list is blank, so nobody scanning the van lands on a page they can't act on. To publish anyway
(for example a private test): `ALLOW_INCOMPLETE=1 npm run deploy`.

The first deploy gives you a `https://trades-landing.pages.dev` address. Put it in `temporaryUrl` until
you have a domain, so links and the sitemap use it.

**From a server with no browser (e.g. Hetzner):**

1. On any computer: Cloudflare → My Profile → API Tokens → Create Token → Custom token.
2. Give it one permission: Account → Cloudflare Pages → Edit, limited to your account.
3. On the server, add these to `~/.bashrc`, then run `npm run deploy` as normal:
   ```sh
   export CLOUDFLARE_API_TOKEN=the-token
   export CLOUDFLARE_ACCOUNT_ID=your-account-id
   ```
4. The server also needs Playwright's browser for the image step: `npx playwright install --with-deps chromium`.

Never put the token in a file inside this project. The Web3Forms key and the analytics token are
different: they're made to be public, so they belong in `business.ts`.

### After you buy a domain

`lockerboxtx.com` was unregistered when checked on 2026-11-04 (alternatives: `lockerboxmoving.com`,
`calllockerbox.com`). After buying it:

1. Set `domain: 'lockerboxtx.com'` in `business.ts` and `npm run deploy`.
2. Cloudflare → Workers & Pages → `trades-landing` → Custom domains → add it.
3. `npm run qr` makes `qr/van-qr.svg` (for a sign or wrap shop) and `qr/van-qr.png`. It encodes
   `https://<domain>/van` with error correction Q, a 4-module quiet zone, black on white, no logo.
4. Scan the printed proof with your phone before anything goes on the van.

### Van decal (before a full wrap)

`npm run decal` makes a 24 × 18 inch sign: the logo picture, "LOCKER BOX", your phone number, five words
(Moving, Welding, Hauling, Tear-downs, Junk removal), "Scan for prices" and the QR code, as
`qr/van-decal.pdf` + `.png` for a sign shop or magnet printer. Until the phone number, the domain and (because
it says Moving) your own USDOT/TxDMV numbers are in the config, it only makes `qr/van-decal-PREVIEW.png`,
marked "Preview, do not print". It refuses to make a sign with text running off the edge. The words are in
`WORDS` at the top of `scripts/decal.ts`.

For print, a larger or vector logo would look sharper; the current source is 1254 px wide.

### The quote survey

Four short steps: what you need → a few details for that kind of job → when → name, phone and job ZIP.
Service buttons on the page jump straight to step 2 with that service picked. "Text me photos instead"
opens the customer's texting app with a starter message (works on iPhone and Android).

Where the answers go:

- **Now (no Web3Forms key):** the customer's own email or text app opens with every answer filled in,
  and they press send. Nothing is stored anywhere. Answers go to `email`, or to your phone by text once
  `phone` is set.
- **With a free Web3Forms key** (enter your email at web3forms.com, put the key in `web3formsKey`): the
  answers go straight to your email with one tap, then the customer sees `/thanks`. Free plan: about
  250 a month, no file uploads (customers text photos instead). Spam protection is a hidden honeypot
  field; Web3Forms calls that deprecated, so if spam gets through, its captcha is the next step. Send
  yourself a test request after the first deploy.

Requests from `/van` are marked "Came from: Van QR code" so you can see what the van brings in.

### Before you advertise moving

Texas requires a TxDMV household-goods certificate, a USDOT number and filed insurance (at least $300,000
liability for vehicles under 26,000 lb, plus cargo coverage) to move household goods for pay, even with a
van. A sole proprietor registers as an individual (USDOT through FMCSA's Motus system, then TxDMV).
Check current rules at txdmv.gov/motor-carriers. The site enforces this: while any service has
`kind: 'moving'` and `credentials.licenses` is empty, `npm run deploy` and the printable decal are blocked.
To launch without moving, remove the Moving trade, change `headline` (e.g. to welding) and `schemaType`
(e.g. `HomeAndConstructionBusiness`), and drop "Moving" from the decal `WORDS`.

### Short links

| Link | Goes to |
|---|---|
| `/van` | Home page with a "Thanks for scanning the van!" banner and offer. The QR code points here. |
| `/book` | `links.booking` (Square Appointments), or home until set |
| `/pay` | `links.deposit` (a Square payment link), or home until set |
| `/review` | `links.googleReview`, or home until set |
| `/privacy` | Plain-English privacy page |
| `/contact.vcf` | "Save my number" contact card |

Text `yourdomain/review` to every customer the day you finish a job.

### Steady income

The page supports these; the income comes from doing them every time:

1. **Sell a monthly block of hours** under `plans`, with a Square subscription link. Ideas waiting for your
   OK are in the comment above `plans` (e.g. $360/month for a 4-hour turnover block).
2. **Ask every customer for a review** with `/review`, the same day.
3. **Set up a free Google Business Profile.** Most local searches end there. Use the same name, phone and area.
4. **Get customers to save your number** ("Save my number" in the footer and on the thank-you page).
5. **Watch `/van` in analytics** and "Van QR code" on quote requests to see what the van brings in.

---

## 2. Reference manual

### Config: `src/data/business.ts`

Types are in `src/data/types.ts`. Current values as of 2026-11-15 are shown.

| Field | Meaning | Current |
|---|---|---|
| `name` | Business name (title, footer, JSON-LD, decal) | `Locker Box` |
| `logo` / `logoOnLight` | Logo for the page / for Google and print (made by `npm run images`) | set |
| `headline` | The big H1 | `Moving anywhere in Texas` |
| `subheading` | Line under the van photo | `All-electric van` |
| `whatIDo` | Short list of services, used in the hero and meta description | set |
| `rate` / `rateExample` | General rate and a worked example | `$60-$100/hour`; 3 h = $180-$300 |
| `colors` | `brand` navy `#0A1F44`, `brandDeep` `#001126`, `accent` red `#C8102E`, `accentInk` white | from the logo |
| `schemaType` | schema.org type for Google | `MovingCompany` |
| `trades[]` | `{ name, services: Service[] }`; Service = `{ name, description, price, action, kind?, bookingUrl? }` | 4 trades, 5 services |
| `plans[]` | `{ name, price, description, includes[], signupUrl }` | empty |
| `area` | `{ summary, places[], note? }`; `places` also feed Google's `areaServed` | Central Texas; "Moves anywhere in Texas." |
| `hours[]` / `hoursNote` | `{ days, time, schema? }` (schema like `Mo-Fr 08:00-18:00`) | empty |
| `phone` | `+1` and 10 digits; used for call, text, vCard, decal | **empty (blocker)** |
| `email` | Quote answers and footer | `lockerbox.us@gmail.com` |
| `domain` / `temporaryUrl` | Real address (no `https://`) / the `pages.dev` address until then | empty |
| `links` | `booking`, `deposit`, `googleReview` | empty |
| `socials[]` | `{ label, url }` | empty |
| `credentials` | `licenses[] { label, number }`, `insurance`, `warranty` | all empty (warranty off on purpose) |
| `van.bringsOwnPower` | Shows "Brings its own power" | `false` |
| `promises` | `upfrontPricing`, `cleanUp` (shown under "Why hire me") | both `true` |
| `owner` | `{ name, photo, note }` | Kevin, no photo |
| `photos` | `van`, `vanWebp` (srcset), `vanAlt`, `gallery[] { src, caption, width, height }`, `videos[] { src, poster, caption }` | 4 photos, 2 videos |
| `rating` / `reviews[]` | Real Google score / exact reviews | empty |
| `vanOffer` | `{ headline, terms }`, only on `/van` | empty |
| `faq` | `estimates, payment, deposits, cancellations, warranty, travelFee, minimum, extras` | payment, travel fee, minimum set |
| `web3formsKey` | Public form key | empty |
| `cloudflareAnalyticsToken` | Public Web Analytics token | empty |
| `cloudflareProject` | Cloudflare Pages project name | `trades-landing` |

**Publishing blockers** (`todos()` in `src/lib/derive.ts`): name, phone, whatIDo, at least one service,
area summary, and own USDOT/TxDMV numbers whenever a moving service is listed. While any blocker is blank,
every page also carries `noindex` so Google doesn't list an unfinished site.

### Commands (`package.json`)

| Command | Does |
|---|---|
| `npm run dev` | Astro dev server on all interfaces (port 4321) |
| `npm run build` | Static build into `dist/` (or `OUT_DIR`) |
| `npm run preview` | Serve the last build |
| `npm run todo` | List blanks; blockers first |
| `npm run images` | Logo sizes, favicon, apple-touch-icon and `public/og.png` from `brand-source/` + config (needs Playwright's Chromium) |
| `npm run qr` | `qr/van-qr.svg` + `.png` for `https://<domain>/van`; refuses without a domain |
| `npm run decal` | `qr/van-decal.pdf/.png`, or the PREVIEW png until ready |
| `npm test` | Builds sample and real versions, serves both with Cloudflare's local server, runs the checks |
| `npm run deploy` | Blocker check → images → build → create project if needed → `wrangler pages deploy` |

### Environment variables

| Variable | Used by | Meaning |
|---|---|---|
| `SAMPLE_DATA=1` | build | Use the made-up data in `src/data/sample.ts` (tests and layout previews only; shows a yellow SAMPLE bar and is always `noindex`) |
| `OUT_DIR` | build | Output folder (tests use `dist-sample`, `dist-real`) |
| `ALLOW_INCOMPLETE=1` | deploy | Publish despite blockers |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | deploy (wrangler) | Headless login; keep in the shell profile, never in the repo |
| `QR_DOMAIN`, `QR_DIR` | qr | Override the domain / output folder (testing) |
| `DECAL_PHONE`, `DECAL_DOMAIN`, `DECAL_BASE` | decal | Layout testing with fake values (skips the moving hold) |
| `SHOTS` | test | Screenshot folder (default `test-shots/`, git-ignored) |

### Pages and generated files

| Path | Source | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` → `Landing.astro` | JSON-LD here only |
| `/van` | `src/pages/van.astro` → `Landing scan` | Banner + offer, canonical `/`, leads tagged "Van QR code", texts start "Hi, I scanned your van." |
| `/thanks` | `src/pages/thanks.astro` | Web3Forms return page, `noindex` |
| `/privacy` | `src/pages/privacy.astro` | Sections appear only for services actually in use |
| `/404` | `src/pages/404.astro` | Call/Text buttons, `noindex` |
| `_redirects` | `scripts/site-files.ts` | `/book`, `/pay`, `/review` → 302 |
| `_headers` | same | nosniff, referrer policy, `X-Frame-Options: DENY`, year-long cache on `/_astro/*`, vCard type |
| `robots.txt`, `sitemap.xml` | same | Sitemap lists `/` and `/privacy` (needs a site URL) |
| `contact.vcf` | same | Only when a phone is set |

---

## 3. Specification

The original brief, as built:

- **Audience:** someone who just scanned the van on a phone, often outdoors. Within seconds they must be
  able to call, text, book or ask for a quote.
- **Page order:** hero (name, what and where, rate, trust line, Book / Get a quote / Call / Text, van photo)
  → services by trade (name, price, description, button) → care plans (if any) → how it works (3 steps) →
  why hire me (eSprinter, upfront pricing, clean-up, plus warranty/insurance only when set) → recent work
  (photos and looping videos, no visible titles) → reviews (real only, hidden if none) → service area and
  hours → FAQ (+ Pay a deposit) → quote survey + "Text me photos instead" → footer (phone, email, hours,
  area, licenses, socials, privacy). A sticky Call / Text / Book (or Quote) bar sits at the bottom on phones.
- **Never fake info.** Anything not supplied is a TODO in the config and is hidden on the site. No invented
  reviews, credentials, years in business or guarantees. Sample data exists only for tests and is marked.
- **Never collect card info.** Booking and deposits are links to Square.
- **Plain links first.** Call (`tel:`), Text (`sms:`) and Book are ordinary links that work without JavaScript.
  Without JavaScript the survey shows as one long form.
- **The van:** all-electric Mercedes eSprinter, 170" wheelbase: quiet, no exhaust, no idling.
  "Brings its own power" is a toggle, off by default.
- **Quality bars:** works at 360-430 px with no sideways scroll; tap targets at least 48 px; readable in
  bright sun (navy/white/red, large condensed type); Lighthouse mobile 95+ for performance, accessibility
  and SEO; no console errors.
- **SEO:** most specific LocalBusiness type, `areaServed`, no street address, title and description from
  config, OG image (1200×630), favicon, sitemap, robots, canonical. Cloudflare Web Analytics (cookie-free)
  when a token is set.
- **Secrets:** scoped API tokens in env vars only; nothing secret is committed.

---

## 4. Architecture

```
src/data/business.ts ──► src/lib/derive.ts ──► src/components/*.astro ──► Astro static build ──► dist/
   (all content)          (links, text, todos,     (Landing, QuoteForm,        + scripts/site-files.ts
src/data/sample.ts         JSON-LD, blockers)       Footer, Icon)                (_redirects, _headers,
   (SAMPLE_DATA=1 only)                            src/layouts/Base.astro         robots, sitemap, vCard)
                                                                                      │
                                                     npm run deploy ── wrangler ──► Cloudflare Pages
```

- **Static site, no server.** Astro 7 (`build.format: 'file'`, `trailingSlash: 'never'`, CSS inlined into
  each page) and Tailwind 4 through `@tailwindcss/vite`. One display font (Barlow Condensed 800, self-hosted
  via `@fontsource`, preloaded); body text uses the system font.
- **One config, one derivation layer.** Templates never read raw config for decisions; `derive.ts` works out
  every link (`telHref`, `smsHref()`, `bookUrl()`), text (`priceText()`, `pageTitle()`, `metaDescription()`),
  structured data (`jsonLd()`), and what's missing (`todos()`). Every section is wrapped in a check, so
  blank config hides it.
- **JavaScript is optional and inline.** Two small scripts: the survey stepper (`QuoteForm.astro`) and the
  video autoplay (`Landing.astro`). No framework runtime is shipped.
- **Images:** the hero van photo has WebP sizes (640/960/1200) with `fetchpriority="high"`; gallery images
  lazy-load; video covers load only near the viewport and videos download only when scrolled to.
- **Hosting:** Cloudflare Pages free plan. Redirects and headers are Pages' `_redirects` / `_headers` files,
  generated after each build by an Astro integration (`scripts/site-files.ts`).
- **Scripts are TypeScript run directly by Node 26** (built-in type stripping), so imports carry `.ts`
  extensions and there's no compile step.

### File map

| Path | Purpose |
|---|---|
| `src/data/business.ts` | All business content |
| `src/data/types.ts` | Config types |
| `src/data/sample.ts` | Fake data for tests and layout previews |
| `src/lib/derive.ts` | Everything computed from the config |
| `src/components/Landing.astro` | Home and `/van`: all sections, sticky bar, video script |
| `src/components/QuoteForm.astro` | Four-step survey and its script |
| `src/components/Footer.astro`, `Icon.astro` | Footer; four inline SVG icons |
| `src/layouts/Base.astro` | `<head>`: meta, OG, noindex rule, colors, analytics |
| `src/styles/global.css` | Theme tokens, buttons, survey, FAQ |
| `src/assets/van.svg` | Fallback van drawing when there's no photo |
| `src/pages/` | `index`, `van`, `thanks`, `privacy`, `404` |
| `scripts/` | `site-files`, `todo`, `qr`, `images`, `decal`, `deploy`, `test` |
| `brand-source/locker-box-logo.png` | Original logo (1254 px) |
| `public/` | Van photos (`img/`), logo sizes (`brand/`), work photos and videos (`work/`), icons, `og.png` |
| `qr/` | QR and decal output |

### Dependencies

Runtime build: `astro`, `tailwindcss`, `@tailwindcss/vite`, `@fontsource/barlow-condensed`.
Tooling: `wrangler` (deploy and local Pages server), `playwright` (tests, OG image, decal PDF),
`qrcode`, `sharp` (logo and icon sizes). Node 26.

---

## 5. Reusable pieces and outside services

This site has **no API of its own** (no server). These parts are general and easy to lift into other projects:

| Piece | Where | What it solves |
|---|---|---|
| Prefilled SMS links | `smsHref()` in `derive.ts` | `sms:+1XXXXXXXXXX?&body=...` is the one form that opens with the body filled in on both iPhone and Android |
| Config → "todo / blocker" pattern | `todos()` + `scripts/deploy.ts` + `Base.astro` | One list drives the `todo` command, blocks deploys and adds `noindex` while required facts are missing; blank values hide UI |
| Multi-step survey without a backend | `QuoteForm.astro` | Branching questions per job kind, step validation with native `reportValidity()`, preselect from any `[data-service]` button, sends via `mailto:`/`sms:` with a readable summary, or posts to Web3Forms; degrades to a plain form without JS |
| Polite autoplay video | script in `Landing.astro` | Loads covers within 400 px of view, plays muted at 25% visible, pauses off screen, tap/Enter to pause, keeps controls for reduced-motion or when autoplay is refused |
| Pages files from config | `scripts/site-files.ts` | Astro integration writing `_redirects`, `_headers`, robots, sitemap and a vCard after build |
| Print-ready sign with overflow check | `scripts/decal.ts` | HTML → PDF at real inches with Playwright; refuses if any text leaves the page |
| QR to spec | `scripts/qr.ts` | SVG + 2048 px PNG, ECC Q, 4-module quiet zone; refuses without a real domain |
| OG image from HTML | `scripts/images.ts` | Renders a 1200×630 link preview with an embedded font; also cleans an off-white logo background |
| Phone-size test harness | `scripts/test.ts` | Builds two variants, serves them with `wrangler pages dev` (so redirects/headers are real), checks layout, tap targets, no-JS, redirects, and that blank config stays hidden |

Outside services used (all optional; none hold secrets in the repo):

| Service | How it's used | Cost |
|---|---|---|
| Cloudflare Pages | Hosting (`wrangler pages deploy`) | Free |
| Cloudflare Web Analytics | `beacon.min.js` with a public token; no cookies | Free |
| Web3Forms | Form `POST https://api.web3forms.com/submit` with `access_key`, `subject`, `from_name`, `redirect`, `botcheck` | Free ~250/month |
| Square | Plain links: Appointments (`/book`), payment link (`/pay`), subscriptions (`plans`) | Square's fees |
| Google | Review link (`/review`), Business Profile (manual) | Free |

Also made in this session for another project: `~/claude/sidequest/qr/sidequest-qr.svg` and `.png`, a QR for
`https://sidequest.cc.middlematter.com/`.

---

## 6. Testing and quality

`npm test` (104 checks, last run 2026-11-15, all passing) builds:

- **sample** (`SAMPLE_DATA=1`, everything filled with marked fake data) to check every section, at 360, 390
  and 430 px: no sideways scroll, tap targets ≥ 48 px, no console errors, sticky bar, hero buttons above the
  fold, service buttons preselecting the survey, Web3Forms fields and honeypot, no card fields, no-JS links,
  `/van` banner/offer/canonical/lead tag, JSON-LD, OG, 302 redirects on Cloudflare's server, 404, sitemap, vCard;
- **real** (your config) to check the survey end to end in mailto mode, video autoplay/loop/pause/tap,
  reduced motion, FAQ answers, that blank sections stay hidden, no sample data, no old names or the old DOT
  number, warranty off the page, the moving hold, and `noindex` while blockers remain.

Screenshots land in `test-shots/`. Some real-config checks name current content (e.g. "Kevin", "$75 trip
fee", the 3-hour example), so update them in `scripts/test.ts` when that content changes.

**Lighthouse (mobile, real config, 2026-11-04 after the autoplay change, 3 runs on this Mac):**
performance 99 / 96 / 88, accessibility 100, SEO 100, LCP 2.0-2.7 s, transfer 461 KiB (325 KiB before
autoplay). `/van` scores SEO 92 by design (its canonical points to `/`). Not yet measured on the live site.

**Not yet tested:** a real iPhone or Android (autoplay, Low Power Mode, `sms:` body), Web3Forms submission,
the live Cloudflare deploy, print output of the decal.

---

## 7. Status and next steps

### Where things stand (2026-11-15)

- Site complete against the real config; git repo `~/claude/trades-landing` (branch `main`, pushed to the public repo
  https://github.com/kevrkid/trades-landing). Nothing deployed; Cloudflare not logged in (`wrangler login` timed out once while waiting).
- A private preview artifact exists but is out of date (before the autoplay change):
  https://claude.ai/artifact/7Xvsi6WCUvyZ7HGFpQy28i
- Local review server, when running: `npx wrangler pages dev dist-sample --port 8850 --ip 0.0.0.0`
  (http://localhost:8850; phones on the same Wi-Fi use this Mac's LAN address).

### Needed from Kevin

1. ~~Phone number~~ done 2026-11-16: (512) 791-3853.
2. **Moving:** taken off the page 2026-11-16 to go live (headline now "Welding, hauling and tear-downs"). To bring it
   back, add the TxDMV household-goods number and restore the lines named in the comment by `headline` in business.ts. The old DOT 9994372 belongs to Investment Services
   Group, LLC and was removed.
3. **Cloudflare sign-in** at dash.cloudflare.com, then `npx wrangler login`.
4. **Domain:** buy `lockerboxtx.com` → `npm run qr`, `npm run decal`, custom domain in Cloudflare.
5. Answers that unlock hidden parts: hours; base town for the 30-mile free-travel radius; free estimates?;
   deposits and cancellation policy (e.g. 24 hours); extras (dump fees, materials); insurance in your name;
   a photo of you; whether any work photos are before/after pairs; a larger or vector logo for print;
   approval of any monthly plan.

### Next steps for whoever picks this up

1. When the phone and moving decision arrive: edit config, `npm test`, look at `test-shots/real-390-full.png`, deploy.
2. After deploy: Lighthouse on the live URL (three runs), real-phone check of autoplay and the Text links,
   then republish the preview or retire it.
3. Optional: Web3Forms key, Square booking/deposit links, Google Business Profile + review link, Web Analytics
   token, van offer.
4. Consider the review items in section 9 that weren't fixed.

---

## 8. Decisions log

| Date | Decision | Why |
|---|---|---|
| 11-04 | Astro static + Tailwind on Cloudflare Pages | Fast, free, no server to maintain |
| 11-04 | Square booking is a link, not an embed | The embed loads a large outside script and would slow the page |
| 11-04 | No photo upload in the form | Web3Forms' free plan has no uploads; "Text me photos" is simpler and works everywhere |
| 11-04 | One hourly rate, $60-$100, on every service, with a worked example | Owner's choice; competitors that show prices up front convert better |
| 11-04 | Travel free within 30 miles, then $75; 2-hour minimum; card, cash or Zelle | Owner asked for competitor-typical defaults |
| 11-04 | Name Locker Box with the owner's logo; colors taken from it | Owner's choice (earlier working names Rangebolt and Arc & Haul dropped) |
| 11-04 | Service area "Central Texas", moves anywhere in Texas | Owner's choice |
| 11-04 | Own survey form, mailto/sms by default | Works with no account; Web3Forms optional |
| 11-04 | Warranty off the page | Owner's choice |
| 11-04 | ISG LLC DOT number removed; insurance claim hidden until in the owner's name | That DOT belongs to the owner's mother's company |
| 11-04 | Photo/video titles removed; videos autoplay muted on a loop | Owner's request; browsers only autoplay muted video |
| 11-15 | Publishing and the printable decal blocked while moving is listed without own USDOT/TxDMV | Keeps the promise not to advertise moving before registration |
| 11-15 | Tap/Enter pauses a video | Accessibility: moving content needs a way to stop it |
| 11-15 | `BRAND_PROMPT.md` deleted | The ChatGPT brand brief was scrapped and contained facts that are no longer true |
| 11-15 | Added owner's USDOT 4727545 (SAFER: Kevin Kidd, Intrastate Only, Active), a "Business freight runs" service (quoted per run), owner bio, service places Leander/Austin/San Antonio, open-availability hours | Owner supplied details for his B2B Sprinter freight work |
| 11-15 | Moving gate now requires a TxDMV number, not just any license | Texas requires a TxDMV certificate for household-goods moves at any weight; USDOT alone isn't enough |
| 11-16 | Moving taken off the live page until the TxDMV number is issued; headline now "Welding, hauling and tear-downs" | Go live now without advertising a service that needs a permit not yet held |
| 11-16 | Per-service prices replace the single $60-$100 rate: welding $95-$125/hr, material delivery $85-$120/hr, tear-down $60-$100/hr, junk from $150, freight from $95 (Triangle runs ~$2.50-$3/mi) | Austin-area research 11-16: mobile welding $85-$150/hr, cargo van service $90-$150/hr, haulers ~$300 minimum; owner wants to match or slightly beat competitors |
| 11-16 | Dump fees and landfill per-item fees charged at cost with the receipt | 2026 TDS rates: Georgetown $33 pickup minimum, Creedmoor $66 minimum + $12/yd; a full van load is ~$270-$325 to dump, so it can't be built into a flat price |
| 11-16 | Service area: the Texas Triangle, based in Leander | Owner's request |
| 11-16 | Brand split (live 11-17; Locker Box half reverted the same day, freight page kept): Locker Box trade services at `/` and `/van` (navy + gold #FFC72C), Chalkline Freight job-site delivery at `/freight` (navy + orange #F26A1B), from `reference/*-reference.html` | Owner's brief. Freight name lives only in `src/data/freight.ts` (trademark search pending); shared look in `src/styles/brand.css` + `src/layouts/Brand.astro` |
| 11-16 | Kept the 11-16 email (lockerbox.us) and per-service prices instead of the brief's lockerbox.tx / flat $60-$100 | Both were changed earlier the same day; the brief predates them. Owner said "continue with the plan" after being told |
| 11-16 | Locker Box keeps its multi-step quote survey (restyled) instead of the reference's shorter form | Brief: never drop a field the current form sends. Freight form keeps every old freight field plus date, pieces, weight, company, email |
| 11-16 | "Photo proof of delivery" and "text updates" on /freight behind `showPhotoProof` / `showTextUpdates` in freight.ts | Owner must confirm before deploy |

---

## 9. Code review (2026-11-15)

A full read of every source file, script and test, plus `npm test`, `npm run todo`, the decal and a deploy dry run.

### Fixed in this pass

| Issue | Fix |
|---|---|
| Nothing stopped a deploy or a printable decal that advertises moving before registration | New blocker in `todos()`; decal stays a preview; test added |
| Autoplaying videos had no way to pause them (WCAG 2.2.2) | Tap or Enter/Space pauses and resumes; a paused clip stays paused when scrolled back; tests added |
| Privacy page talked about Square even with no Square links | That section now shows only when a Square link is set; test added |
| `sharp` was used by `npm run images` (part of every deploy) but only installed as a side effect of Astro | Declared in `devDependencies` |
| Test label "videos wait until tapped" no longer true | Renamed |

### Open findings (not fixed)

| Severity | Finding | Suggestion |
|---|---|---|
| Medium | `welding-cut.mp4` is 7.6 MB and `welding-weld.mp4` 3.7 MB, and both still carry an audio track though they play muted with no controls. That's heavy on mobile data for anyone who scrolls to them. | Re-encode at a lower bitrate without audio (target under 2 MB each) |
| Medium | One Lighthouse run scored 88 for performance (target 95) and page weight rose to 461 KiB after autoplay; cause not confirmed (likely Lighthouse's full-page capture triggering the videos). | Measure on the live site; if real, delay autoplay until the first scroll |
| Medium | Without JavaScript and without a Web3Forms key, the form submits as a `mailto:` POST, which many phone browsers ignore. | Acceptable while Call/Text links exist; a Web3Forms key removes it |
| Low | Images under `public/work`, `public/img` and `public/brand` get Cloudflare's default short cache. | Add a 1-week `Cache-Control` for those paths in `_headers` (rename files when they change) |
| Low | Several real-config tests check specific current content, so editing the config can fail tests that aren't bugs. | Read those values from `business` instead of literals |
| Low | Decal words are hard-coded in `scripts/decal.ts`, not taken from the config. | Derive from service kinds if the services change often |
| Low | The privacy page doesn't mention that Cloudflare, as host, sees visitors' IP addresses in normal server logs. | Add one sentence before launch |
| Low | `address` uses `autocomplete="postal-code"` though the label allows a full address. | Fine for ZIP; switch to `street-address` if full addresses are preferred |

### Checked and fine

No secrets in the repo or its history; `.env*`, build folders and `.wrangler/` are ignored. No card fields
anywhere. All call/text/book actions are plain links. Blank config consistently hides its section (tested).
JSON-LD has no street address and only appears on `/`. The `/van` canonical, lead tagging and offer work.
Redirects fall back to home instead of a dead link. The decal and QR refuse to produce printable output
without real data.
