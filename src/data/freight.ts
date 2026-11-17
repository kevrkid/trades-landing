// Chalkline Freight: the job-site delivery brand, shown at /freight.
// The brand NAME lives only here. If the trademark search fails, change `name` and rebuild.
// Contact details, USDOT, insurance and the van come from business.ts, so they stay in one place.

export const freight = {
  name: 'Chalkline Freight',
  path: '/freight',

  // Waiting on the owner's yes before deploy (11-16 brief): set to false to drop the line everywhere.
  showPhotoProof: true, // "Photo proof of delivery"
  showTextUpdates: true, // "text updates on the way"

  headline: 'Same-day delivery of parts and materials to Texas job sites',
  lead: 'Electrical components, electronics, and building materials, delivered by cargo van for the contractors and supply houses building data centers, chip plants, and advanced factories across the Texas Triangle.',

  // Prices approved by the owner 11-16 (freight from $95; Triangle runs about $2.50-$3 per mile).
  pricing: 'Runs start at $95 around Austin. Longer Texas Triangle runs are about $2.50–$3 per mile, and long runs across Texas are quoted by the trip. Your rate is confirmed before the van moves.',

  services: [
    { name: 'Hot shot', what: 'Your load only, driven straight from pickup to your site.', when: 'For urgent loads' },
    { name: 'Same-day', what: 'Picked up and delivered the same day across the Texas Triangle.', when: 'Call or text any day' },
    { name: 'Scheduled', what: 'Dock-to-dock pickup and delivery at a set date and time.', when: 'Next day or later' },
    { name: 'Dedicated route', what: 'Standing daily or weekly runs between your branch and your sites.', when: 'Set up with you' },
  ],

  carry: [
    { name: 'Electrical', items: ['Wire and cable', 'Conduit and fittings', 'Breakers, panels, and lighting'] },
    { name: 'Electronics and IT', items: ['Boxed components', 'Network and fiber gear', 'Sensors and controls'] },
    { name: 'Building materials', items: ['Fasteners and hardware', 'Sheet goods in van-friendly sizes', 'Job-site consumables'] },
    { name: 'Tools and equipment', items: ['Hand and power tools', 'Small equipment', 'Returns and swaps'] },
  ],

  industries: [
    { name: 'Data center construction', what: 'Electrical and network parts on tight schedules.' },
    { name: 'Semiconductor and chip packaging', what: 'Materials for fab and packaging-line contractors.' },
    { name: 'EV, robotics, and advanced manufacturing', what: 'Runs to factory expansions and equipment installs.' },
    { name: 'Aerospace and satellite manufacturing', what: 'Components for plant build-outs around Austin and Bastrop.' },
    { name: 'Electrical and mechanical contractors', what: 'Short-shipped orders and missing parts.' },
    { name: 'Supply houses and distributors', what: 'Hot shot and overflow runs to your customers.' },
  ],

  sameDay: ['Leander', 'Cedar Park', 'Round Rock', 'Georgetown', 'Hutto', 'Taylor', 'Austin', 'Bastrop', 'San Antonio', 'Houston', 'Dallas–Fort Worth', 'Sherman'],
  byArrangement: ['Abilene', 'West Texas', 'South Texas'],

  about: [
    'Chalkline Freight is the delivery service of Locker Box, based in Leander, Texas, and owned and run by Kevin Kidd. Kevin also welds and builds steel frames and metal buildings, so job sites are familiar ground.',
    'We’re building toward a fleet of electric vans and box trucks serving job sites across Texas.',
  ],
};
