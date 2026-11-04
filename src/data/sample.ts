// FAKE data, only for previewing the layout and for tests (SAMPLE_DATA=1).
// It is never used by `npm run deploy`. Edit business.ts, not this.
import { business } from './business.ts';
import type { Business } from './types.ts';

const pic = (label: string, bg: string) =>
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${bg}"/>` +
    `<text x="200" y="160" font-family="sans-serif" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">SAMPLE ${label}</text></svg>`);

export const sample: Business = {
  ...business,
  name: 'Sample Trades Co.',
  whatIDo: 'Plumbing and home repairs',
  trades: [
    { name: 'Plumbing', services: [
      { name: 'Faucet replacement', description: 'Old one out, new one in, tested for leaks.', price: { type: 'from', amount: 150 }, action: 'book' },
      { name: 'Water heater install', description: 'Tank or tankless, old unit hauled away.', price: { type: 'estimate' }, action: 'quote' },
    ] },
    { name: 'Home repairs', services: [
      { name: 'One-hour repair visit', description: 'A list of small fixes, done in one visit.', price: { type: 'flat', amount: 125 }, action: 'book' },
      { name: 'Drywall patch', description: 'Patched, sanded and ready for paint.', price: { type: 'none' }, action: 'quote' },
    ] },
  ],
  plans: [{ name: 'Home Care Plan', price: '$29/month', description: 'A yearly check-up and a better rate on everything else.', includes: ['Yearly home check-up', '10% off repairs', 'First in line when you text'], signupUrl: '' }],
  area: { summary: 'Sampletown and nearby', places: ['Sampletown', 'Exampleville', 'Testburg'] },
  hours: [{ days: 'Mon-Fri', time: '8 AM-6 PM', schema: 'Mo-Fr 08:00-18:00' }, { days: 'Sat', time: '9 AM-2 PM', schema: 'Sa 09:00-14:00' }],
  hoursNote: 'After-hours emergencies by text.',
  phone: '+15125550100',
  email: 'hello@example.com',
  domain: 'example.com',
  links: { booking: 'https://example.com/square-booking', deposit: 'https://example.com/square-deposit', googleReview: 'https://example.com/google-review' },
  socials: [{ label: 'Instagram', url: 'https://example.com/instagram' }],
  credentials: { licenses: [{ label: 'Sample license', number: 'SAMPLE-000' }], insurance: 'Fully insured (sample)', warranty: '1-year warranty on labor (sample)' },
  owner: { name: 'Sam', photo: pic('OWNER', '#35506f'), note: 'Sample note: this is where a sentence in your own words goes.' },
  photos: { ...business.photos, gallery: [{ before: pic('BEFORE', '#7a5a45'), after: pic('AFTER', '#2f7a57'), caption: 'Sample job caption' }] },
  reviews: [{ text: 'This is a sample review, showing where a real one will go.', name: 'Sample C.', source: 'Google', stars: 5 }],
  vanOffer: { headline: '$25 off your first job (sample)', terms: 'Sample terms go here.' },
  faq: {
    estimates: 'Sample answer about estimates.', payment: 'Sample answer about payment.', deposits: 'Sample answer about deposits.',
    cancellations: 'Sample answer about cancellations.', warranty: 'Sample answer about warranty.', travelFee: 'Sample answer about travel fee.',
  },
  web3formsKey: 'sample-key',
};
