// Industries served (/industries and the grid on /delivery). Plain descriptions of the work,
// no client names or logos.
export interface Industry {
  id: string;
  icon: string;
  name: string;
  short: string;
  need: string;
  runs: string[];
}

export const industries: Industry[] = [
  {
    id: 'data-centers', icon: 'server', name: 'Data centers',
    short: 'Electrical and mechanical parts to campuses under construction and in operation.',
    need: 'Data center builds run on long lists of electrical and mechanical gear, and a single missing breaker, fitting or controller can stall a commissioning step. Operating sites need replacement parts fast to protect uptime.',
    runs: ['Missing electrical or mechanical parts to a build, timed to the gate window', 'Replacement parts to a running site to avoid downtime', 'Will-call pickups from supply houses for crews that can’t leave the site'],
  },
  {
    id: 'semiconductor', icon: 'chip', name: 'Semiconductor and advanced manufacturing',
    short: 'Time-critical parts and materials to fab construction sites and plants.',
    need: 'Fab construction and plant work happen behind gates, badges and strict schedules. Parts need to arrive on time, intact and documented, ready for the site’s check-in.',
    runs: ['Parts to contractors on fab construction sites, with gate check-in', 'Replacement parts to plants to keep a line running', 'Returns and swaps between the site and the supplier'],
  },
  {
    id: 'contractors', icon: 'hardhat', name: 'Electrical, mechanical and general contractors',
    short: 'Keep the crew working: the part comes to them, they don’t go to it.',
    need: 'When a crew is short a part, the usual fix is sending someone on a supply run, which takes a worker off the job for hours. A direct van run keeps the crew on task.',
    runs: ['Short parts from the supply house to the job site', 'Materials delivered to a specific floor, dock or laydown yard', 'Deliveries timed to an inspection or a crane pick'],
  },
  {
    id: 'supply-houses', icon: 'warehouse', name: 'Supply houses and distributors',
    short: 'Your customer needs it today and your trucks are already out.',
    need: 'Distributors lose sales when a customer needs an order now and the next route is tomorrow. An on-call van fills that gap without adding a driver to the payroll.',
    runs: ['Same-day deliveries to your contractor customers', 'Transfers between branches', 'Hot shot runs for orders that miss the route truck'],
  },
  {
    id: 'equipment-rental', icon: 'wrench', name: 'Equipment rental',
    short: 'Small equipment, attachments and replacement parts, out and back.',
    need: 'Rental yards need small equipment, attachments and repair parts moved between branches and job sites without tying up a big truck.',
    runs: ['Small equipment and attachments to a job site', 'Repair parts to a broken-down unit in the field', 'Pickups and returns between branches'],
  },
  {
    id: 'local-business', icon: 'store', name: 'Local retailers and businesses',
    short: 'Large items that won’t fit in a car, delivered across town or across Texas.',
    need: 'Stores and businesses sometimes need a large item moved once: fixtures, furniture, displays or stock. A cargo van run is quicker and cheaper than a box truck.',
    runs: ['Store-to-customer delivery of large items', 'Fixtures and displays between locations', 'Trade show and event loads'],
  },
];
