// City pages (/delivery/<slug>). Each one must say something true and local; don't copy-paste.
// Project names are public information, listed to describe the area. They are NOT customers:
// never imply a relationship with them. Distances are rough road miles from Leander.
import { TODO } from './delivery.ts';

export type Zone = 'local' | 'triangle' | 'west';

export interface City {
  slug: string;
  name: string;
  short: string;
  zone: Zone;
  miles: string;
  drive: string;
  title: string;
  description: string;
  intro: string;
  activity: { title: string; text: string }[];
  runs: string[];
  leadTime: string;
  nearby: string[];
}

export const cities: City[] = [
  {
    slug: 'austin',
    name: 'Austin',
    short: 'Austin',
    zone: 'local',
    miles: 'about 25 miles',
    drive: '35-60 minutes from Leander, depending on traffic',
    title: 'Parts and Materials Delivery in Austin, TX',
    description: 'Hot shot and same-day cargo van delivery across Austin: chip fabs, data centers, job sites and supply houses. Exclusive-use runs with photo proof.',
    intro: 'Austin is my home market. I’m based in Leander, so most Austin runs start within the hour I’m booked, and the van is often already nearby.',
    activity: [
      { title: 'Semiconductor fabs', text: 'Austin is home to some of the largest chip plants in Texas, including Samsung’s Austin fab and plants run by NXP and Infineon. Fab construction and upkeep run on tight part schedules.' },
      { title: 'Manufacturing in southeast Travis County', text: 'Tesla’s Gigafactory Texas and the industrial parks around SH-130 and the airport keep a steady flow of contractors and parts moving east of I-35.' },
      { title: 'Data centers and towers', text: 'Data center projects across the metro, and the mid-rise and tower work downtown and in East Austin, all depend on electrical and mechanical gear arriving when the crew is ready for it.' },
    ],
    runs: [
      'Will-call pickup at an electrical or plumbing supply house on the US 183 or I-35 corridor, straight to a site in northeast Austin',
      'A replacement part from a North Austin distributor to a fab contractor’s laydown yard',
      'Fittings or fixtures a crew is short on, from a supply house to a downtown loading dock with a set delivery window',
    ],
    leadTime: TODO('Austin lead time, e.g. "Hot shot: rolling within about an hour. Same-day: book by 2 PM."'),
    nearby: ['Cedar Park', 'Pflugerville', 'Manor', 'Del Valle'],
  },
  {
    slug: 'taylor',
    name: 'Taylor',
    short: 'Taylor',
    zone: 'local',
    miles: 'about 30 miles',
    drive: 'about 40 minutes from Leander',
    title: 'Hot Shot Delivery to Taylor, TX Job Sites',
    description: 'Cargo van delivery to Taylor and eastern Williamson County: the Samsung fab area, contractors and industrial sites. Exclusive-use, with photo proof at both ends.',
    intro: 'Taylor went from a small railroad town to one of the busiest construction areas in Texas. Most of the parts and materials for it come from supply houses in Round Rock, Austin and beyond, which is the run I make.',
    activity: [
      { title: 'Samsung’s Taylor fab', text: 'Samsung’s semiconductor plant on the edge of Taylor is one of the largest construction projects in the state. Work at that scale means gate check-ins, badging and strict delivery windows.' },
      { title: 'Suppliers and contractors moving in', text: 'Contractors, laydown yards and supplier buildings have spread along US 79, SH-95 and toward Hutto to support the fab work.' },
      { title: 'Growing town', text: 'New homes, schools and commercial buildings in Taylor and Hutto add their own steady demand for building materials.' },
    ],
    runs: [
      'A part from a Round Rock or Austin supply house to a Taylor site gate, timed to the gate’s delivery window',
      'Will-call pickup for a mechanical or electrical contractor, dropped at their laydown yard on US 79',
      'Returns and swaps: the wrong fitting back to the supply house, the right one out to the crew, in one run',
    ],
    leadTime: TODO('Taylor lead time, e.g. "Hot shot: on site in about 1-1.5 hours from booking."'),
    nearby: ['Hutto', 'Thrall', 'Granger', 'Coupland'],
  },
  {
    slug: 'round-rock-georgetown',
    name: 'Round Rock and Georgetown',
    short: 'Round Rock / Georgetown',
    zone: 'local',
    miles: '15-20 miles',
    drive: 'about 20-30 minutes from Leander',
    title: 'Parts Delivery in Round Rock and Georgetown, TX',
    description: 'Fast cargo van delivery around Round Rock and Georgetown: supply houses, contractors and industrial sites along I-35 and SH-130. Quoted per job.',
    intro: 'Round Rock and Georgetown are next door to Leander. A lot of the supply houses and contractor shops that serve Taylor and north Austin sit here, so many of my runs start or end on this stretch of I-35.',
    activity: [
      { title: 'Supply houses and distributors', text: 'Electrical, plumbing, HVAC and industrial distributors along I-35 and University Boulevard supply job sites across Williamson County.' },
      { title: 'Corporate and tech campuses', text: 'Round Rock is home to Dell Technologies’ headquarters, and both cities have growing office, medical and light-industrial campuses.' },
      { title: 'SH-130 industrial growth', text: 'New warehouses and manufacturing buildings along SH-130 and around the Georgetown airport bring steady contractor traffic.' },
    ],
    runs: [
      'Will-call pickup in Round Rock for a crew in Georgetown that can’t leave the site',
      'A replacement part to a plant or warehouse to keep a line or a lift running',
      'Building materials from a Georgetown yard to a site in Leander, Liberty Hill or Jarrell',
    ],
    leadTime: TODO('Round Rock / Georgetown lead time, e.g. "Hot shot: rolling in under an hour."'),
    nearby: ['Hutto', 'Liberty Hill', 'Jarrell', 'Pflugerville'],
  },
  {
    slug: 'dallas-fort-worth',
    name: 'Dallas-Fort Worth',
    short: 'Dallas-Fort Worth',
    zone: 'triangle',
    miles: 'about 185-200 miles',
    drive: 'about 3-3.5 hours each way on I-35',
    title: 'Same-Day Delivery Between Central Texas and Dallas-Fort Worth',
    description: 'Same-day exclusive-use cargo van runs between Central Texas and Dallas-Fort Worth for data center, fab and contractor parts. Photo proof at both ends.',
    intro: 'I don’t run local errands inside DFW. What I do is the long run: a part that exists in Central Texas and is needed in Dallas-Fort Worth today, or the other way around, driven straight through with no transfers.',
    activity: [
      { title: 'Data centers', text: 'Dallas-Fort Worth is one of the largest data center markets in the country, with campuses going up from Garland and Plano to Fort Worth and Red Oak.' },
      { title: 'Chip plants up the road', text: 'Texas Instruments’ fabs in Richardson and Sherman, and GlobalWafers’ plant in Sherman, put semiconductor work at both ends of I-35 in North Texas.' },
      { title: 'Distribution hub', text: 'Many national distributors stock their Texas inventory in DFW. When the only one in stock is up there, a same-day run beats freight by a day or more.' },
    ],
    runs: [
      'A part in stock only at a DFW distributor, picked up and driven straight to a Central Texas fab or data center site',
      'Gear from a Central Texas supplier to a data center project in the Dallas area, delivered to a set dock window',
      'An urgent swap: the failed unit out, the replacement in, same day',
    ],
    leadTime: TODO('DFW lead time, e.g. "Same-day if booked by 10 AM; next morning otherwise."'),
    nearby: ['Waco', 'Temple', 'Hillsboro', 'Sherman'],
  },
  {
    slug: 'houston',
    name: 'Houston',
    short: 'Houston',
    zone: 'triangle',
    miles: 'about 170 miles',
    drive: 'about 3 hours each way on US 290 or SH-71 and I-10',
    title: 'Same-Day Delivery Between Central Texas and Houston',
    description: 'Same-day exclusive-use cargo van runs between Central Texas and Houston for industrial, energy and construction parts. Quoted per job, with photo proof.',
    intro: 'Houston is about three hours out. I take Houston runs as point-to-point, same-day trips: your load only, picked up at one end and delivered at the other.',
    activity: [
      { title: 'Energy and industrial', text: 'The refineries, chemical plants and fabrication shops around the Ship Channel and the east side make Houston the biggest industrial parts market in the state.' },
      { title: 'Big distributors', text: 'Houston’s industrial supply houses carry valves, fittings, electrical gear and instruments that Central Texas sites sometimes can’t get locally.' },
      { title: 'Construction', text: 'Hospital, data center and commercial projects across the metro, from the Medical Center to the Energy Corridor, keep contractors moving parts both ways.' },
    ],
    runs: [
      'An industrial part from a Houston distributor to a fab or data center site in Austin or Taylor, same day',
      'A Central Texas fabricator’s finished pieces delivered to a Houston-area site on schedule',
      'Will-call pickup on the Northwest or Southwest side for a contractor who can’t spare a truck for six hours',
    ],
    leadTime: TODO('Houston lead time, e.g. "Same-day if booked by 10 AM."'),
    nearby: ['Brenham', 'Katy', 'Cypress', 'Bastrop'],
  },
  {
    slug: 'san-antonio',
    name: 'San Antonio',
    short: 'San Antonio',
    zone: 'triangle',
    miles: 'about 105 miles',
    drive: 'about 1.5-2 hours each way on I-35 or US 281',
    title: 'Same-Day Delivery Between Central Texas and San Antonio',
    description: 'Same-day cargo van delivery between Central Texas and San Antonio for data center, manufacturing and construction parts. Exclusive-use, photo proof at both ends.',
    intro: 'San Antonio is close enough for same-day runs in both directions, and a lot of my business freight already runs on the I-35 corridor between Austin and San Antonio.',
    activity: [
      { title: 'Data centers', text: 'The west and northwest sides of San Antonio have one of the larger data center clusters in Texas, with Microsoft among the companies building there.' },
      { title: 'Manufacturing', text: 'Toyota’s truck plant on the south side and the aerospace and tech tenants at Port San Antonio rely on parts arriving on time.' },
      { title: 'Corridor growth', text: 'New Braunfels, San Marcos and Kyle along I-35 are filling in with warehouses, plants and new construction between the two cities.' },
    ],
    runs: [
      'A part from a San Antonio distributor to a Central Texas job site, same day',
      'Electrical or mechanical gear from an Austin-area supplier to a data center project on the west side',
      'Pickups along I-35 in San Marcos or New Braunfels, delivered either direction',
    ],
    leadTime: TODO('San Antonio lead time, e.g. "Same-day if booked by noon."'),
    nearby: ['New Braunfels', 'San Marcos', 'Kyle', 'Seguin'],
  },
  {
    slug: 'abilene',
    name: 'Abilene',
    short: 'Abilene',
    zone: 'west',
    miles: 'about 195 miles',
    drive: 'about 3.5 hours each way through Lampasas and Brownwood',
    title: 'Cargo Van Delivery from Central Texas to Abilene',
    description: 'Exclusive-use cargo van runs from Central Texas to Abilene and West Texas data center and industrial sites, by arrangement. Quoted per job.',
    intro: 'Abilene is outside the Texas Triangle, so I run it by arrangement rather than as a standard same-day service. Call ahead and we’ll set the pickup time that gets your load there when the site needs it.',
    activity: [
      { title: 'AI data center campus', text: 'The large AI data center campus north of Abilene (the first Stargate site) has made the area one of the busiest data center construction zones in Texas.' },
      { title: 'Power and energy', text: 'Wind, solar and the power infrastructure around the Big Country bring electrical contractors and their parts out from the bigger cities.' },
      { title: 'Long way from stock', text: 'Many specialty parts are stocked in Austin, DFW or Houston. An exclusive run from Central Texas can beat freight by a day.' },
    ],
    runs: [
      'Electrical or mechanical parts from a Central Texas supply house to a data center site north of Abilene',
      'A replacement part picked up in Austin or Round Rock and driven straight out to a West Texas site',
      'Combined West Texas runs to Midland or Amarillo, quoted by arrangement',
    ],
    leadTime: TODO('Abilene / West Texas lead time, e.g. "By arrangement; usually next morning, same-day if booked early."'),
    nearby: ['Midland', 'Amarillo', 'Brownwood', 'Sweetwater'],
  },
];
