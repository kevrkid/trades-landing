// npm run images: draws the link-preview image and the icons from the config.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { business as b } from '../src/data/business.ts';

const vanArt = readFileSync('src/assets/van.svg', 'utf8');
const van = b.photos.van
  ? `<img src="data:image/jpeg;base64,${readFileSync('public' + b.photos.van).toString('base64')}" style="width:100%;height:100%;object-fit:cover;object-position:right center;display:block">`
  : vanArt;
const font = readFileSync('node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2').toString('base64');
const title = b.name || 'All-electric mobile service';
const sub = [b.whatIDo, b.area.summary].filter(Boolean).join(' in ') || 'Quiet. No exhaust. No idling at your home.';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const base = `<style>@font-face{font-family:B;src:url(data:font/woff2;base64,${font})}
*{margin:0;box-sizing:border-box}:root{--accent:${b.colors.accent}}body{font-family:B,sans-serif}</style>`;
const og = `${base}<body style="width:1200px;height:630px;background:${b.colors.brand};color:#fff;padding:64px;display:flex;flex-direction:column;overflow:hidden;position:relative">
<div style="position:absolute;left:0;right:0;bottom:0;height:22px;background:repeating-linear-gradient(135deg,${b.colors.accent} 0 28px,${b.colors.brandDeep} 28px 56px)"></div>
<div style="font-size:${title.length > 14 ? 72 : 96}px;line-height:1;text-transform:uppercase;max-width:490px">${esc(title)}</div>
<div style="font-size:40px;margin-top:20px;color:${b.colors.accent};max-width:490px">${esc(sub)}</div>
<div style="position:absolute;right:0;top:0;bottom:22px;width:600px">${van}</div>
${b.whatIDo || b.area.summary ? `<div style="position:absolute;left:64px;bottom:80px;font-size:40px;line-height:1.15;width:480px">${b.rate ? esc(b.rate) + '<br>' : ''}100% electric van.</div>` : ''}</body>`;
const bolt = (size: number, pad: boolean) => `${base}<body style="width:${size}px;height:${size}px;background:${b.colors.brand};display:flex;align-items:center;justify-content:center">
<svg viewBox="0 0 32 32" width="${pad ? size * 0.72 : size}" height="${pad ? size * 0.72 : size}"><path d="M19 3 7 18h7l-2 11 13-16h-7.5L19 3Z" fill="${b.colors.accent}"/></svg></body>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const shot = async (html: string, w: number, h: number, path: string) => {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path });
};
await shot(og, 1200, 630, 'public/og.png');
await shot(bolt(180, true), 180, 180, 'public/apple-touch-icon.png');
await browser.close();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${b.colors.brand}"/><path d="M19 3 7 18h7l-2 11 13-16h-7.5L19 3Z" fill="${b.colors.accent}"/></svg>\n`;
(await import('node:fs')).writeFileSync('public/favicon.svg', svg);
console.log('Made public/og.png, public/apple-touch-icon.png, public/favicon.svg');
