// ALL business content lives in this one file.
// Change a value, then run:  npm run deploy
//
// Blank ('' or []) means "not set": that piece stays hidden on the live site.
// Never put made-up info here. `npm run todo` lists everything still blank.
import type { Business } from './types.ts';

// Prices per service, set 11-16 from Austin-area competitor rates (README decisions log).
const WELDING = { type: 'hourly', min: 95, max: 125 } as const;
const DELIVERY = { type: 'hourly', min: 85, max: 120 } as const;
const TEARDOWN = { type: 'hourly', min: 60, max: 100 } as const;

export const business: Business = {
  // ---------- WHO ----------
  // Search the Texas Secretary of State records before printing it.
  name: 'Locker Box',
  // Made from brand-source/locker-box-logo.png by `npm run images`.
  logo: '/brand/locker-box-logo.webp',
  logoOnLight: '/brand/locker-box-logo.png',
  // Moving is off until the TxDMV household-goods number is issued (2026-11-16). Then restore
  // headline 'Moving anywhere in Texas', the Moving trade below, schemaType 'MovingCompany', area.note and the travel-fee line.
  headline: 'Welding, steel buildings, tear-downs, and junk removal',
  subheading: '', // Blank: no extra line under the van photo.
  whatIDo: 'Welding, steel frames and metal buildings, material delivery, tear-downs and junk removal',
  rate: '', // Blank: prices differ by service, so each service card shows its own.
  // Update this if the rate changes: 3 x $60 and 3 x $100.
  rateExample: '',

  colors: { brand: '#0A1F44', brandDeep: '#001126', accent: '#C8102E', accentInk: '#FFFFFF' },

  // The type Google sees. Back to 'MovingCompany' once moving returns.
  schemaType: 'LocalBusiness',

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
    { name: 'Welding', services: [
      { name: 'Small welding jobs', kind: 'welding', description: 'Repairs and small fabrication on site. Travel within 30 miles is free.',
        price: WELDING, action: 'quote' },
      { name: 'Steel frames and metal buildings', kind: 'steel', description: 'Frames, carports, shops and metal buildings, built on site.',
        price: { type: 'quote' }, action: 'quote' },
    ] },
    // Business freight now lives on the freight brand page (/freight, src/data/freight.ts).
    { name: 'Building materials', services: [
      { name: 'Building material delivery', kind: 'materials', description: 'I pick up and deliver building materials.',
        price: DELIVERY, action: 'quote' },
    ] },
    { name: 'Tear-down and junk', services: [
      { name: 'Building tear-down', kind: 'teardown', description: 'Sheds, carports, fences and small buildings, taken down and hauled off. Dump fees are charged at cost.',
        price: TEARDOWN, action: 'quote' },
      { name: 'Junk removal', kind: 'junk', description: 'I load it and haul it away. Dump fees, and the landfill\'s fees for mattresses, couches and appliances, are charged at cost with the receipt.',
        price: { type: 'from', amount: 150 }, action: 'quote' },
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
    summary: 'the Texas Triangle', // Owner, 11-16. Reads "in the Texas Triangle" / "Serving the Texas Triangle".
    note: 'Based in Leander.',
    places: ['Austin', 'San Antonio', 'Houston', 'Dallas-Fort Worth'], // Also used for Google. Base: Leander (FMCSA record).
  },
  hours: [{ days: 'Every day', time: 'Open availability' }], // Owner said "open availability" (11-15)
  hoursNote: 'Call or text to schedule, including early starts.',

  // ---------- CONTACT ----------
  phone: '+15127913853', // Used for both call and text.
  email: 'lockerbox.us@gmail.com', // Owner, 11-16.

  // ---------- WEB ADDRESS ----------
  domain: '', // TODO: e.g. 'example.com' (no https://). Then run: npm run qr
  temporaryUrl: 'https://trades-landing-321.pages.dev', // Until the domain is set up.

  // ---------- LINKS ----------
  links: {
    booking: '', // TODO: Square Appointments booking site. /book goes here.
    deposit: '', // TODO: Square payment link. /pay goes here.
    googleReview: '', // TODO: Google review link. /review goes here.
  },
  socials: [], // TODO (optional): e.g. { label: 'Instagram', url: 'https://...' }

  // ---------- CREDENTIALS (only what's true) ----------
  credentials: {
    // Your own numbers, in your name. USDOT 4727545 = Kevin Kidd, Intrastate Only, Active (SAFER, 11-15).
    // Add { label: 'TxDMV', number: '...' } once issued: Texas needs it to move household goods.
    licenses: [{ label: 'USDOT', number: '4727545' }],
    insurance: 'Commercially insured', // Owner, 11-16: certificate available on request.
    warranty: '', // Left off the page on purpose for now.
  },

  // ---------- THE VAN ----------
  van: {
    // Turn this on once the van battery is installed.
    bringsOwnPower: false,
    // 2025 Mercedes-Benz eSprinter 2500, 170" wheelbase, high roof (owner, 11-16).
    // Height and volume: Mercedes/KBB published specs for this model. Length: measure the floor behind the seats.
    cargoHeight: '79 inches', // KBB: 79.1" interior cargo height, eSprinter high roof
    cargoVolume: '488 cubic feet', // mbvans.com/en/esprinter: 488.1 cu ft, 170" high roof
    cargoLength: '', // TODO: measured floor length behind the seats, e.g. '14 feet (170 inches)'
  },

  // ---------- PROMISES ----------
  // You listed these as selling points. Set to false if they ever stop being true.
  promises: { upfrontPricing: true, cleanUp: false }, // Owner asked to drop clean-up (11-16).

  // ---------- PHOTOS (owner photo in public/photos/, job photos and videos in public/work/) ----------
  owner: {
    name: 'Kevin Kidd',
    photo: '', // TODO: e.g. '/photos/me.jpg'
    note: "Hi, I'm Kevin Kidd, the owner of Locker Box. I'm a registered Texas carrier (USDOT 4727545). I build steel frames and metal buildings, weld on site, and haul materials and freight for businesses across the Texas Triangle.",
  },
  photos: {
    van: '/img/van-1200.jpg',
    vanWebp: '/img/van-640.webp 640w, /img/van-960.webp 960w, /img/van-1200.webp 1200w',
    vanAlt: 'White all-electric Mercedes eSprinter van parked on a sunny street',
    // Real jobs. Add more by copying a line. Files live in public/work/.
    // These three are the same building, in build order (owner, 11-16).
    // The first photo shows large, the rest in a row underneath.
    gallery: [
      { src: '/work/metal-building-finished.webp', caption: 'Finished metal building with sliding doors', width: 1400, height: 1050 },
      { src: '/work/steel-frame.webp', caption: 'Steel frame', width: 900, height: 675 },
      { src: '/work/metal-building.webp', caption: 'Front of the finished building, with the walk-in door', width: 900, height: 675 },
      { src: '/work/metal-building-inside.webp', caption: 'Inside the finished building', width: 900, height: 675 },
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
    travelFee: "Travel is free within 30 miles. Farther than that, there's a $75 trip fee, and I'll confirm it before booking. Long runs across Texas are quoted by the trip, including drive time.",
    minimum: "Hourly jobs have a 2-hour minimum. Junk removal starts at $150, and freight runs start at $95.",
    extras: "Dump fees, plus the landfill's fees for mattresses, couches and appliances, are charged at cost, with the receipt.",
  },

  // ---------- ACCOUNTS ----------
  // Free key from web3forms.com, sent to your email. It's made to be public, so it's safe here.
  // Blank: the survey opens the customer's own email or text app with the answers filled in.
  web3formsKey: '', // TODO
  // From Cloudflare > Web Analytics > add site. Public, safe here.
  cloudflareAnalyticsToken: '', // TODO
  cloudflareProject: 'trades-landing',
};
