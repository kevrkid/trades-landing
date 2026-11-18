// npm run test: builds the site with sample data and with your real config, serves both on
// Cloudflare's local server, and checks them in a phone-sized browser.
// Screenshots go to SHOTS (default: test-shots/).
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { business } from '../src/data/business.ts';
import { todos } from '../src/lib/derive.ts';

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
    const small = await page.$$eval('a,button,select,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,summary', (els) =>
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
  ok(await page.locator('img[alt="Locker Box"]').first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), 'logo loads');
  ok((await fetch(S + '/favicon.png')).status === 200, 'icon loads');
  // Service buttons.
  await page.locator('#services a[data-service="Building tear-down"]').click();
  await page.waitForTimeout(100);
  ok(await page.locator('input[name=service]:checked').getAttribute('value') === 'Building tear-down', 'quote button preselects the service');
  ok(await page.locator('[name=teardown_what]').isVisible() && !(await page.locator('[name=moving_from]').isVisible()), 'survey asks the tear-down questions only');
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
  ok(ld['@type'] === business.schemaType && ld.areaServed?.length === 3 && !ld.address, 'JSON-LD: type, areaServed, no street address');
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

  // Real config: the survey with no outside service, from first question to send.
  await page.goto(R + '/');
  const survey = page.locator('#quote-form');
  ok(await survey.isVisible(), 'real: survey shows');
  await page.locator('#quote-next').click();
  ok(await page.locator('[data-step="1"]').isVisible(), 'survey will not move on until a service is picked');
  await page.locator('label.choice', { hasText: 'Junk removal' }).click();
  await page.locator('#quote-next').click();
  await page.locator('[name=junk_what]').fill('Old couch and a fridge');
  await page.locator('[name=junk_amount]').selectOption('A few items');
  ok(!(await page.locator('[name=teardown_what]').isVisible()), 'survey hides other jobs');
  await page.locator('#quote-next').click();
  await page.locator('label.choice', { hasText: 'This week' }).click();
  await page.locator('#quote-next').click();
  await page.locator('#quote-submit').click();
  ok(await page.locator('[data-step="4"]').isVisible() && !(await page.locator('#quote-send').isVisible()), 'survey requires name, phone and ZIP');
  await page.locator('[name=name]').fill('Test Person');
  await page.locator('[name=phone]').fill('5125550199');
  await page.locator('[name=address]').fill('78641');
  await page.screenshot({ path: `${SHOTS}/survey-last.png` });
  await page.locator('#quote-submit').click();
  ok(await page.locator('#quote-send').isVisible(), 'survey reaches the send step');
  const mailto = decodeURIComponent((await page.locator('#quote-email').getAttribute('href'))!);
  ok(mailto.startsWith('mailto:' + business.email) && mailto.includes('Service: Junk removal') && mailto.includes('Old couch and a fridge') && mailto.includes('A few items') && mailto.includes('When: This week') && mailto.includes('Name: Test Person') && !mailto.includes('Tear-down'), 'email has the answers');
  await page.screenshot({ path: `${SHOTS}/survey-send.png` });
  await page.locator('#quote-edit').click();
  ok(await survey.isVisible() && await page.locator('[name=junk_what]').inputValue() === 'Old couch and a fridge', 'can go back and change answers');
  const nojsF = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const nf2 = await nojsF.newPage();
  await nf2.goto(R + '/');
  ok(await nf2.locator('[name=junk_what]').isVisible() && await nf2.locator('[name=name]').isVisible(), 'no JS: the whole form still shows');
  await nojsF.close();
  // Moving needs a TxDMV number before it can be advertised.
  if (!business.credentials.licenses.some((l) => /txdmv/i.test(l.label) && l.number)) ok(!/moving|moves\b/i.test(readFileSync('dist-real/index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')), 'real: no moving on the page without a TxDMV number');
  // Real work.
  await page.goto(R + '/');
  const howStep = (await page.locator('#how li').first().locator('p').innerText()).trim();
  ok(/^[A-Z]/.test(howStep) && /(^|, or )(A|a)nswer a few quick questions\.$/.test(howStep) && (!business.phone || howStep.startsWith('Call or text, or ')), 'real: how-it-works sentence starts with a capital and reads right: ' + howStep);
  ok(await page.locator('#why strong', { hasText: 'Kevin' }).count() === 0, 'real: name is not repeated');
  ok(await page.locator('#work video').first().getAttribute('poster') === null, 'real: video covers wait until scrolled to');
  ok(await page.evaluate(() => [...document.querySelectorAll('#work video')].every((v) => (v as HTMLVideoElement).paused && (v as HTMLVideoElement).readyState === 0)), 'real: videos do not download before they are scrolled to');
  await page.locator('#work video').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  ok(!!(await page.locator('#work video').first().getAttribute('poster')), 'real: video cover loads when scrolled to');
  const playing = await page.evaluate(() => [...document.querySelectorAll('#work video')].map((x) => { const v = x as HTMLVideoElement; return { on: !v.paused && v.currentTime > 0, muted: v.muted, loop: v.loop, controls: v.controls }; }));
  ok(playing.every((v) => v.on && v.muted && v.loop && !v.controls), `real: videos autoplay muted on a loop ${JSON.stringify(playing)}`);
  await page.evaluate(() => { const v = document.querySelector('#work video') as HTMLVideoElement; v.currentTime = Math.max(0, v.duration - 0.2); });
  await page.waitForTimeout(1200);
  const looped = await page.evaluate(() => { const v = document.querySelector('#work video') as HTMLVideoElement; return !v.paused && v.currentTime < v.duration - 0.1 && v.currentTime < 2; });
  ok(looped, 'real: video starts over at the end');
  await page.locator('#work video').first().click();
  await page.waitForTimeout(300);
  ok(await page.locator('#work video').first().evaluate((v: HTMLVideoElement) => v.paused), 'real: tapping a video pauses it');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  ok(await page.locator('#work video').first().evaluate((v: HTMLVideoElement) => v.paused), 'real: video pauses off screen');
  await page.locator('#work video').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  ok(await page.locator('#work video').first().evaluate((v: HTMLVideoElement) => v.paused), 'real: a paused video stays paused when scrolled back to');
  await page.locator('#work video').first().press('Enter');
  await page.waitForTimeout(600);
  ok(await page.locator('#work video').first().evaluate((v: HTMLVideoElement) => !v.paused), 'real: Enter on a paused video plays it again');
  if (business.trades.some((t) => t.services.some((s) => s.kind === 'moving')) && !business.credentials.licenses.some((l) => /txdmv/i.test(l.label) && l.number)) ok(todos().some((t) => t.blocker && /Moving is listed/.test(t.item)), 'real: moving without your own USDOT/TxDMV blocks publishing');
  if (!business.links.booking && !business.links.deposit) ok(!(await (await fetch(R + '/privacy')).text()).includes('Square'), 'real: privacy page does not mention Square until a Square link is set');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  ok(await page.locator('#work p').count() === 0, 'real: no titles on photos or videos');
  ok((await page.locator('#work img').first().getAttribute('alt'))!.length > 0, 'real: photos still describe themselves to screen readers');
  const calmCtx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 800 } });
  const calmPage = await calmCtx.newPage();
  await calmPage.goto(R + '/');
  ok(await calmPage.locator('#work video').first().evaluate((v: HTMLVideoElement) => !v.controls && v.paused && !!v.poster), 'real: reduced-motion visitors see a still frame, no player controls');
  await calmPage.locator('#work video').first().click();
  await calmPage.waitForTimeout(600);
  ok(await calmPage.locator('#work video').first().evaluate((v: HTMLVideoElement) => !v.paused && !v.controls), 'real: a tap plays the clip for reduced-motion visitors');
  await calmCtx.close();
  await page.goto(R + '/');
  ok(await page.locator('#work img').count() === business.photos.gallery.length, 'real: work photos show');
  ok(await page.locator('#work video[controls]').count() === 0 && !(await page.content()).includes('<video controls'), 'real: videos never show player controls');
  ok(!business.photos.gallery.some((g) => g.src.includes('building-in-progress')), 'real: the other building is not in the gallery');
  ok(await page.locator('#work video[preload=none]').count() === business.photos.videos.length, 'real: videos do not preload');
  for (const p of ['/work/welding-cut.mp4', '/work/welding-weld.mp4', '/work/steel-frame.webp']) ok((await fetch(R + p, { method: 'HEAD' })).status === 200, `real: ${p} loads`);
  const faqText = await page.locator('#faq').evaluate((e) => e.textContent || '');
  ok(/2-hour minimum/.test(faqText) && /Zelle/.test(faqText) && /\$75 trip fee/.test(faqText), 'real: FAQ answers show');
  ok(!/warranty/i.test(await page.locator('body').evaluate((e) => e.textContent || '')), 'real: warranty stays off the page');
  ok(!(await page.locator('body').evaluate((e) => e.textContent || '')).includes('9994372'), 'real: the old DOT number is gone');

  // The real config: nothing fake, unset things hidden.
  const home = readFileSync('dist-real/index.html', 'utf8');
  ok(!/sample|example\.com|555/i.test(home), 'real build has no sample data');
  ok(existsSync('dist-real/index.html') && !readFileSync('dist-real/van.html', 'utf8').match(/SAMPLE/), 'real /van has no sample data');
  await page.goto(R + '/');
  await page.screenshot({ path: `${SHOTS}/real-390-full.png`, fullPage: true });
  ok(await page.locator('h1').isVisible(), 'real: page renders');
  ok(await page.getByText('eSprinter').count() > 0, 'real: eSprinter featured');
  ok(await page.getByText('Brings its own power').count() === 0, 'real: own-power toggle is off by default');
  ok(business.rate ? (await page.locator('header').innerText()).toLowerCase().includes(business.rate.toLowerCase()) : !/\/hour/i.test(await page.locator('header').innerText()), 'real: header shows the one rate, or none when prices differ by service');
  const priceOf = (p: { type: string; amount?: number; min?: number; max?: number }) => p.type === 'from' ? `From $${p.amount}` : p.type === 'hourly' ? `$${p.min}-$${p.max}/hour` : p.type === 'flat' ? `$${p.amount}` : '';
  for (const sv of business.trades.flatMap((t) => t.services).filter((x) => priceOf(x.price))) {
    ok(await page.locator('#services li', { hasText: sv.name }).getByText(priceOf(sv.price), { exact: true }).count() === 1, `real: ${sv.name} shows ${priceOf(sv.price)}`);
  }
  if (!business.faq.extras) ok(!/anything extra on top/i.test(await page.locator('#faq').evaluate((e) => e.textContent || '')), 'real: unanswered FAQ question stays hidden');
  else ok((await page.locator('#faq').evaluate((e) => e.textContent || '')).includes('charged at cost'), 'real: dump-fee answer shows in the FAQ');
  if (!business.rating.score) ok(await page.locator('header').getByText('reviews').count() === 0, 'real: no rating until you have one');
  ok(business.rateExample ? await page.getByText(business.rateExample).count() === 1 : !(await page.content()).includes('hours of work comes to'), 'real: worked example matches the config');
  if (todos().some((t) => t.blocker)) ok(await page.locator('meta[name=robots][content=noindex]').count() === 1, 'real: unfinished site stays out of Google');
  else ok(await page.locator('meta[name=robots][content=noindex]').count() === 0, 'real: finished site can be found on Google');
  ok(!/rangebolt|arc &(amp;)? haul/i.test(home), 'real: old names are gone');
  ok(await page.getByText('Locker Box').count() > 0, 'real: name shows');
  ok(!/handle your move myself|sampletown/i.test(home), 'real: removed wording stays gone');
  ok(!business.subheading || await page.locator('header').getByText(business.subheading, { exact: true }).count() === 1, 'real: subheading shows once at the top, or not at all when blank');
  ok(business.promises.cleanUp || !/clean up|clean-up/i.test(await page.locator('main').innerText()), 'real: no clean-up promise when it is off');
  ok(await page.locator('#area').getByText(business.area.summary.replace(/^the /, 'The ')).count() === 1 && (business.area.note ? await page.locator('#area').getByText(business.area.note).count() === 1 : true), 'real: service area shows');
  // Whatever the config leaves blank must stay hidden.
  const ids = await page.locator('main section').evaluateAll((els) => els.map((x) => x.id));
  const shows = (id: string, should: boolean) => ok(ids.includes(id) === should, `real: section ${id} ${should ? 'shows' : 'stays hidden'}`);
  shows('services', business.trades.length > 0);
  shows('plans', business.plans.length > 0);
  shows('work', business.photos.gallery.length > 0);
  shows('reviews', business.reviews.length > 0);
  shows('faq', Object.values(business.faq).some(Boolean) || !!business.links.deposit);
  if (!business.phone) ok(await page.locator('a[href^="tel:"], a[href^="sms:"]').count() === 0, 'real: no call or text links until a phone is set');
  else ok(await page.locator(`a[href="tel:${business.phone}"]`).count() > 0 && await page.locator(`a[href^="sms:${business.phone}"]`).count() > 0, 'real: call and text links use the business phone');
  if (!business.links.booking) ok((await fetch(R + '/book', { redirect: 'manual' })).headers.get('location')?.endsWith('/'), 'real: /book goes home until set');

  // ---------- Freight brand (/freight) and the brand split ----------
  const { freight } = await import('../src/data/freight.ts');
  const { readdirSync, statSync } = await import('node:fs');
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const x = `${d}/${f}`; return statSync(x).isDirectory() ? walk(x) : [x]; });
  const nameHits = walk('src').filter((f) => f !== 'src/data/freight.ts' && readFileSync(f, 'utf8').includes(freight.name));
  ok(!nameHits.length, `freight: brand name stored only in src/data/freight.ts ${nameHits.join(', ')}`);
  for (const w of [360, 390]) {
    const fc = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const fp = await fc.newPage(); const ferr: string[] = [];
    fp.on('console', (m) => { if (m.type() === 'error') ferr.push(m.text()); }); fp.on('pageerror', (e) => ferr.push(String(e)));
    await fp.goto(R + freight.path);
    ok(await fp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `freight ${w}: no sideways scroll`);
    const fsmall = await fp.$$eval('a,button,select,input:not([type=hidden]):not([type=checkbox]),textarea,summary', (els) =>
      els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 48; }).map((e) => e.outerHTML.slice(0, 70)));
    ok(!fsmall.length, `freight ${w}: tap targets 48px+ ${fsmall.join(' | ')}`);
    ok(!ferr.length, `freight ${w}: no console errors ${ferr.join(' | ')}`);
    await fp.screenshot({ path: `${SHOTS}/freight-${w}-full.png`, fullPage: true });
    await fc.close();
  }
  await page.goto(R + freight.path);
  const fhtml = await page.content();
  const ftitle = await page.title(), fdesc = (await page.locator('meta[name=description]').getAttribute('content')) || '';
  ok(ftitle.includes(freight.name) && fdesc.length >= 70 && fdesc.length <= 200, `freight: title and search description (${fdesc.length} chars)`);
  ok(ftitle !== (await (async () => { const t = await browser.newPage(); await t.goto(R + '/'); const x = await t.title(); await t.close(); return x; })()), 'freight: title differs from Locker Box');
  const op = `${freight.name}, operated by ${business.name}.`;
  ok((await page.locator('#about').innerText()).includes(`${op} USDOT 4727545.`), 'freight: About says operated by Locker Box with USDOT');
  ok((await page.locator('footer').innerText()).includes(op) && (await page.locator('footer').innerText()).includes('USDOT 4727545'), 'freight: footer says operated by Locker Box with USDOT');
  ok(await page.locator('a[href*="safer.fmcsa.dot.gov"][href*="4727545"]').count() > 0, 'freight: USDOT links to the FMCSA SAFER lookup');
  ok(await page.locator('a[href="/"]', { hasText: 'trade services' }).count() > 0, 'freight: links to Locker Box trade services');
  ok(await page.locator('#services h3').allInnerTexts().then((t) => t.join('|') === 'Hot shot|Same-day|Scheduled|Dedicated route'), 'freight: the four delivery services');
  const ftext = (await page.locator('body').innerText());
  ok(!/tesla|spacex|samsung|badg|\bPPE\b|\bgates?\b/i.test(ftext + (await (async () => { await page.goto(R + '/'); return page.locator('body').innerText(); })())), 'brand pages: no client names, gates, PPE or badging');
  ok(!/testimonial|★/i.test(ftext), 'freight: no reviews or ratings');
  ok(fhtml.includes('hazardous') || /Hazardous/.test(ftext), 'freight: no hazardous materials stated');
  ok(business.email && ftext.includes(business.email), 'freight: business email shows');
  await page.goto(R + '/van');
  ok(await page.getByText('Thanks for scanning the van!').isVisible(), 'van: greeting kept');
  ok(await page.locator(`#freight a[href="${freight.path}"]`).isVisible(), 'van: small section links to the freight brand');
  // Freight form end to end (no Web3Forms key: opens the visitor's email/text app with the answers).
  await page.goto(R + freight.path);
  const ff = page.locator('#freight-form');
  await page.locator('#freight-submit').click();
  ok(await ff.isVisible() && !(await page.locator('#freight-send').isVisible()), 'freight form: requires pickup, delivery, what, name and phone');
  await page.locator('#services a[data-level="Hot shot"]').click();
  ok(await ff.locator('[name=service]').inputValue() === 'Hot shot', 'freight form: service link preselects the service');
  await ff.locator('[name=materials_pickup]').fill('Supply house, Round Rock');
  await ff.locator('[name=address]').fill('Job site, Taylor');
  await ff.locator('[name=materials_what]').fill('2 reels of wire');
  await ff.locator('[name=pieces]').fill('2');
  await ff.locator('[name=weight]').fill('300');
  await ff.locator('[name=name]').fill('Test Person');
  await ff.locator('[name=company]').fill('Test Electric');
  await ff.locator('[name=phone]').fill('5125550199');
  await page.locator('#freight-submit').click();
  ok(await page.locator('#freight-send').isVisible(), 'freight form: reaches the send step');
  const fmail = decodeURIComponent((await page.locator('#freight-email').getAttribute('href')) || '');
  ok(fmail.startsWith('mailto:' + business.email) && ['Service: Hot shot', 'Pickup: Supply house, Round Rock', 'Delivery: Job site, Taylor', 'What: 2 reels of wire', 'Pieces or pallets: 2', 'Weight (lb): 300', 'Company: Test Electric', 'Came from: ' + freight.name].every((x) => fmail.includes(x)), 'freight form: email carries the answers');
  const ftextHref = decodeURIComponent((await page.locator('#freight-text').getAttribute('href')) || '');
  ok(ftextHref.startsWith('sms:' + business.phone) && ftextHref.includes('Name: Test Person'), 'freight form: text carries the answers');
  const fields = await ff.evaluate((f) => [...new Set([...(f as HTMLFormElement).elements].map((e) => (e as HTMLInputElement).name).filter(Boolean))]);
  ok(['service', 'materials_what', 'materials_pickup', 'address', 'timing', 'preferred_times', 'details', 'name', 'phone', 'source'].every((n) => fields.includes(n)), 'freight form: keeps every field the old freight quote sent');
  ok(readFileSync('dist-real/sitemap.xml', 'utf8').includes('/freight'), 'freight: in the sitemap');
  ok(await page.locator('link[rel=icon]').getAttribute('href') === '/brand/elektrx-favicon.png' && (await fetch(R + '/brand/elektrx-favicon.png')).status === 200 && (await fetch(R + '/brand/elektrx-touch.png')).status === 200, 'freight: its own tab and home-screen icons');
  ok(((await page.locator('meta[property="og:image"]').getAttribute('content')) || '').endsWith('/og-freight.png') && (await fetch(R + '/og-freight.png')).status === 200, 'freight: its own link-preview image');
  await page.goto(R + freight.path);
  ok((await page.locator('#van').innerText()).includes('14 ft 6 in (174 in)') && await page.locator('#fits svg').count() === 3, 'freight: cargo measurements in feet and inches, with 3 what-fits diagrams');
  ok(((await page.locator('animateMotion').first().getAttribute('path')) || '').split('L').length > 8, 'freight: the map token tours the whole map');
  { const mc = await browser.newContext({ viewport: { width: 360, height: 800 } }); const mp = await mc.newPage(); await mp.goto(R + freight.path);
    const r = await mp.locator('svg[aria-label^="Route map"]').boundingBox(); ok(r && r.x >= 0 && r.x + r.width <= 360, 'freight: the map fits a phone screen without cutting off'); await mc.close(); }
} finally {
  await browser.close();
  for (const s of servers) try { process.kill(-s.pid!); } catch {}
}
console.log(`${good} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
