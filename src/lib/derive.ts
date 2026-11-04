// Works out links and text from the config, so templates stay simple.
import { business } from '../data/business.ts';
import { sample } from '../data/sample.ts';
import type { Price, Service } from '../data/types.ts';

export const isSample = process.env.SAMPLE_DATA === '1';
export const biz = isSample ? sample : business;

export function siteUrl(): string {
  if (biz.domain) return 'https://' + biz.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return biz.temporaryUrl.replace(/\/+$/, '');
}

export const telHref = biz.phone ? `tel:${biz.phone}` : '';

/** `sms:+1...?&body=` is the form that opens prefilled on both iPhone and Android. */
export function smsHref(body = ''): string {
  if (!biz.phone) return '';
  return body ? `sms:${biz.phone}?&body=${encodeURIComponent(body)}` : `sms:${biz.phone}`;
}

export function phoneDisplay(): string {
  const m = biz.phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : biz.phone;
}

export function priceText(p: Price): string {
  if (p.type === 'flat') return `$${p.amount}`;
  if (p.type === 'from') return `From $${p.amount}`;
  if (p.type === 'estimate') return 'Free estimate';
  return '';
}

export const bookUrl = (s: Service) => s.bookingUrl || biz.links.booking;
export const hasForm = !!biz.web3formsKey;

export function trustBits(): string[] {
  const bits = biz.credentials.licenses.map((l) => `${l.label} #${l.number}`);
  if (biz.credentials.insurance) bits.push(biz.credentials.insurance);
  if (biz.credentials.warranty) bits.push(biz.credentials.warranty);
  bits.push('All-electric van');
  return bits;
}

export function serviceNames(): string[] {
  return [
    ...biz.trades.flatMap((t) => t.services.map((s) => s.name)),
    ...biz.plans.map((p) => p.name),
  ];
}

export function pageTitle(): string {
  const what = [biz.whatIDo, biz.area.summary].filter(Boolean).join(' in ');
  return [biz.name, what].filter(Boolean).join(' | ') || 'All-electric mobile service';
}

export function metaDescription(): string {
  const lead = [biz.whatIDo, biz.area.summary].filter(Boolean).join(' in ');
  const van = 'I come to you in an all-electric van: quiet, no exhaust, no idling at your home.';
  return `${lead ? lead + '. ' : ''}${van}${biz.phone ? ' Call, text or book online.' : ''}`;
}

export function jsonLd(): Record<string, unknown> | null {
  if (!biz.name) return null;
  const url = siteUrl();
  const ld: Record<string, unknown> = { '@context': 'https://schema.org', '@type': biz.schemaType, name: biz.name };
  if (url) { ld.url = url; ld.image = `${url}/og.png`; }
  if (biz.logo && url) ld.logo = url + biz.logo;
  if (biz.phone) ld.telephone = biz.phone;
  if (biz.email) ld.email = biz.email;
  if (biz.whatIDo) ld.description = metaDescription();
  if (biz.area.places.length) ld.areaServed = biz.area.places.map((name) => ({ '@type': 'City', name }));
  else if (biz.area.summary) ld.areaServed = biz.area.summary;
  const hours = biz.hours.map((h) => h.schema).filter(Boolean);
  if (hours.length) ld.openingHours = hours;
  if (biz.socials.length) ld.sameAs = biz.socials.map((s) => s.url);
  return ld;
}

/** Everything still blank, for `npm run todo`. `blocker` = don't publish without it. */
export function todos(): { item: string; blocker?: boolean }[] {
  const b = biz;
  const out: { item: string; blocker?: boolean }[] = [];
  const need = (blank: unknown, item: string, blocker = false) => {
    if (!blank || (Array.isArray(blank) && !blank.length)) out.push({ item, blocker });
  };
  need(b.name, 'Business name', true);
  need(b.phone, 'Phone for call and text', true);
  need(b.whatIDo, 'What you do (a few words)', true);
  need(b.trades, 'Services and prices', true);
  need(b.area.summary, 'Service area', true);
  need(b.domain, 'Domain (QR code cannot be made until then)');
  need(b.logo, 'Logo (optional)');
  need(b.plans, 'Care plan (recommended, steady income)');
  need(b.hours, 'Hours');
  need(b.email, 'Email');
  need(b.links.booking, 'Square booking link');
  need(b.links.deposit, 'Square deposit payment link');
  need(b.links.googleReview, 'Google review link');
  need(b.socials, 'Social links (optional)');
  need(b.credentials.licenses, 'TxDMV mover registration number, and any other licenses');
  need(b.credentials.insurance, 'Insurance');
  need(b.credentials.warranty, 'Warranty');
  need(b.owner.name, 'Your first name');
  need(b.owner.photo, 'Photo of you');
  need(b.photos.van, 'Photo of the van');
  need(b.photos.gallery, 'Before and after photos');
  need(b.reviews, 'Real reviews');
  need(b.vanOffer.headline, 'Van-scan offer (optional)');
  for (const [k, v] of Object.entries(b.faq)) need(v, `FAQ answer: ${k}`);
  need(b.web3formsKey, 'Web3Forms key (turns on the quote form)');
  need(b.cloudflareAnalyticsToken, 'Cloudflare Web Analytics token');
  if (b.trades.flatMap((t) => t.services).every((s) => s.price.type === 'none')) out.push({ item: 'Service prices' });
  return out;
}
