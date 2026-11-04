# Van landing page

The page people reach by scanning the QR code on the van.

Everything you'd ever change is in one file: **`src/data/business.ts`**.

## Change a service or price

1. Open `src/data/business.ts` and find `trades`.
2. Change the name, description or price. Price is one of:
   - `{ type: 'flat', amount: 150 }` shows "$150"
   - `{ type: 'from', amount: 150 }` shows "From $150"
   - `{ type: 'estimate' }` shows "Free estimate"
   - `{ type: 'none' }` shows no price
3. `action: 'book'` sends people to Square. `action: 'quote'` opens the form with that service picked.
4. Run `npm run deploy`. It's live in about a minute.

Blank values stay hidden on the site. `npm run todo` lists what's still blank.

To turn on "brings its own power" once the van battery is in, set `van.bringsOwnPower` to `true`.

## Put it online

**First time only, on a computer with a browser:** run `npx wrangler login` and click Allow.

**Every time after:** `npm run deploy`

It won't publish until the name, phone, what you do, services and area are filled in, so nobody scanning the van lands on a page they can't act on.

This Mac has Node in `~/.local/node/bin`. Add this line to `~/.zshrc` if `npm` isn't found:
`export PATH="$HOME/.local/node/bin:$PATH"`

### From a server with no browser (Hetzner)

1. On any computer, go to Cloudflare > My Profile > API Tokens > Create Token > Custom token.
2. Give it one permission: Account > Cloudflare Pages > Edit. Limit it to your account.
3. On the server, add these to `~/.bashrc`, then run `npm run deploy` as normal:
   ```sh
   export CLOUDFLARE_API_TOKEN=the-token
   export CLOUDFLARE_ACCOUNT_ID=your-account-id
   ```

Never put the token in a file inside this project. The Web3Forms key and the analytics token are different: they're made to be public, so they belong in `business.ts`.

## After you buy a domain

1. Set `domain` in `business.ts`, then run `npm run deploy`.
2. In Cloudflare > Workers & Pages > `trades-landing` > Custom domains, add the domain.
3. Run `npm run qr`. It makes `qr/van-qr.svg` (for the wrap shop) and `qr/van-qr.png`.
4. Scan the printed proof with your phone before the wrap shop applies it.

## Van decal (for before a full wrap)

Run `npm run decal`. It makes a 24 x 18 inch sign with your logo, phone number, a few words and the QR code, as a PDF for a sign shop or magnet printer. Until your phone number and domain are both in `business.ts`, it only makes a preview marked "PREVIEW, DO NOT PRINT".

## The quote form

The form uses [Web3Forms](https://web3forms.com): free for about 250 submissions a month, no server needed. The free plan doesn't include file uploads, so customers send photos with the "Text me photos" button. Spam protection is a hidden honeypot field. Web3Forms now calls that field deprecated, so if spam gets through, its captcha is the next step.

Get a key by entering your email at web3forms.com, and put it in `web3formsKey`. After the first deploy, send yourself a test request.

## Before you advertise moving

Texas requires TxDMV registration, a USDOT number and filed insurance to move household goods for pay, even in a small vehicle. Check the current rules at txdmv.gov/motor-carriers, then add your number under `credentials.licenses`.

## Short links

| Link | Goes to |
|---|---|
| `/van` | Home page with a thanks banner. The QR code points here. |
| `/book` | `links.booking` |
| `/pay` | `links.deposit` |
| `/review` | `links.googleReview` |

Text `yourdomain/review` to every customer when you finish a job.

Booking links straight to Square instead of embedding it. Square's embed loads a large outside script, which would slow the page down.

## Steady income

The page supports these, but the money comes from doing them consistently:

1. **Sell a care plan.** Add one under `plans`, using a Square subscription link. It's money that arrives whether or not the phone rings.
2. **Ask every customer for a review** with `/review`, the same day.
3. **Set up a free Google Business Profile.** It's where most local searches end up.
4. **Get customers to save your number.** The footer and thank-you page have a "Save my number" button.
5. **Check `/van` in your analytics.** Quote emails from the van are marked "Van QR code", so you can see what the wrap brings in.

## Checking your work

```sh
npm run dev        # preview on this computer
npm test           # checks links, redirects and phone layout, using made-up sample data
npm run images     # redraws the link preview image and icons after a name or color change
```
`npm run deploy` redraws the images itself and never uses the sample data.
