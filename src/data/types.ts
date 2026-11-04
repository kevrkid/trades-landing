export type Price =
  | { type: 'flat'; amount: number }
  | { type: 'from'; amount: number }
  | { type: 'hourly'; min: number; max: number }
  | { type: 'estimate' }
  | { type: 'none' };

export interface Service {
  name: string;
  description: string;
  price: Price;
  /** 'book' sends them to Square; 'quote' opens the quote form with this service picked. */
  action: 'book' | 'quote';
  /** Optional: a Square link for just this service. Otherwise uses links.booking. */
  bookingUrl?: string;
}
export interface Trade { name: string; services: Service[] }
export interface Plan {
  name: string;
  price: string;
  description: string;
  includes: string[];
  /** Square subscription link. Empty = the button opens the quote form. */
  signupUrl: string;
}
export interface HoursRow {
  days: string;
  time: string;
  /** Optional, for Google: e.g. 'Mo-Fr 08:00-18:00' */
  schema?: string;
}
export interface Review { text: string; name: string; source: string; stars?: number }
export interface WorkPhoto { before: string; after: string; caption: string }

export interface Business {
  name: string;
  logo: string;
  whatIDo: string;
  /** Your general rate, shown near the top of the page, e.g. '$60-$100/hour'. */
  rate: string;
  /** A worked example of the rate. Must be plain arithmetic on your real rate. */
  rateExample: string;
  colors: { brand: string; brandDeep: string; accent: string; accentInk: string };
  schemaType: string;
  trades: Trade[];
  plans: Plan[];
  area: { summary: string; places: string[] };
  hours: HoursRow[];
  hoursNote: string;
  phone: string;
  email: string;
  domain: string;
  temporaryUrl: string;
  links: { booking: string; deposit: string; googleReview: string };
  socials: { label: string; url: string }[];
  credentials: { licenses: { label: string; number: string }[]; insurance: string; warranty: string };
  van: { bringsOwnPower: boolean };
  promises: { upfrontPricing: boolean; cleanUp: boolean };
  owner: { name: string; photo: string; note: string };
  photos: { van: string; vanWebp: string; vanAlt: string; gallery: WorkPhoto[] };
  reviews: Review[];
  /** Your real overall score, shown at the top of the page. */
  rating: { score: string; count: number; source: string };
  vanOffer: { headline: string; terms: string };
  faq: {
    estimates: string; payment: string; deposits: string;
    cancellations: string; warranty: string; travelFee: string;
    minimum: string; extras: string;
  };
  web3formsKey: string;
  cloudflareAnalyticsToken: string;
  cloudflareProject: string;
}
