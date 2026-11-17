// npm run images: makes the logo sizes, icons and link-preview image from the config
// and brand-source/locker-box-logo.png.
import { readFileSync, rmSync } from 'node:fs';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { business as b } from '../src/data/business.ts';

const SRC = 'brand-source/locker-box-logo.png';
const cut = await sharp(SRC).removeAlpha().trim({ threshold: 18 }).raw().toBuffer({ resolveWithObject: true });
// The source's background is slightly off-white, which shows as a gray box on a white page.
for (let i = 0; i < cut.data.length; i += 3) {
  if (Math.min(cut.data[i], cut.data[i + 1], cut.data[i + 2]) >= 236) cut.data[i] = cut.data[i + 1] = cut.data[i + 2] = 255;
}
const trimmed = await sharp(cut.data, { raw: { width: cut.info.width, height: cut.info.height, channels: 3 } }).png().toBuffer();
const pad = (s: sharp.Sharp) => s.extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#ffffff' });
await sharp(trimmed).resize(510).webp({ quality: 82 }).toFile('public/brand/locker-box-logo.webp');
await sharp(trimmed).resize(512).png({ compressionLevel: 9 }).toFile('public/brand/locker-box-logo.png');
// The picture part only (locker and gloves), without the wording.
const { width = 0, height = 0 } = await sharp(trimmed).metadata();
const mark = await sharp(trimmed).extract({ left: 0, top: 0, width, height: Math.round(height * 0.61) }).png().toBuffer();
await sharp(mark).toFile('public/brand/locker-box-mark.png');
const square = (n: number) => pad(sharp(mark).resize(n - 16, n - 16, { fit: 'contain', background: '#ffffff' })).flatten({ background: '#ffffff' });
await square(180).png().toFile('public/apple-touch-icon.png');
await square(64).png().toFile('public/favicon.png');
rmSync('public/favicon.svg', { force: true });

const font = readFileSync('node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2').toString('base64');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const logo = readFileSync('public/brand/locker-box-logo.png').toString('base64');
const van = readFileSync('public' + b.photos.van).toString('base64');
const og = `<style>@font-face{font-family:B;src:url(data:font/woff2;base64,${font})}*{margin:0;box-sizing:border-box}body{font-family:B,sans-serif}</style>
<body style="width:1200px;height:630px;background:#fff;color:${b.colors.brandDeep};overflow:hidden;position:relative">
<img src="data:image/png;base64,${logo}" style="position:absolute;left:60px;top:26px;height:330px;width:auto">
<div style="position:absolute;left:60px;top:372px;width:510px;font-size:58px;line-height:1;text-transform:uppercase">${esc(b.headline || b.name)}</div>
<div style="position:absolute;left:60px;bottom:48px;font-size:34px;color:${b.colors.accent}">${b.rate ? esc(b.rate) + ' · ' : ''}100% electric van</div>
<div style="position:absolute;right:0;top:0;bottom:18px;width:600px"><img src="data:image/jpeg;base64,${van}" style="width:100%;height:100%;object-fit:cover;object-position:right center;display:block"></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:18px;background:repeating-linear-gradient(135deg,${b.colors.accent} 0 28px,${b.colors.brandDeep} 28px 56px)"></div></body>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });

// Link preview for the delivery pages: navy, wordmark, the van.
const inter = readFileSync('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2').toString('base64');
const ogd = `<style>@font-face{font-family:I;src:url(data:font/woff2;base64,${inter});font-weight:100 900}*{margin:0;box-sizing:border-box}body{font-family:I,sans-serif}</style>
<body style="width:1200px;height:630px;background:#0b1f3a;color:#fff;overflow:hidden;position:relative">
<div style="position:absolute;left:64px;top:60px;display:flex;align-items:center;gap:14px"><div style="width:40px;height:40px;background:#f26a1b;border-radius:6px"></div><div style="font-size:38px;font-weight:800;letter-spacing:2px">${esc(b.name.toUpperCase())}</div></div>
<div style="position:absolute;left:64px;top:170px;width:560px;font-size:60px;font-weight:800;line-height:1.05;letter-spacing:-2px">Parts and materials to Texas job sites, fast.</div>
<div style="position:absolute;left:64px;bottom:70px;width:540px;font-size:26px;font-weight:600;color:#c9d6e8;line-height:1.35">Hot shot and same-day cargo van delivery<br>Based in Leander, TX</div>
<div style="position:absolute;right:0;top:0;bottom:0;width:520px"><img src="data:image/jpeg;base64,${van}" style="width:100%;height:100%;object-fit:cover;object-position:right center;display:block"></div>
<div style="position:absolute;left:0;bottom:0;width:680px;height:10px;background:#f26a1b"></div></body>`;
await page.setContent(ogd);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-delivery.png' });
await browser.close();
console.log('Made the logo sizes, icons, public/og.png and public/og-delivery.png');
