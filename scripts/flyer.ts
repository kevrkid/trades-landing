// npm run flyer: a one-page letter-size counter flyer for supply houses and contractors, brand/elektrx/flyer.pdf
// (+ flyer.png preview). The QR code opens the dedicated-routes page with the weekly estimate.
import { readFileSync } from 'node:fs';
import QRCode from 'qrcode';
import { chromium } from 'playwright';
import { freight as F } from '../src/data/freight.ts';
import { between, routePrice } from '../src/data/routes.ts';
import { biz, phoneDisplay, usdot } from '../src/lib/derive.ts';

const base = (process.env.QR_DOMAIN ? 'https://' + process.env.QR_DOMAIN : biz.domain ? 'https://' + biz.domain : biz.temporaryUrl).replace(/\/+$/, '');
const target = `${base}${F.path}/dedicated-routes`;
const qr = await QRCode.toString(target, { type: 'svg', errorCorrectionLevel: 'Q', margin: 2, color: { dark: '#0A1F44', light: '#ffffff' } });
const mark = readFileSync('src/assets/elektrx-mark.svg', 'utf8').replace('<svg ', '<svg width="96" height="96" ');
const font = readFileSync('node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2').toString('base64');
const [word, ...rest] = F.name.split(' ');
const C = F.cargo;
const ft = (i: number) => `${Math.floor(i / 12)}\u00a0ft${i % 12 ? `\u00a0${i % 12}\u00a0in` : ''}`;
const runs = ([['Round Rock', 'Taylor'], ['Austin', 'San Antonio'], ['Austin', 'Houston'], ['Austin', 'Dallas']] as const)
  .map(([a, b]) => { const r = between(a, b); return `<tr><td>${a} → ${b}</td><td>${r.miles} mi</td><td><b>${routePrice(r.miles)}</b></td></tr>`; }).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:H;src:url(data:font/woff2;base64,${font});font-weight:100 900}
@page{size:letter;margin:0}
*{margin:0;box-sizing:border-box}
body{font-family:H,sans-serif;color:#0A1F44;width:8.5in;height:11in;position:relative;overflow:hidden}
.top{background:#0A1F44;color:#fff;padding:.5in .6in .45in;display:flex;align-items:center;gap:22px}
.top b{display:block;font-size:52px;font-weight:800;line-height:1;letter-spacing:-.01em}
.top i{display:block;font-style:normal;font-size:22px;font-weight:700;letter-spacing:.42em;color:#F26A1B;margin-top:6px}
.body{padding:.4in .6in 0}
h1{font-size:40px;line-height:1.05;font-weight:800;margin-bottom:10px}
.lead{font-size:17px;line-height:1.45;color:#3A4A63;margin-bottom:22px}
.cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:24px}
.cols h2{font-size:18px;font-weight:800;border-top:4px solid #F26A1B;padding-top:8px;margin-bottom:6px}
.cols p{font-size:14.5px;line-height:1.45;color:#3A4A63}
.row{display:grid;grid-template-columns:1fr 2.1in;gap:28px;align-items:start}
table{width:100%;border-collapse:collapse;font-size:15px}
caption{text-align:left;font-size:18px;font-weight:800;margin-bottom:6px}
td{padding:7px 0;border-bottom:1px solid #D5DCE8}td:nth-child(2){color:#3A4A63;width:70px}td:last-child{text-align:right}
.note{font-size:12px;color:#3A4A63;margin-top:6px;line-height:1.4}
.qr{text-align:center;font-size:14px;font-weight:700}.qr svg{width:2.1in;height:2.1in;display:block;margin-bottom:6px}
.call{position:absolute;left:0;right:0;bottom:0;background:#F26A1B;color:#0A1F44;padding:.32in .6in;display:flex;justify-content:space-between;align-items:end}
.call b{font-size:44px;font-weight:800;line-height:1}.call span{font-size:13px;text-align:right;line-height:1.5;font-weight:600}
</style></head><body>
<div class="top">${mark}<div><b>${word}</b><i>${rest.join(' ').toUpperCase()}</i></div></div>
<div class="body">
<h1>Your parts on site today.<br>Your route on schedule.</h1>
<p class="lead">Same-day cargo van delivery of parts and materials to job sites across the Texas Triangle, plus standing daily or weekly runs from your counter to your customers. All-electric van, based in Leander.</p>
<div class="cols">
<div><h2>Hot shot & same-day</h2><p>Your load only, straight from pickup to the site. Call or text any day, including early starts.</p></div>
<div><h2>Dedicated routes</h2><p>Set days, set times, one rate per run agreed before the first run. Stop waiting on will-call.</p></div>
<div><h2>What fits</h2><p>Up to 3 pallets or 2,300 lb. Floor ${ft(C.length)} long, ${ft(C.width)} wide, ${ft(C.height)} tall. 4×8 sheets lie flat.</p></div>
</div>
<div class="row">
<div><table><caption>Example runs</caption>${runs}</table>
<p class="note">Estimates for one run, pickup to delivery. Your rate is confirmed before the van moves.${F.showPhotoProof ? ' Photo proof at every drop.' : ''}</p></div>
<div class="qr">${qr}Scan for an instant<br>weekly route estimate</div>
</div>
</div>
<div class="call"><div><div style="font-size:15px;font-weight:700;margin-bottom:4px">Call or text</div><b>${phoneDisplay()}</b></div>
<span>${usdot() ? `USDOT ${usdot()}<br>` : ''}${F.insurance}<br>${base.replace(/^https:\/\//, '')}${F.path}</span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 816, height: 1056 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
const overflow = await page.evaluate(() => { const r = document.querySelector('.row')!.getBoundingClientRect(), c = document.querySelector('.call')!.getBoundingClientRect(); return r.bottom > c.top - 10; });
if (overflow) { console.error('Flyer content runs into the call bar; shorten the text.'); process.exit(1); }
await page.pdf({ path: 'brand/elektrx/flyer.pdf', format: 'Letter', printBackground: true });
await page.screenshot({ path: 'brand/elektrx/flyer.png' });
await browser.close();
console.log(`Made brand/elektrx/flyer.pdf and flyer.png (QR: ${target})`);
