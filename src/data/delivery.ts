// Facts for the delivery pages (/delivery, /industries, /service-area, /safety, /quote, /about
// and the city pages). Contact details, name, email and the form key come from business.ts.
//
// Anything not confirmed is a TODO('...') value. It shows on the page as a yellow [[TODO: ...]]
// marker, keeps every page out of Google, and `npm run deploy` refuses to publish while any is left.
// Replace each one with the real fact, or with '' to drop that line. Never put made-up info here.

export const TODO = (what: string) => `[[TODO: ${what}]]`;
export const isTodo = (v: unknown) => typeof v === 'string' && v.includes('[[TODO');

/** A service level. `offered: 'confirm'` shows it with a TODO until you confirm you offer it. */
export interface Level {
  key: string;
  name: string;
  what: string;
  lead: string;
  best: string;
  offered: true | 'confirm';
}

export const delivery = {
  // ---------- WHO ----------
  // SAFER lists USDOT 4727545 as "Kevin Kidd", Intrastate Only. Fill in how the business is set up.
  legalEntity: TODO('legal entity, e.g. "Kevin Kidd, sole proprietor, doing business as Locker Box" (check your DBA filing)'),
  ownerStory: TODO('2-4 sentences in your own words for /about: why you started the delivery side of the business'),
  base: 'Leander, TX', // City only, never a street address.
  usdot: '4727545',
  // Intrastate Only on SAFER: no MC number is needed for Texas-only runs. Add one here only if you get it.
  mc: '',
  intrastateOnly: true,
  saferUrl: 'https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=4727545',

  // ---------- WHEN ----------
  // business.ts says "open availability". Write the hours you actually answer dispatch calls.
  dispatchHours: TODO('dispatch hours, e.g. "Mon-Sat, 6 AM-8 PM"'),
  afterHours: TODO('after-hours policy, e.g. "Nights and Sundays by arrangement, with an after-hours rate"'),
  responseTime: TODO('how fast you reply to a quote request, e.g. "within 30 minutes during dispatch hours"'),

  // ---------- INSURANCE ----------
  // Set confirmed: true once the policy is active in your name and covers this delivery work.
  insurance: {
    confirmed: false,
    auto: TODO('commercial auto limit, e.g. $1,000,000'),
    cargo: TODO('cargo limit, e.g. $100,000'),
    liability: TODO('general liability limit, e.g. $1,000,000 per occurrence'),
  },

  // ---------- THE VAN ----------
  van: {
    model: 'Mercedes-Benz eSprinter',
    wheelbase: '170-inch wheelbase',
    roof: 'High roof',
    power: 'All-electric',
    cargo: TODO('cargo length x width x height in inches, measured in your van'),
    widthBetweenWheelWells: TODO('width between the wheel wells, in inches'),
    payload: 'Up to 2,300 lb', // From the owner (business.ts, 11-15).
    pallets: 'Up to 3 standard pallets', // From the owner (business.ts, 11-15).
    rearDoor: TODO('rear door opening, width x height in inches'),
    sideDoor: TODO('side door opening, width x height in inches'),
  },
  // Only what you carry. Replace the TODO with a list, e.g. ['Hand truck', 'Ratchet straps and E-track'].
  equipment: [TODO('equipment you actually carry: hand truck, appliance dolly, straps/E-track, moving blankets, PPE, tilt/shock indicators')] as string[],
  // Job-site items. Replace each with a short true statement, or '' to drop it.
  jobSite: {
    ppe: TODO('PPE you carry, e.g. "Hard hat, safety glasses, hi-vis vest, steel-toe boots, gloves"'),
    osha10: TODO('OSHA 10 card: "OSHA 10 (Construction) card" if you have it, else ""'),
    orientations: TODO('site orientations completed, e.g. "Completed site safety orientations at ..." or ""'),
  },
  // Do you ever bring a second person? true / false. While unknown, the two-person card stays off.
  twoPerson: null as boolean | null,
  vetting: TODO('how you vet anyone who rides with you, e.g. "I work alone" or "helpers pass a background check and site orientation"'),

  // ---------- SERVICE LEVELS ----------
  levels: [
    {
      key: 'hotshot', name: 'Hot shot / exclusive use', offered: true,
      what: 'Your load is the only load on board. I drive it straight from pickup to your site gate.',
      lead: TODO('hot shot lead time, e.g. "Rolling within 60-90 minutes around Austin"'),
      best: 'A missing part holding up a crew, or anything that can’t wait for a shared route.',
    },
    {
      key: 'sameday', name: 'Same-day', offered: true,
      what: 'Picked up and delivered the same day, anywhere in the Texas Triangle.',
      lead: TODO('same-day booking cutoff, e.g. "Book by noon for Austin, by 10 AM for Houston or DFW"'),
      best: 'Parts and materials needed today, with a few hours of notice.',
    },
    {
      key: 'scheduled', name: 'Scheduled / next-day', offered: true,
      what: 'Booked ahead and timed to your delivery window or site schedule.',
      lead: TODO('scheduled lead time, e.g. "Book by 5 PM for next-day"'),
      best: 'Planned deliveries, will-call pickups and runs timed to a site window.',
    },
    {
      key: 'dedicated', name: 'Dedicated or on-call routes', offered: 'confirm',
      what: 'A standing run on a set schedule, or the van on call for your crew.',
      lead: TODO('confirm you offer dedicated routes, and how they are set up'),
      best: 'Contractors and supply houses with steady runs every week.',
    },
  ] as Level[],
  twoPersonLevel: {
    key: 'twoperson', name: 'Two-person handling', offered: true,
    what: 'A second person for heavy or awkward pieces.',
    lead: TODO('two-person lead time'),
    best: 'Items too heavy or long for one person to handle safely.',
  } as Level,

  // ---------- PRICES AND PAYMENT ----------
  pricing: 'Every run is quoted per job before pickup.',
  pricingDetail: TODO('how quotes are built: base + per mile, wait time after X minutes, after-hours rate, minimum charge'),
  payment: 'Card, cash or Zelle.', // From business.ts FAQ.
  cardAtBooking: TODO('do you take card at booking? (Square payment link)'),
  netTerms: TODO('do you offer invoicing / Net 15 or Net 30 for approved business accounts? Write the terms, or "" if not'),

  // ---------- PROOF ----------
  // Real numbers only, from Roadie, Curri or your own records, e.g. { deliveries: '250+', rating: '4.9 on Curri', onTime: '98%' }
  trackRecord: null as null | { deliveries?: string; rating?: string; onTime?: string; source: string },
  // Real reviews only, exact wording, with permission.
  reviews: [] as { text: string; name: string; company?: string }[],

  // ---------- QUOTE FORM ----------
  // Web3Forms' free plan has no file uploads. Set true only on a plan that accepts attachments.
  formUploads: false,

  // ---------- PHOTOS NEEDED (labeled placeholders until you add real ones) ----------
  // Set `src` to a real photo of YOUR van in public/img/ (about 1200 px wide) to replace a placeholder.
  shots: {
    hero: { src: '/img/van-1200.jpg', webp: '/img/van-640.webp 640w, /img/van-960.webp 960w, /img/van-1200.webp 1200w', alt: 'The Locker Box all-electric Mercedes-Benz eSprinter cargo van, side view', label: '' },
    vanFront: { src: '', alt: '', label: 'Van, 3/4 front view, clean, logo visible' },
    cargo: { src: '', alt: '', label: 'Cargo area, empty, with straps and blankets in place' },
    loaded: { src: '', alt: '', label: 'Rear doors open with a strapped, blanketed load (pallet or crated parts)' },
    pickup: { src: '', alt: '', label: 'Load photo at pickup: parts on the van floor, label or packing slip visible' },
    gate: { src: '', alt: '', label: 'Van at a job-site gate or dock (no client logos or badges in the shot)' },
    owner: { src: '', alt: '', label: 'Owner with the van, in PPE' },
    ownerPortrait: { src: '', alt: '', label: 'Owner portrait for the About page' },
  },
};

/** True while any TODO is left in the delivery facts or city pages. */
export function deliveryTodos(extra: unknown[] = []): string[] {
  const found = new Set<string>();
  JSON.stringify([delivery, ...extra]).replace(/\[\[TODO: (.*?)\]\]/g, (_, t) => (found.add(t), ''));
  return [...found];
}
