// Helpers for the delivery pages: navigation, page list (sitemap) and structured data.
import { biz, siteUrl, phoneDisplay } from './derive.ts';
import { delivery, isTodo, deliveryTodos, TODO } from '../data/delivery.ts';
import { cities } from '../data/cities.ts';

export const nav = [
  { href: '/delivery', label: 'Delivery' },
  { href: '/industries', label: 'Industries' },
  { href: '/service-area', label: 'Service Area' },
  { href: '/safety', label: 'Safety' },
  { href: '/about', label: 'About' },
  { href: '/#services', label: 'Trade services' },
];

/** Every indexable delivery page, for the sitemap. */
export const deliveryPaths = ['/delivery', '/industries', '/service-area', '/safety', '/quote', '/about', ...cities.map((c) => `/delivery/${c.slug}`)];

/** The phone number for display, or a TODO marker while it's missing. */
export const phoneText = () => (biz.phone ? phoneDisplay() : TODO('business phone number (add it to business.ts)'));

/** Any TODO left anywhere in the delivery facts, cities, or contact details they rely on. */
export const siteTodos = () => [
  ...(delivery.insurance.confirmed ? [] : ['confirm your commercial insurance is active, then set insurance.confirmed: true']),
  ...deliveryTodos([cities]),
  ...(biz.phone ? [] : ['business phone number (business.ts)']),
];

/** LocalBusiness structured data for the delivery pages. No street address, ever. */
export function localBusinessLd(path: string, extraAreas: string[] = []): Record<string, unknown> {
  const url = siteUrl();
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: biz.name,
    description: 'Owner-operated, USDOT-registered cargo van carrier based in Leander, Texas. Time-critical parts and materials delivery to Texas data center, semiconductor and construction sites.',
    address: { '@type': 'PostalAddress', addressLocality: 'Leander', addressRegion: 'TX', addressCountry: 'US' },
    areaServed: [
      { '@type': 'State', name: 'Texas' },
      ...['Leander', 'Cedar Park', 'Austin', 'Round Rock', 'Georgetown', 'Taylor', 'San Antonio', 'Houston', 'Dallas', 'Fort Worth', 'Abilene', ...extraAreas]
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((name) => ({ '@type': 'City', name })),
    ],
    priceRange: 'Quoted per job',
  };
  if (url) { ld.url = url + path; ld.image = `${url}/og-delivery.png`; }
  if (biz.phone) ld.telephone = biz.phone;
  if (biz.email) ld.email = biz.email;
  return ld;
}

/** FAQPage structured data. Questions whose answers still have a TODO are left out. */
export function faqLd(items: { q: string; a: string }[]): Record<string, unknown> | null {
  const ready = items.filter((i) => !isTodo(i.a));
  if (!ready.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ready.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

export const levelsShown = () => [...delivery.levels, ...(delivery.twoPerson ? [delivery.twoPersonLevel] : [])];
