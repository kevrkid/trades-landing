// ALL business content lives in this one file.
// Change a value, then run:  npm run deploy
//
// Blank ('' or []) means "not set": that piece stays hidden on the live site.
// Never put made-up info here. `npm run todo` lists everything still blank.
import type { Business } from './types.ts';

export const business: Business = {
  // ---------- WHO ----------
  name: '', // TODO: business name
  logo: '', // TODO (optional): put the file in public/ and write e.g. '/logo.svg'
  whatIDo: '', // TODO: a few words, e.g. 'Plumbing and home repairs'

  // Navy + safety orange, proposed. Change these to match the van wrap.
  colors: { brand: '#0B2545', brandDeep: '#071A33', accent: '#FF7A00', accentInk: '#0B1B33' },

  // TODO: the most specific type for your trade, for Google. Options: Plumber, Electrician,
  // HVACBusiness, Locksmith, HousePainter, RoofingContractor, GeneralContractor.
  // This default fits any home-service trade.
  schemaType: 'HomeAndConstructionBusiness',

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
  // price type: 'flat' | 'from' (both need amount) | 'estimate' (free estimate) | 'none'
  trades: [],

  // TODO (recommended, this is your steady income): a monthly or yearly care plan.
  // Copy this shape:
  // { name: 'Home Care Plan', price: '$29/month', description: 'One line.',
  //   includes: ['Yearly check-up', '10% off repairs'], signupUrl: 'Square subscription link' }
  plans: [],

  // ---------- WHERE AND WHEN ----------
  area: {
    summary: '', // TODO: e.g. 'Austin and Round Rock'
    places: [], // TODO: e.g. ['Austin', 'Round Rock', 'Pflugerville']. Also used for Google.
  },
  hours: [], // TODO: e.g. { days: 'Mon-Fri', time: '8 AM-6 PM', schema: 'Mo-Fr 08:00-18:00' }
  hoursNote: '', // TODO (optional): e.g. 'After-hours emergencies by text'

  // ---------- CONTACT ----------
  phone: '', // TODO: with country code, e.g. '+15125550100'. Used for both call and text.
  email: '', // TODO: shown in the footer

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
    licenses: [], // TODO: e.g. { label: 'Texas Master Plumber', number: 'M-00000' }
    insurance: '', // TODO: e.g. 'Fully insured'
    warranty: '', // TODO: e.g. '1-year warranty on labor'
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
    name: '', // TODO: your first name
    photo: '', // TODO: e.g. '/photos/me.jpg'
    note: '', // TODO: a sentence or two in your own words
  },
  photos: {
    van: '/img/van-1200.jpg',
    vanWebp: '/img/van-640.webp 640w, /img/van-960.webp 960w, /img/van-1200.webp 1200w',
    vanAlt: 'White all-electric Mercedes eSprinter van parked on a sunny street',
    gallery: [], // TODO: { before: '/photos/1a.jpg', after: '/photos/1b.jpg', caption: 'What you did' }
  },

  // ---------- REVIEWS (real ones only, exact wording) ----------
  reviews: [], // TODO: { text: '...', name: 'Maria G.', source: 'Google', stars: 5 }

  // ---------- OFFER FOR PEOPLE WHO SCAN THE VAN ----------
  vanOffer: {
    headline: '', // TODO (optional): e.g. '$25 off your first job'
    terms: '', // TODO (optional): e.g. 'Mention the van when you book. Jobs over $150.'
  },

  // ---------- FAQ (a blank answer hides that question) ----------
  faq: {
    estimates: '', // TODO: Are estimates free?
    payment: '', // TODO: e.g. 'Card, Apple Pay or cash. Invoices come as a Square link.'
    deposits: '', // TODO: When is a deposit needed, and is it refundable?
    cancellations: '', // TODO: Your cancellation policy
    warranty: '', // TODO: What your warranty covers
    travelFee: '', // TODO: Is there a travel fee?
  },

  // ---------- ACCOUNTS ----------
  // Free key from web3forms.com, sent to your email. It's made to be public, so it's safe here.
  // Blank hides the quote form; the page offers Text instead.
  web3formsKey: '', // TODO
  // From Cloudflare > Web Analytics > add site. Public, safe here.
  cloudflareAnalyticsToken: '', // TODO
  cloudflareProject: 'trades-landing',
};
