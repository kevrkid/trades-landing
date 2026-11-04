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
  whatIDo: 'Moving, welding, material hauling, tear-downs and junk removal',
  plans: [{ name: 'Sample Care Plan', price: '$29/month (sample)', description: 'A sample plan, showing where a real one will go.', includes: ['Sample benefit one', 'Sample benefit two'], signupUrl: '' }],
  trades: [
    { name: 'Moving', services: [
      { name: 'Moving in Texas', description: 'Moving your things to their new place.', price: { type: 'from', amount: 150 }, action: 'book' },
    ] },
    { name: 'Welding', services: [
      { name: 'Small welding jobs', description: 'Small welding repairs and projects.', price: { type: 'hourly', min: 60, max: 100 }, action: 'book' },
      { name: 'Sample flat-price job', description: 'Shows how a flat price looks.', price: { type: 'flat', amount: 125 }, action: 'quote' },
    ] },
    { name: 'Tear-down and junk', services: [
      { name: 'Building tear-down', description: 'Taking down a building or structure.', price: { type: 'estimate' }, action: 'quote' },
      { name: 'Junk removal', description: 'Loading up your junk and hauling it away.', price: { type: 'none' }, action: 'quote' },
    ] },
  ],
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
    cancellations: 'Sample answer about cancellations.', warranty: 'Sample answer about warranty.', travelFee: 'Sample answer about travel fee.', minimum: 'Sample answer about minimums.', extras: 'Sample answer about extra fees.',
  },
  web3formsKey: 'sample-key',
};
