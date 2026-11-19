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
  ok(await page.locator('meta[property="og:image"]').getAttribute('content') === 'https://example.com/og.jpg' && readFileSync('public/og.jpg').length < 300_000 && readFileSync('public/og-freight.png').length < 300_000, 'OG image (under 300 KB so WhatsApp shows it)');

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
  await page.locator('#quote-copy').click();
  ok(await page.locator('#quote-copied').isVisible() && (await page.locator('#quote-copy').textContent()) === 'Copied', 'survey: Copy my answers works when there is no mail app');
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
  // Each clip plays while at least a quarter of it is on screen, so check them one at a time, waiting for real
  // playback instead of a fixed sleep (a fixed wait made this flaky when the second clip sat below the fold).
  const playing = [];
  for (const v of await page.locator('#work video').all()) {
    await v.scrollIntoViewIfNeeded();
    const on = await v.evaluate((x) => new Promise<boolean>((res) => { const el = x as HTMLVideoElement, t0 = Date.now(); (function poll() { if (!el.paused && el.currentTime > 0) res(true); else if (Date.now() - t0 > 10000) res(false); else setTimeout(poll, 100); })(); }));
    playing.push({ on, ...(await v.evaluate((x) => { const el = x as HTMLVideoElement; return { muted: el.muted, loop: el.loop, controls: el.controls }; })) });
  }
  await page.locator('#work video').first().scrollIntoViewIfNeeded();
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
    // Every freight page: no sideways scroll, no small tap targets (links inside a sentence are exempt), no errors.
    for (const sub of ['', '/austin-to-houston', '/dedicated-routes', '/thanks']) {
      await fp.goto(R + freight.path + sub);
      const tag = `freight${sub} ${w}`;
      ok(await fp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}: no sideways scroll`);
      const fsmall = await fp.$$eval('a,button,select,input:not([type=hidden]):not([type=checkbox]),textarea,summary', (els) =>
        els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 48 && !(getComputedStyle(e).display === 'inline' && e.closest('p,dd,figcaption')); }).map((e) => e.outerHTML.slice(0, 70)));
      ok(!fsmall.length, `${tag}: tap targets 48px+ ${fsmall.join(' | ')}`);
    }
    await fp.goto(R + freight.path);
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
  ok(await page.locator('#services .row3 h3').allInnerTexts().then((t) => t.join('|') === 'Hot shot|Same-day|Scheduled|Dedicated route'), 'freight: the four delivery services');
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
  await page.locator('#freight-copy').click();
  ok(await page.locator('#freight-copied').isVisible() && (await page.locator('#freight-copy').innerText()) === 'Copied' && (await page.locator('#freight-copied').innerText()).includes(business.email), 'freight form: Copy my answers works when there is no mail app');
  const fields = await ff.evaluate((f) => [...new Set([...(f as HTMLFormElement).elements].map((e) => (e as HTMLInputElement).name).filter(Boolean))]);
  ok(['service', 'materials_what', 'materials_pickup', 'address', 'timing', 'preferred_times', 'details', 'name', 'phone', 'source'].every((n) => fields.includes(n)), 'freight form: keeps every field the old freight quote sent');
  ok(readFileSync('dist-real/sitemap.xml', 'utf8').includes('/freight'), 'freight: in the sitemap');
  ok(await page.locator('link[rel=icon]').getAttribute('href') === '/brand/elektrx-favicon.png' && (await fetch(R + '/brand/elektrx-favicon.png')).status === 200 && (await fetch(R + '/brand/elektrx-touch.png')).status === 200, 'freight: its own tab and home-screen icons');
  ok(((await page.locator('meta[property="og:image"]').getAttribute('content')) || '').endsWith('/og-freight.png') && (await fetch(R + '/og-freight.png')).status === 200, 'freight: its own link-preview image');
  await page.goto(R + freight.path);
  ok((await page.locator('#van').innerText()).includes('14 ft 6 in (174 in)') && await page.locator('#fits svg').count() === 3, 'freight: cargo measurements in feet and inches, with 3 what-fits diagrams');
  await page.locator('#est [name=to]').selectOption('Dallas');
  ok(/^\d+ miles/.test(await page.locator('#est-trip').innerText()) && /^\$\d+–\$\d+$/.test(await page.locator('#est-price').innerText()), 'estimate: Austin to Dallas shows miles and a price range');
  await page.locator('#est [name=to]').selectOption('Round Rock');
  ok(await page.locator('#est-price').innerText() === '$' + freight.estimate.from, 'estimate: short runs show the minimum');
  await page.locator('#est-ask').click();
  ok(await page.locator('#freight-form [name=materials_pickup]').inputValue() === 'Austin, TX' && await page.locator('#freight-form [name=address]').inputValue() === 'Round Rock, TX', 'estimate: Quote this run fills pickup and delivery');
  ok(await page.locator(`a[href="${freight.path}/austin-to-houston"]`).count() > 0, 'freight: links to the route pages');
  await page.goto(R + freight.path + '/austin-to-houston');
  ok((await page.locator('h1').innerText()).includes('Austin to Houston') && await page.locator('#est [name=to]').inputValue() === 'Houston' && await page.locator('#freight-form').count() === 1, 'route page: Austin to Houston with estimate and quote form');
  const rld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) || '{}');
  ok(rld['@type'] === 'Service' && rld.offers?.priceSpecification?.minPrice > 0 && (await page.locator('link[rel=canonical]').getAttribute('href') || '').endsWith('/freight/austin-to-houston'), 'route page: search data and canonical');
  ok(readFileSync('dist-real/sitemap.xml', 'utf8').includes('/freight/austin-to-dallas'), 'route pages: in the sitemap');
  await page.goto(R + freight.path + '/dedicated-routes');
  ok(/^\$[\d,]+(–\$[\d,]+)? a week$/.test(await page.locator('#wk-total').innerText()) && await page.locator('#freight-form [name=service]').inputValue() === 'Dedicated route', 'dedicated routes: weekly estimate shows and the form is set to Dedicated route');
  await page.locator('#wk [name=n]').selectOption('1'); await page.locator('#wk [name=to]').selectOption('Round Rock');
  ok(await page.locator('#wk-total').innerText() === '$' + freight.estimate.from + ' a week', 'dedicated routes: one same-town run a week is the minimum');
  await page.locator('#wk-ask').click();
  ok((await page.locator('#freight-form [name=details]').inputValue()).startsWith('1 run a week'), 'dedicated routes: Quote this route fills the form');
  ok(readFileSync('dist-real/sitemap.xml', 'utf8').includes('/freight/dedicated-routes'), 'dedicated routes: in the sitemap');
  { const th = readFileSync('dist-real/freight/thanks.html', 'utf8');
    ok(th.includes('name="robots" content="noindex"') && th.includes('/freight.vcf') && !readFileSync('dist-real/sitemap.xml', 'utf8').includes('/freight/thanks') && readFileSync('src/components/FreightForm.astro', 'utf8').includes('${freight.path}/thanks'), 'freight thanks page: own brand, noindex, not in the sitemap, and the form sends people there'); }
  const fv = readFileSync('dist-real/freight.vcf', 'utf8');
  ok(fv.includes('FN:' + freight.name) && fv.includes('TEL;TYPE=CELL:' + business.phone) && await page.locator('a[href="/freight.vcf"]').count() >= 2 && readFileSync('dist-real/_headers', 'utf8').includes('/freight.vcf'), 'freight: Save to contacts card with the brand name and phone');
  await page.goto(R + freight.path);
  const fit = page.locator('#fit'), fitOut = page.locator('#fit-out');
  await fit.locator('[name=l]').fill('12 ft'); await fit.locator('[name=w]').fill('4 ft'); await fit.locator('[name=h]').fill('2 ft');
  ok((await fitOut.innerText()).startsWith('It fits') && await page.locator('#fit-ask').isVisible(), 'will it fit: a 12 x 4 x 2 ft load fits');
  await fit.locator('[name=l]').fill('15 ft');
  ok((await fitOut.innerText()).startsWith('Too big') && (await fitOut.innerText()).includes('14 ft 6 in floor') && !(await page.locator('#fit-ask').isVisible()), 'will it fit: 15 ft is longer than the floor');
  await fit.locator('[name=l]').fill(`8' 6"`); await fit.locator('[name=w]').fill('62'); await fit.locator('[name=h]').fill('62');
  ok((await fitOut.innerText()).includes('door opening'), 'will it fit: reads feet-and-inches and checks the door');
  await fit.locator('[name=l]').fill('14 1/2 ft'); await fit.locator('[name=w]').fill('3/4'); await fit.locator('[name=h]').fill('5 1/2');
  ok((await fitOut.innerText()).startsWith('Tight fit'), 'will it fit: reads fractions like 14 1/2 ft and 3/4');
  await fit.locator('[name=l]').fill(`8' 6"`);
  await fit.locator('[name=w]').fill('48'); await fit.locator('[name=h]').fill('6'); await fit.locator('[name=lb]').fill('2500');
  ok((await fitOut.innerText()).includes('2,300 lb'), 'will it fit: checks the weight limit');
  await fit.locator('[name=lb]').fill('400'); await page.locator('#fit-ask').click();
  ok((await page.locator('#freight-form [name=materials_what]').inputValue()).startsWith('Biggest piece: 8 ft 6 in × 4 ft × 6 in, about 400 lb'), 'will it fit: quote button fills in the load');
  const fld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) || '{}');
  ok(fld.hasOfferCatalog?.itemListElement?.length === freight.services.length && fld.address?.addressLocality === 'Leander', 'freight: search data lists the services and home base');
  ok(((await page.locator('animateMotion').first().getAttribute('path')) || '').split('L').length > 8, 'freight: the map token tours the whole map');
  { const mc = await browser.newContext({ viewport: { width: 360, height: 800 } }); const mp = await mc.newPage(); await mp.goto(R + freight.path);
    const r = await mp.locator('svg[aria-label^="Route map"]').boundingBox(); ok(r && r.x >= 0 && r.x + r.width <= 360, 'freight: the map fits a phone screen without cutting off'); await mc.close(); }
  // The estimate is worked out twice (at build time in routes.ts, and in the browser when the cities change).
  // Every city pair must give the same price and miles both ways, on /freight and on the weekly widget.
  {
    const { cities, miles, routePrice, priceRange } = await import('../src/data/routes.ts');
    const ep = await browser.newPage();
    await ep.goto(R + freight.path);
    const shown = await ep.evaluate((n) => { const f = document.getElementById('est') as HTMLFormElement, out: string[][] = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { (f.from as HTMLSelectElement).selectedIndex = i; (f.to as HTMLSelectElement).selectedIndex = j; f.dispatchEvent(new Event('change'));
        out.push([document.getElementById('est-price')!.textContent!, document.getElementById('est-trip')!.textContent!]); }
      return out; }, cities.length);
    const bad: string[] = [];
    shown.forEach(([price, trip], k) => { const i = Math.floor(k / cities.length), j = k % cities.length;
      const want = i === j ? '$' + freight.estimate.from : routePrice(miles[i][j]);
      if (price !== want || (i !== j && !trip.startsWith(miles[i][j] + ' miles'))) bad.push(`${cities[i]}→${cities[j]}: ${price} vs ${want}`); });
    await ep.goto(R + freight.path + '/dedicated-routes');
    const weekly = await ep.evaluate((n) => { const f = document.getElementById('wk') as HTMLFormElement, out: string[] = [];
      (f.n as HTMLSelectElement).value = '5';
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { (f.from as HTMLSelectElement).selectedIndex = i; (f.to as HTMLSelectElement).selectedIndex = j; f.dispatchEvent(new Event('change')); out.push(document.getElementById('wk-total')!.textContent!); }
      return out; }, cities.length);
    weekly.forEach((t, k) => { const i = Math.floor(k / cities.length), j = k % cities.length;
      const [a, b] = i === j ? [freight.estimate.from, freight.estimate.from] : priceRange(miles[i][j]);
      const m = (x: number) => '$' + (x * 5).toLocaleString('en-US');
      const want = (a === b ? m(a) : m(a) + '–' + m(b)) + ' a week';
      if (t !== want) bad.push(`weekly ${cities[i]}→${cities[j]}: ${t} vs ${want}`); });
    await ep.close();
    ok(bad.length === 0, `estimate: browser and build agree on all ${cities.length ** 2} city pairs, single run and weekly ${bad.slice(0, 3).join(' | ')}`);
  }
  // Every built page: valid search data, its own title and description, a canonical pointing at itself,
  // and no template leftovers ("undefined", "NaN", "[object Object]") in what visitors or Google see.
  {
    const { readdirSync, statSync } = await import('node:fs');
    const D = 'dist-real';
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const x = `${d}/${f}`; return statSync(x).isDirectory() ? walk(x) : [x]; });
    const probs: string[] = [], titles = new Map<string, string>(), descs = new Map<string, string>();
    for (const f of walk(D).filter((x) => x.endsWith('.html'))) {
      const h = readFileSync(f, 'utf8'), path = '/' + f.slice(D.length + 1).replace(/\.html$/, '').replace(/^index$/, '');
      const noindex = h.includes('name="robots" content="noindex"');
      for (const [, j] of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        try { const o = JSON.parse(j); if (!o['@context'] || !o['@type']) probs.push(`${path}: search data missing @context/@type`); } catch { probs.push(`${path}: search data is not valid JSON`); }
      }
      const visible = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
      const junk = visible.match(/\bundefined\b|\bNaN\b|\[object Object\]/);
      if (junk) probs.push(`${path}: shows "${junk[0]}"`);
      const t = h.match(/<title>([^<]*)<\/title>/)?.[1] || '', d = h.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
      if (!t) probs.push(`${path}: no title`);
      const canon = h.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || '';
      const canonPath = canon ? new URL(canon).pathname.replace(/\/$/, '') || '/' : path;
      if (canon && !existsSync(D + (canonPath === '/' ? '/index' : canonPath) + '.html')) probs.push(`${path}: canonical ${canon} is not a page`);
      // A page that names another page as the original (like /van -> /) may share its title and description.
      if (!noindex && canonPath === (path || '/')) {
        if (titles.has(t)) probs.push(`${path}: same title as ${titles.get(t)}`); else titles.set(t, path);
        if (descs.has(d)) probs.push(`${path}: same description as ${descs.get(d)}`); else descs.set(d, path);
      }
    }
    ok(probs.length === 0 && titles.size >= 13, `pages: valid search data, unique titles/descriptions, self canonicals, no template leftovers (${titles.size} indexed pages) ${probs.slice(0, 4).join(' | ')}`);
  }
  // Every internal link and #section jump on every built page goes somewhere real.
  {
    const { readdirSync, statSync } = await import('node:fs');
    const D = 'dist-real';
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const x = `${d}/${f}`; return statSync(x).isDirectory() ? walk(x) : [x]; });
    const pages = walk(D).filter((f) => f.endsWith('.html'));
    const redirects = new Set(readFileSync(`${D}/_redirects`, 'utf8').split('\n').map((l) => l.split(' ')[0]).filter(Boolean));
    const fileFor = (p: string) => [p === '/' ? '/index.html' : p + '.html', p, p + '/index.html'].map((x) => D + x).find((x) => existsSync(x) && statSync(x).isFile());
    const ids = (f: string) => new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    const broken: string[] = [];
    let checked = 0;
    for (const f of pages) {
      const here = '/' + f.slice(D.length + 1).replace(/\.html$/, '').replace(/^index$/, '');
      for (const [, href] of readFileSync(f, 'utf8').matchAll(/\shref="([^"]+)"/g)) {
        if (/^(https?:|mailto:|tel:|sms:|data:)/.test(href)) continue;
        const [path, frag] = href.split('#');
        const target = path ? path.replace(/\/$/, '') || '/' : here || '/';
        if (path && redirects.has(target)) { checked++; continue; }
        const file = fileFor(target);
        if (!file) { broken.push(`${f}: ${href} (no page)`); continue; }
        if (frag && file.endsWith('.html') && !ids(file).has(frag)) broken.push(`${f}: ${href} (no #${frag})`);
        checked++;
      }
    }
    ok(broken.length === 0 && checked > 100, `links: ${checked} internal links on ${pages.length} pages all resolve ${broken.slice(0, 5).join(' | ')}`);
  }
} finally {
  await browser.close();
  for (const s of servers) try { process.kill(-s.pid!); } catch {}
}
console.log(`${good} passed, ${bad} failed`);
// Remember which code passed, so `npm run deploy` can refuse untested changes.
{ const { sourceHash, PASS_FILE } = await import('./source-hash.ts'); const { writeFileSync, rmSync } = await import('node:fs');
  if (bad) rmSync(PASS_FILE, { force: true }); else writeFileSync(PASS_FILE, sourceHash() + '\n'); }
process.exit(bad ? 1 : 0);
