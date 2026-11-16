// npm run decal: a simple van sign with logo, phone, a few words and the QR code.
// Makes qr/van-decal.pdf + .png, or a marked preview until the phone and domain are set.
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import { business as b } from '../src/data/business.ts';

const WORDS = ['Moving', 'Welding', 'Hauling', 'Tear-downs', 'Junk removal'];
// DECAL_PHONE, DECAL_DOMAIN and DECAL_BASE are only for testing the layout.
const bizPhone = process.env.DECAL_PHONE || b.phone;
const bizDomain = process.env.DECAL_DOMAIN || b.domain;
// Moving is on the sign, so it stays a preview until your own USDOT/TxDMV numbers are in the config.
const movingHeld = b.trades.some((t) => t.services.some((s) => s.kind === 'moving')) && !b.credentials.licenses.some((l) => /txdmv/i.test(l.label) && l.number) && !process.env.DECAL_PHONE;
const ready = !!(bizPhone && bizDomain) && !movingHeld;
const m = bizPhone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
const phone = m ? `${m[1]}-${m[2]}-${m[3]}` : bizPhone;
const font = readFileSync('node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2').toString('base64');
const mark = readFileSync('public/brand/locker-box-mark.png').toString('base64');

let qr = `<div style="width:11in;height:11in;border:.08in dashed #777;display:flex;align-items:center;justify-content:center;text-align:center;font-size:1in;color:#555">QR code goes here<br>once the domain is bought</div>`;
if (bizDomain) {
  const svg = await QRCode.toString(`https://${bizDomain}/van`, { type: 'svg', errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#000000', light: '#ffffff' } });
  qr = `<div style="width:11in;height:11in">${svg}</div>`;
}
const html = `<!doctype html><style>@font-face{font-family:B;src:url(data:font/woff2;base64,${font})}
@page{size:24in 18in;margin:0}*{margin:0;box-sizing:border-box}
html,body{width:24in;height:18in;background:#fff;color:${b.colors.brandDeep};font-family:B,sans-serif;font-weight:800;text-transform:uppercase;overflow:hidden;position:relative}</style>
<body><img src="data:image/png;base64,${mark}" style="position:absolute;left:.8in;top:.5in;height:4.8in;width:auto"><div style="position:absolute;left:10in;right:.6in;top:1.35in;font-size:3in;line-height:1;white-space:nowrap;text-align:center" id="name">${b.name}</div>
<div style="position:absolute;left:.8in;top:5.6in">${qr}</div>
<div style="position:absolute;left:12.2in;top:5.9in;width:11.2in">
 <div style="font-size:${ready ? 1.95 : 1.5}in;line-height:1;white-space:nowrap">${ready ? phone : 'Your number here'}</div>
 <div style="height:.25in;width:3in;background:${b.colors.accent};margin:.35in 0"></div>
 <div style="font-size:1.3in;line-height:1.06">${WORDS.join('<br>')}</div>
 <div style="font-size:.85in;margin-top:.3in;color:${b.colors.brand}">Scan for prices</div>
</div>
${ready ? '' : `<div style="position:absolute;left:0;right:0;bottom:0;background:#ffe14d;color:#000;text-align:center;font-size:.7in;padding:.08in">Preview, do not print</div>`}
</body>`;

mkdirSync('qr', { recursive: true });
const base = process.env.DECAL_BASE || (ready ? 'qr/van-decal' : 'qr/van-decal-PREVIEW');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2304, height: 1728 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
// Refuse to make a sign with anything running off the edge.
const off = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => {
  const r = document.createRange(); r.selectNodeContents(e);
  const q = e.tagName === 'IMG' ? e.getBoundingClientRect() : r.getBoundingClientRect();
  return q.width > 0 && (q.right > 2304 || q.bottom > 1728 || q.left < 0 || q.top < 0);
}).map((e) => e.tagName + ' ' + (e.textContent || '').trim().slice(0, 30)));
const name = await page.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById('name')!); const q = r.getBoundingClientRect(); return q.right - q.left <= 13.4 * 96; });
if (off.length || !name) { await browser.close(); console.error('Decal text runs off the sign:', off.join(' | ') || 'name too wide'); process.exit(1); }
await page.screenshot({ path: `${base}.png` });
if (ready) await page.pdf({ path: `${base}.pdf`, width: '24in', height: '18in', printBackground: true });
await browser.close();
console.log(`Made ${base}.png${ready ? ' and .pdf' : ` (before it can be printed it needs: ${[!bizPhone && 'your phone number', !bizDomain && 'your domain', movingHeld && 'your own TxDMV number, since it says Moving'].filter(Boolean).join(', ')})`}`);
