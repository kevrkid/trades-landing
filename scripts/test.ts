// npm run test: builds the site with sample data and with your real config, serves both on
// Cloudflare's local server, and checks them in a phone-sized browser.
// Screenshots go to SHOTS (default: test-shots/).
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { business } from '../src/data/business.ts';

const SHOTS = process.env.SHOTS || 'test-shots';
mkdirSync(SHOTS, { recursive: true });
let bad = 0, good = 0;
const ok = (cond: unknown, label: string) => { if (cond) good++; else { bad++; console.log('FAIL: ' + label); } };

const env = { ...process.env, WRANGLER_SEND_METRICS: 'false' };
execSync('npm run -s build', { env: { ...env, SAMPLE_DATA: '1', OUT_DIR: 'dist-sample' }, stdio: 'ignore' });
execSync('npm run -s build', { env: { ...env, SAMPLE_DATA: '', OUT_DIR: 'dist-real' }, stdio: 'ignore' });

async function serve(dir: string, port: number) {
  const p = spawn('npx', ['wrangler', 'pages', 'dev', dir, '--port', String(port), '--inspector-port', String(port + 1000)], { env, stdio: 'ignore', detached: true });
  for (let i = 0; i < 120; i++) {
    try { await fetch(`http://localhost:${port}/`); return p; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  throw new Error('server did not start on ' + port);
}
const S = 'http://localhost:8841', R = 'http://localhost:8842';
const servers = [await serve('dist-sample', 8841), await serve('dist-real', 8842)];

const browser = await chromium.launch();
try {
  for (const width of [360, 390, 430]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(S + '/');
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no sideways scroll`);
    const small = await page.$$eval('a,button,select,input:not([type=hidden]):not([type=checkbox]),textarea,summary', (els) =>
      els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 48; }).map((e) => e.outerHTML.slice(0, 80)));
    ok(!small.length, `${width}: tap targets 48px+ ${small.join(' | ')}`);
    await page.screenshot({ path: `${SHOTS}/sample-${width}-top.png` });
    await page.screenshot({ path: `${SHOTS}/sample-${width}-full.png`, fullPage: true });
    ok(!errors.length, `${width}: no console errors ${errors.join(' | ')}`);
    const bar = page.locator('nav[aria-label=Contact]');
    ok(await bar.isVisible(), `${width}: sticky bar shows`);
    ok((await bar.locator('a').allInnerTexts()).join().toUpperCase() === 'CALL,TEXT,BOOK', `${width}: bar is Call, Text, Book`);
    await ctx.close();
  }

  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page: Page = await ctx.newPage();

  // Above the fold: all four actions visible without scrolling.
  await page.goto(S + '/');
  for (const name of ['Book', 'Get a quote']) {
    const box = await page.locator('header a', { hasText: name }).first().boundingBox();
    ok(box && box.y + box.height <= 800, `hero ${name} above the fold`);
  }

  ok(await page.locator('header').getByText('from 12 Google (sample) reviews').isVisible(), 'rating shows at the top when set');
  // Service buttons.
  await page.locator('#services a[data-service="Building tear-down"]').click();
  await page.waitForTimeout(100);
  ok(await page.locator('#quote-service').inputValue() === 'Building tear-down', 'quote button preselects the service');
  ok(await page.locator('#services a', { hasText: 'Book this' }).first().getAttribute('href') === 'https://example.com/square-booking', 'book button goes to Square');
  ok(await page.locator('#plans a[data-service]').count() === 1, 'plan without a Square link opens the form');

  // Form + honeypot.
  ok(await page.locator('#quote-form').getAttribute('action') === 'https://api.web3forms.com/submit', 'form posts to Web3Forms');
  ok(!(await page.locator('[name=botcheck]').isVisible()), 'honeypot hidden');
  ok(await page.locator('[name=redirect]').getAttribute('value') === 'https://example.com/thanks', 'form returns to /thanks');
  ok(await page.locator('#quote-form [type=file]').count() === 0, 'no file upload');
  const sms = (await page.locator('#quote a', { hasText: 'Text me photos' }).getAttribute('href'))!;
  ok(sms.startsWith('sms:+15125550100?&body=Hi!%20Here%20are%20photos'), 'text-photos link is prefilled');
  ok(!(await page.content()).match(/card.?number|cvv/i), 'no card fields');

  // No-JS: plain links still work.
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const np = await nojs.newPage();
  await np.goto(S + '/');
  const bar = np.locator('nav[aria-label=Contact] a');
  const hrefs = await bar.evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  ok(hrefs[0] === 'tel:+15125550100', 'no JS: Call link');
  ok(hrefs[1]!.startsWith('sms:+15125550100?&body='), 'no JS: Text link');
  ok(hrefs[2] === 'https://example.com/square-booking', 'no JS: Book link');
  await nojs.close();

  // /van.
  await page.goto(S + '/van');
  ok(page.url().endsWith('/van'), '/van stays at /van, no trailing slash');
  ok(await page.getByText('Thanks for scanning the van!').isVisible(), '/van banner');
  ok(await page.getByText('$25 off').isVisible(), '/van shows the offer');
  ok(await page.locator('link[rel=canonical]').getAttribute('href') === 'https://example.com/', '/van canonical is /');
  ok(await page.locator('[name=source]').getAttribute('value') === 'Van QR code', '/van leads are marked');
  ok((await page.locator('nav[aria-label=Contact] a').nth(1).getAttribute('href'))!.includes('scanned%20your%20van'), '/van text says it came from the van');
  await page.screenshot({ path: `${SHOTS}/sample-van-top.png` });

  // Home: no banner, JSON-LD.
  await page.goto(S + '/');
  ok(await page.getByText('Thanks for scanning').count() === 0, 'home has no van banner');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  ok(ld['@type'] === 'MovingCompany' && ld.areaServed?.length === 3 && !ld.address, 'JSON-LD: type, areaServed, no street address');
  ok(await page.locator('meta[property="og:image"]').getAttribute('content') === 'https://example.com/og.png', 'OG image');

  // Redirects on Cloudflare's server.
  for (const [path, to] of [['/book', 'https://example.com/square-booking'], ['/pay', 'https://example.com/square-deposit'], ['/review', 'https://example.com/google-review']]) {
    const r = await fetch(S + path, { redirect: 'manual' });
    ok(r.status === 302 && r.headers.get('location') === to, `${path} is a 302 to the config link (got ${r.status} ${r.headers.get('location')})`);
  }
  const nf = await fetch(S + '/nope');
  ok(nf.status === 404 && (await nf.text()).includes('tel:+15125550100'), '404 page has Call');
  ok((await fetch(S + '/privacy')).status === 200, '/privacy');
  ok(readFileSync('dist-sample/contact.vcf', 'utf8').includes('TEL;TYPE=CELL:+15125550100'), 'contact card');
  ok(readFileSync('dist-sample/sitemap.xml', 'utf8').includes('https://example.com/privacy') && !readFileSync('dist-sample/sitemap.xml', 'utf8').includes('/van'), 'sitemap has pages, not /van');
  for (const p of ['/privacy', '/nope', '/thanks']) {
    await page.goto(S + p);
    await page.screenshot({ path: `${SHOTS}/sample-${p.slice(1)}.png`, fullPage: true });
  }

  // The real config: nothing fake, unset things hidden.
  const home = readFileSync('dist-real/index.html', 'utf8');
  ok(!/sample|example\.com|555/i.test(home), 'real build has no sample data');
  ok(existsSync('dist-real/index.html') && !readFileSync('dist-real/van.html', 'utf8').match(/SAMPLE/), 'real /van has no sample data');
  await page.goto(R + '/');
  await page.screenshot({ path: `${SHOTS}/real-390-full.png`, fullPage: true });
  ok(await page.locator('h1').isVisible(), 'real: page renders');
  ok(await page.getByText('eSprinter').count() > 0, 'real: eSprinter featured');
  ok(await page.getByText('Brings its own power').count() === 0, 'real: own-power toggle is off by default');
  ok((await page.locator('header').innerText()).includes('/HOUR') || (await page.locator('header').innerText()).includes('/hour'), 'real: rate shows near the top');
  ok(await page.locator('#services').getByText('$60-$100/hour').count() === business.trades.flatMap((t) => t.services).length, 'real: every service shows the hourly rate');
  ok(await page.locator('#faq').count() === 0 || !(await page.locator('#faq').innerText()).includes('minimum'), 'real: blank minimum question stays hidden');
  if (!business.rating.score) ok(await page.locator('header').getByText('reviews').count() === 0, 'real: no rating until you have one');
  ok(await page.getByText('3 hours of work comes to $180-$300').count() === 1, 'real: worked example shows');
  // Whatever the config leaves blank must stay hidden.
  const ids = await page.locator('main section').evaluateAll((els) => els.map((x) => x.id));
  const shows = (id: string, should: boolean) => ok(ids.includes(id) === should, `real: section ${id} ${should ? 'shows' : 'stays hidden'}`);
  shows('services', business.trades.length > 0);
  shows('plans', business.plans.length > 0);
  shows('work', business.photos.gallery.length > 0);
  shows('reviews', business.reviews.length > 0);
  shows('faq', Object.values(business.faq).some(Boolean) || !!business.links.deposit);
  if (!business.phone) ok(await page.locator('a[href^="tel:"], a[href^="sms:"]').count() === 0, 'real: no call or text links until a phone is set');
  if (!business.links.booking) ok((await fetch(R + '/book', { redirect: 'manual' })).headers.get('location')?.endsWith('/'), 'real: /book goes home until set');
} finally {
  await browser.close();
  for (const s of servers) try { process.kill(-s.pid!); } catch {}
}
console.log(`${good} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
