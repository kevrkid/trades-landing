// ALL business content lives in this one file.
// Change a value, then run:  npm run deploy
//
// Blank ('' or []) means "not set": that piece stays hidden on the live site.
// Never put made-up info here. `npm run todo` lists everything still blank.
import type { Business } from './types.ts';

// Your hourly rate, used on every service below. Change it here to change them all.
const HOURLY = { type: 'hourly', min: 60, max: 100 } as const;

export const business: Business = {
  // ---------- WHO ----------
  // Search the Texas Secretary of State records before printing it.
  name: 'Locker Box',
  // Made from brand-source/locker-box-logo.png by `npm run images`.
  logo: '/brand/locker-box-logo.webp',
  logoOnLight: '/brand/locker-box-logo.png',
  headline: 'Moving anywhere in Texas',
  subheading: 'All-electric van',
  whatIDo: 'Moving, welding, material hauling, tear-downs and junk removal',
  rate: '$60-$100/hour',
  // Update this if the rate changes: 3 x $60 and 3 x $100.
  rateExample: 'For example, 3 hours of work comes to $180-$300.',

  colors: { brand: '#0A1F44', brandDeep: '#001126', accent: '#C8102E', accentInk: '#FFFFFF' },

  // The most specific type for Google. Moving is your top priority, so this says MovingCompany.
  schemaType: 'MovingCompany',

  // ---------- SERVICES ----------
  // TODO: your services, grouped by trade. Copy this shape:
  // {
  //   name: 'Plumbing',
  //   services: [
  //     { name: 'Faucet replacement', description: 'Old one out, yours in, leak-tested.',
  //       price: { type: 'from', amount: 150 }, action: 'book' },
  //     { name: 'Water heater install', description: 'Tank or tankless.',
  //       price: { type: 'estimate' }, action: 'quote' },
  //   ],
  // },
  // price type: 'hourly' (min, max) | 'flat' | 'from' (both need amount) | 'estimate' | 'none'
  // In your priority order.
  trades: [
    { name: 'Moving', services: [
      { name: 'Moving in Texas', kind: 'moving', description: 'I handle moves anywhere in Texas.',
        price: HOURLY, action: 'quote' },
    ] },
    { name: 'Welding', services: [
      { name: 'Small welding jobs', kind: 'welding', description: 'I take on small welding jobs.',
        price: HOURLY, action: 'quote' },
    ] },
    { name: 'Building materials', services: [
      { name: 'Building material delivery', kind: 'materials', description: 'I pick up and deliver building materials.',
        price: HOURLY, action: 'quote' },
    ] },
    { name: 'Tear-down and junk', services: [
      { name: 'Building tear-down', kind: 'teardown', description: 'I take down buildings.',
        price: HOURLY, action: 'quote' },
      { name: 'Junk removal', kind: 'junk', description: 'I pick up and haul away junk.',
        price: HOURLY, action: 'quote' },
    ] },
  ],

  // TODO (recommended, this is your steady income): a monthly or yearly care plan.
  // Copy this shape:
  // { name: 'Home Care Plan', price: '$29/month', description: 'One line.',
  //   includes: ['Yearly check-up', '10% off repairs'], signupUrl: 'Square subscription link' }
  // Ideas from the brand kit, waiting for your OK (each works out to $80-$90/hour):
  //   Property Turnover Block: $360/month, one 4-hour block (furniture, junk, material runs)
  //   Builder Supply Runs: $320/month, two 2-hour material pickup and delivery blocks
  //   Small Welding Block: $180/month, one 2-hour block
  plans: [],

  // ---------- WHERE AND WHEN ----------
  area: {
    summary: 'Central Texas',
    note: 'Moves anywhere in Texas.',
    places: [], // TODO: e.g. ['Austin', 'Round Rock', 'Pflugerville']. Also used for Google.
  },
  hours: [], // TODO: e.g. { days: 'Mon-Fri', time: '8 AM-6 PM', schema: 'Mo-Fr 08:00-18:00' }
  hoursNote: '', // TODO (optional): e.g. 'After-hours emergencies by text'

  // ---------- CONTACT ----------
  phone: '', // TODO: with country code, e.g. '+15125550100'. Used for both call and text.
  email: 'lockerbox.tx@gmail.com',

  // ---------- WEB ADDRESS ----------
  domain: '', // TODO: e.g. 'example.com' (no https://). Then run: npm run qr
  temporaryUrl: '', // Before you have a domain: the https://....pages.dev address.

  // ---------- LINKS ----------
  links: {
    booking: '', // TODO: Square Appointments booking site. /book goes here.
    deposit: '', // TODO: Square payment link. /pay goes here.
    googleReview: '', // TODO: Google review link. /review goes here.
  },
  socials: [], // TODO (optional): e.g. { label: 'Instagram', url: 'https://...' }

  // ---------- CREDENTIALS (only what's true) ----------
  credentials: {
    // TODO: your DOT number: { label: 'USDOT', number: '0000000' }
    // and your TxDMV certificate, if you have one: { label: 'TxDMV', number: '000000' }
    licenses: [{ label: 'USDOT', number: '9994372' }],
    insurance: 'Commercially insured',
    warranty: '', // Left off the page on purpose for now.
  },

  // ---------- THE VAN ----------
  van: {
    // Turn this on once the van battery is installed.
    bringsOwnPower: false,
  },

  // ---------- PROMISES ----------
  // You listed these as selling points. Set to false if they ever stop being true.
  promises: { upfrontPricing: true, cleanUp: true },

  // ---------- PHOTOS (put files in public/photos/) ----------
  owner: {
    name: 'Kevin',
    photo: '', // TODO: e.g. '/photos/me.jpg'
    note: "Hi, I'm Kevin, the owner of Locker Box.",
  },
  photos: {
    van: '/img/van-1200.jpg',
    vanWebp: '/img/van-640.webp 640w, /img/van-960.webp 960w, /img/van-1200.webp 1200w',
    vanAlt: 'White all-electric Mercedes eSprinter van parked on a sunny street',
    // Real jobs. Add more by copying a line. Files live in public/work/.
    gallery: [
      { src: '/work/steel-frame.webp', caption: 'Steel frame', width: 900, height: 675 },
      { src: '/work/building-in-progress.webp', caption: 'Building in progress', width: 900, height: 675 },
      { src: '/work/metal-building.webp', caption: 'Finished metal building', width: 900, height: 675 },
      { src: '/work/metal-building-inside.webp', caption: 'Inside a finished building', width: 900, height: 675 },
    ],
    videos: [
      { src: '/work/welding-cut.mp4', poster: '/work/welding-cut.webp', caption: 'Cutting steel on site' },
      { src: '/work/welding-weld.mp4', poster: '/work/welding-weld.webp', caption: 'Welding on site' },
    ],
  },

  // ---------- REVIEWS (real ones only, exact wording) ----------
  // TODO: your real Google score once you have reviews, e.g. { score: '5.0', count: 12, source: 'Google' }
  rating: { score: '', count: 0, source: '' },
  reviews: [], // TODO: { text: '...', name: 'Maria G.', source: 'Google', stars: 5 }

  // ---------- OFFER FOR PEOPLE WHO SCAN THE VAN ----------
  vanOffer: {
    headline: '', // TODO (optional): e.g. '$25 off your first job'
    terms: '', // TODO (optional): e.g. 'Mention the van when you book. Jobs over $150.'
  },

  // ---------- FAQ (a blank answer hides that question) ----------
  faq: {
    estimates: '', // TODO: Are estimates free?
    payment: 'Card, cash or Zelle.',
    deposits: '', // TODO: When is a deposit needed, and is it refundable?
    cancellations: '', // TODO: Your cancellation policy
    warranty: '', // Left off the page on purpose for now.
    travelFee: "Travel is free within 30 miles. Farther than that, there's a $75 trip fee, and I'll confirm it before booking. Long moves across Texas are quoted by the trip, including drive time.",
    minimum: "Yes, there's a 2-hour minimum.",
    extras: '', // TODO: Anything on top of the hourly rate? e.g. dump fees, materials, stairs
  },

  // ---------- ACCOUNTS ----------
  // Free key from web3forms.com, sent to your email. It's made to be public, so it's safe here.
  // Blank hides the quote form; the page offers Text instead.
  web3formsKey: '', // TODO
  // From Cloudflare > Web Analytics > add site. Public, safe here.
  cloudflareAnalyticsToken: '', // TODO
  cloudflareProject: 'trades-landing',
};
