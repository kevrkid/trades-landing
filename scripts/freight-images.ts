// npm run images (second half): the freight brand's tab icons and link-preview image, from src/assets/elektrx-mark.svg.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { freight as F } from '../src/data/freight.ts';

const svg = readFileSync('src/assets/elektrx-mark.svg');
await sharp(svg, { density: 300 }).resize(64, 64).png({ compressionLevel: 9 }).toFile('public/brand/elektrx-favicon.png');
// iPhones round the corners themselves, so the touch icon is the square navy tile without its own rounding.
const flat = svg.toString().replace('rx="24"', 'rx="0"');
await sharp(Buffer.from(flat), { density: 300 }).resize(180, 180).png({ compressionLevel: 9 }).toFile('public/brand/elektrx-touch.png');

const font = readFileSync('node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2').toString('base64');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const [word, ...rest] = F.name.split(' ');
const og = `<style>@font-face{font-family:H;src:url(data:font/woff2;base64,${font});font-weight:100 900}*{margin:0;box-sizing:border-box}body{font-family:H,sans-serif}</style>
<body style="width:1200px;height:630px;background:#0A1F44;color:#fff;overflow:hidden;position:relative">
<div style="position:absolute;left:70px;top:70px;width:300px;height:300px">${svg.toString().replace('<svg ', '<svg width="300" height="300" ')}</div>
<div style="position:absolute;left:410px;top:96px;font-weight:800;font-size:128px;line-height:1;letter-spacing:-.01em">${esc(word)}</div>
<div style="position:absolute;left:416px;top:238px;font-weight:700;font-size:56px;letter-spacing:.42em;color:#F26A1B">${esc(rest.join(' ').toUpperCase())}</div>
<div id="h" style="position:absolute;left:70px;right:70px;top:420px;font-weight:700;font-size:50px;line-height:1.12">${esc(F.headline)}</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:14px;background:#F26A1B"></div></body>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => {
  const h = document.getElementById('h')!;
  let size = 50;
  while (size > 30 && h.getBoundingClientRect().bottom > 590) h.style.fontSize = (size -= 2) + 'px';
});
await page.screenshot({ path: 'public/og-freight.png' });
await browser.close();
console.log('Made the freight icons and public/og-freight.png');
