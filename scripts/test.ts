// npm run test: builds the site with sample data and with your real config, serves both on
// Cloudflare's local server, and checks them in a phone-sized browser.
// Screenshots go to SHOTS (default: test-shots/).
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { business } from '../src/data/business.ts';
import { todos } from '../src/lib/derive.ts';
import { deliveryPaths } from '../src/lib/site.ts';
import { delivery } from '../src/data/delivery.ts';

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

  // Real config: the survey with no outside service, from first question to send.
  await page.goto(R + '/');
  const survey = page.locator('#quote-form');
  ok(await survey.isVisible(), 'real: survey shows');
  await page.locator('#quote-next').click();
  ok(await page.locator('[data-step="1"]').isVisible(), 'survey will not move on until a service is picked');
  await page.locator('label.choice', { hasText: 'Moving in Texas' }).click();
  await page.locator('#quote-next').click();
  await page.locator('[name=moving_from]').fill('78641');
  await page.locator('[name=moving_to]').fill('76504');
  await page.locator('[name=moving_size]').selectOption('2 bedrooms');
  ok(!(await page.locator('[name=junk_what]').isVisible()), 'survey hides other jobs');
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
  ok(mailto.startsWith('mailto:' + business.email) && mailto.includes('Service: Moving in Texas') && mailto.includes('Moving to: 76504') && mailto.includes('When: This week') && mailto.includes('Name: Test Person') && !mailto.includes('Junk'), 'email has the answers');
  await page.screenshot({ path: `${SHOTS}/survey-send.png` });
  await page.locator('#quote-edit').click();
  ok(await survey.isVisible() && await page.locator('[name=moving_to]').inputValue() === '76504', 'can go back and change answers');
  const nojsF = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const nf2 = await nojsF.newPage();
  await nf2.goto(R + '/');
  ok(await nf2.locator('[name=moving_from]').isVisible() && await nf2.locator('[name=name]').isVisible(), 'no JS: the whole form still shows');
  await nojsF.close();
  // Real work.
  await page.goto(R + '/');
  ok((await page.locator('#how').innerText()).includes('Answer a few quick questions.'), 'real: how-it-works sentence starts with a capital');
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
  ok(await calmPage.locator('#work video').first().evaluate((v: HTMLVideoElement) => v.controls && v.paused), 'real: reduced-motion visitors get a play button instead');
  await calmCtx.close();
  await page.goto(R + '/');
  ok(await page.locator('#work img').count() === business.photos.gallery.length, 'real: work photos show');
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
  ok((await page.locator('header').innerText()).includes('/HOUR') || (await page.locator('header').innerText()).includes('/hour'), 'real: rate shows near the top');
  ok(await page.locator('#services').getByText('$60-$100/hour').count() === business.trades.flatMap((t) => t.services).filter((s) => s.price.type === 'hourly').length, 'real: every hourly service shows the hourly rate');
  if (!business.faq.extras) ok(!/anything extra on top/i.test(await page.locator('#faq').evaluate((e) => e.textContent || '')), 'real: unanswered FAQ question stays hidden');
  if (!business.rating.score) ok(await page.locator('header').getByText('reviews').count() === 0, 'real: no rating until you have one');
  ok(await page.getByText('3 hours of work comes to $180-$300').count() === 1, 'real: worked example shows');
  if (todos().some((t) => t.blocker)) ok(await page.locator('meta[name=robots][content=noindex]').count() === 1, 'real: unfinished site stays out of Google');
  ok(!/rangebolt|arc &(amp;)? haul/i.test(home), 'real: old names are gone');
  ok(await page.getByText('Locker Box').count() > 0, 'real: name shows');
  ok(!/handle your move myself|sampletown/i.test(home), 'real: removed wording stays gone');
  ok(await page.locator('header').getByText('All-electric van', { exact: true }).count() === 1, 'real: all-electric line shows once at the top');
  ok(await page.locator('#area').getByText('Central Texas').count() === 1 && await page.locator('#area').getByText('Moves anywhere in Texas.').count() === 1, 'real: service area shows');
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

  // ---------- Delivery pages ----------
  const dPages = [...deliveryPaths, '/quote-sent'];
  for (const width of [375, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 850 }, isMobile: width < 500, hasTouch: width < 500 });
    const pg = await ctx.newPage();
    const errs: string[] = [];
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('pageerror', (e) => errs.push(String(e)));
    for (const [base, tag] of [[S, 'sample'], [R, 'real']] as const) {
      for (const p of dPages) {
        errs.length = 0;
        const res = await pg.goto(base + p);
        ok(res?.status() === 200, `${tag} ${width} ${p}: loads`);
        ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag} ${width} ${p}: no sideways scroll`);
        ok(!errs.length, `${tag} ${width} ${p}: no console errors ${errs.join(' | ')}`);
        ok(await pg.locator('h1').count() === 1, `${tag} ${width} ${p}: one h1`);
        ok(await pg.locator('.s-header a', { hasText: 'Get a quote' }).first().isVisible(), `${tag} ${width} ${p}: header Get a quote`);
        if (tag === 'sample') {
          const small = await pg.$$eval('a,button,select,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,summary', (els) =>
            els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44 && !e.closest('p') && !e.classList.contains('underline'); }).map((e) => e.outerHTML.slice(0, 80)));
          ok(!small.length, `${tag} ${width} ${p}: tap targets 44px+ ${small.join(' | ')}`);
          ok(await pg.locator(width < 768 ? '.s-bar a[href^="tel:"]' : '.s-header a[href^="tel:"]').first().isVisible(), `${tag} ${width} ${p}: click-to-call visible`);
        }
        ok(await pg.locator('.s-bar').isVisible() === (width < 768), `${tag} ${width} ${p}: bottom bar only on phones`);
        const desc = await pg.locator('meta[name=description]').getAttribute('content');
        ok(!!desc && desc.length > 50, `${tag} ${width} ${p}: has a meta description`);
        if (p === '/delivery' || p === '/delivery/taylor' || p === '/quote') await pg.screenshot({ path: `${SHOTS}/${tag}-${width}${p.replace(/\//g, '-')}.png`, fullPage: true });
      }
    }
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    // Titles are unique.
    const titles = new Set<string>();
    for (const p of deliveryPaths) { await pg.goto(S + p); titles.add(await pg.title()); }
    ok(titles.size === deliveryPaths.length, 'delivery pages have unique titles');
    // Structured data.
    await pg.goto(S + '/delivery');
    const lds = (await pg.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    const lb = lds.find((x) => x['@type'] === 'LocalBusiness');
    ok(lb && lb.telephone === '+15125550100' && lb.areaServed.some((a: any) => a['@type'] === 'State' && a.name === 'Texas') && !lb.address.streetAddress, 'LocalBusiness JSON-LD: phone, Texas, no street address');
    const fq = lds.find((x) => x['@type'] === 'FAQPage');
    ok(fq && fq.mainEntity.length > 0 && !JSON.stringify(lds).includes('[[TODO'), 'FAQPage JSON-LD has only finished answers');
    ok(await pg.locator('meta[property="og:image"]').getAttribute('content') === 'https://example.com/og-delivery.png', 'delivery OG image');
    ok((await fetch(S + '/og-delivery.png')).status === 200, 'delivery OG image loads');
    ok(readFileSync('dist-sample/sitemap.xml', 'utf8').includes('https://example.com/delivery/taylor') && !readFileSync('dist-sample/sitemap.xml', 'utf8').includes('quote-sent'), 'sitemap lists delivery and city pages, not quote-sent');
    ok(await pg.locator('#services article').count() === delivery.levels.length + (delivery.twoPerson ? 1 : 0), 'service cards: two-person card only when confirmed');
    ok(await pg.locator('#record').count() === (delivery.trackRecord || delivery.reviews.length ? 1 : 0), 'track record only with real numbers');
    ok(!(await pg.content()).match(/24\/7|world-class|best-in-class|ISO 9001|SmartWay/i), 'no banned claims');
    ok(await pg.locator('a[href*="safer.fmcsa.dot.gov"]').count() > 0, 'SAFER link');

    // Quote form, Web3Forms mode, end to end (the network call is caught and answered here).
    const posts: string[] = [];
    await pg.route('https://api.web3forms.com/**', (r) => { posts.push(r.request().postData() || ''); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
    await pg.locator('#services a[data-level="sameday"]').click();
    ok(await pg.locator('#quote-form input[value="Same-day"]').isChecked(), '"Quote this" picks the service level');
    const f = pg.locator('#quote-form');
    await f.locator('input[name=service_level]').first().uncheck().catch(() => {});
    await pg.evaluate(() => document.querySelectorAll<HTMLInputElement>('#quote-form input[name=service_level]').forEach((x) => (x.checked = false)));
    await f.locator('.lead-next').click();
    ok(await f.locator('[name=items]').isHidden(), 'quote form will not leave step 1 with required fields empty');
    await f.locator('label.s-radio', { hasText: 'Hot shot' }).click();
    await f.locator('[name=pickup]').fill('78641');
    await f.locator('[name=delivery]').fill('76574');
    await f.locator('[name=date_needed]').fill('2030-01-15');
    await f.locator('[name=time_needed]').fill('by 10 AM');
    await f.locator('[name=name]').fill('Test Person');
    await f.locator('[name=company]').fill('Test Electric');
    await f.locator('[name=phone]').fill('5125550199');
    await f.locator('[name=email]').fill('not-an-email');
    await f.locator('.lead-next').click();
    ok(await f.locator('[name=items]').isHidden(), 'quote form checks the email address');
    await f.locator('[name=email]').fill('test@example.com');
    await f.locator('.lead-next').click();
    ok(await f.locator('[name=items]').isVisible(), 'quote form moves to step 2');
    await f.locator('.lead-submit').click();
    ok(posts.length === 0 && await f.isVisible(), 'quote form requires the load details');
    await f.locator('[name=items]').fill('Two 200A breakers');
    await f.locator('[name=pieces]').fill('2 boxes');
    await f.locator('[name=weight]').fill('60');
    await f.locator('[name=access]').fill('Gate 3, badge needed');
    await pg.screenshot({ path: `${SHOTS}/quote-step2.png` });
    await f.locator('.lead-submit').click();
    await pg.locator('#quote-form-done').waitFor({ state: 'visible' });
    ok(await pg.locator('#quote-form-done h3[data-mode=sent]').isVisible() && await pg.locator('#quote-form-done').getByText('What happens next').isVisible(), 'quote form shows the confirmation');
    ok(await pg.locator('#quote-form-done a[href="tel:+15125550100"]').count() === 1, 'confirmation has the phone number');
    const body = posts[0] || '';
    ok(posts.length === 1 && body.includes('sample-key') && body.includes('Two 200A breakers') && body.includes('Gate 3') && body.includes('Hot shot') && body.includes('Delivery page') && !/name="redirect"/.test(body), 'quote reaches Web3Forms with every answer');
    await pg.screenshot({ path: `${SHOTS}/quote-done.png` });
    // Honeypot: a bot ticking the hidden box gets a fake success and nothing is sent.
    await pg.goto(S + '/quote');
    posts.length = 0;
    await pg.route('https://api.web3forms.com/**', (r) => { posts.push(r.request().postData() || ''); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
    const q = pg.locator('#quote-form');
    await q.locator('label.s-radio', { hasText: 'Not sure' }).click();
    for (const [n, v] of [['pickup', '1'], ['delivery', '2'], ['date_needed', '2030-01-15'], ['time_needed', 'noon'], ['name', 'Bot'], ['phone', '5125550199'], ['email', 'b@example.com']]) await q.locator(`[name=${n}]`).fill(v);
    await q.locator('.lead-next').click();
    for (const [n, v] of [['items', 'x'], ['pieces', '1'], ['weight', '1']]) await q.locator(`[name=${n}]`).fill(v);
    await pg.evaluate(() => { (document.querySelector('#quote-form [name=botcheck]') as HTMLInputElement).checked = true; });
    await q.locator('.lead-submit').click();
    await pg.waitForTimeout(300);
    ok(posts.length === 0 && await pg.locator('#quote-form-done').isVisible(), 'honeypot: bot gets a fake success, nothing sent');
    ok(await pg.locator('#quote-form [name=botcheck]').isHidden(), 'honeypot is hidden');
    // Failure: the visitor is told and can call.
    await pg.goto(S + '/safety');
    await pg.route('https://api.web3forms.com/**', (r) => r.fulfill({ status: 500, body: '{}' }));
    const dfm = pg.locator('#docs-form');
    await dfm.locator('[name=name]').fill('A'); await dfm.locator('[name=company]').fill('B'); await dfm.locator('[name=email]').fill('a@example.com');
    await dfm.locator('.lead-submit').click();
    await pg.waitForTimeout(300);
    ok(await dfm.locator('.s-form-error').isVisible() && await dfm.isVisible(), 'a failed send shows an error and keeps the answers');
    await pg.route('https://api.web3forms.com/**', (r) => { posts.push(r.request().postData() || ''); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
    posts.length = 0;
    await dfm.locator('input[value="Certificate of insurance (COI)"]').uncheck();
    await dfm.locator('.lead-submit').click();
    await pg.waitForTimeout(200);
    ok(posts.length === 0, 'COI/W-9 form needs at least one document');
    await dfm.locator('input[value="W-9"]').check();
    await dfm.locator('.lead-submit').click();
    await pg.locator('#docs-form-done').waitFor({ state: 'visible' });
    ok(posts.length === 1 && posts[0].includes('COI / W-9 request') && posts[0].includes('W-9'), 'COI/W-9 request is sent');
    ok(!existsSync('dist-sample/coi.pdf') && !existsSync('dist-sample/w9.pdf'), 'no documents posted as public files');
    await ctx.close();

    // No JavaScript: the whole form is one plain page that posts to Web3Forms and comes back to /quote-sent.
    const nj = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 800 } });
    const np2 = await nj.newPage();
    await np2.goto(S + '/quote');
    ok(await np2.locator('#quote-form [name=pickup]').isVisible() && await np2.locator('#quote-form [name=items]').isVisible() && await np2.locator('#quote-form .lead-submit').isVisible(), 'no JS: both steps and the submit button show');
    ok(await np2.locator('#quote-form').getAttribute('action') === 'https://api.web3forms.com/submit' && await np2.locator('#quote-form [name=redirect]').getAttribute('value') === 'https://example.com/quote-sent', 'no JS: posts to Web3Forms, returns to /quote-sent');
    ok(await np2.locator('.s-menu summary').isVisible(), 'no JS: phone menu still opens (details/summary)');
    await nj.close();
    const qs = await (await fetch(S + '/quote-sent')).text();
    ok(qs.includes('noindex') && qs.includes('What happens next'), '/quote-sent is a noindex confirmation page');
  }
  {
    // Real config: mailto mode end to end, TODO markers visible, unfinished pages kept out of Google.
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage();
    await pg.goto(R + '/delivery');
    if (business.web3formsKey === '') {
      const f = pg.locator('#quote-form');
      ok((await f.getAttribute('action')) === `mailto:${business.email}`, 'real: quote form falls back to email');
      await f.locator('label.s-radio', { hasText: 'Scheduled' }).click();
      for (const [n, v] of [['pickup', '78641'], ['delivery', '78201'], ['date_needed', '2030-02-01'], ['time_needed', '1-3 PM window'], ['name', 'Real Test'], ['phone', '5125550199'], ['email', 'r@example.com']]) await f.locator(`[name=${n}]`).fill(v);
      await f.locator('.lead-next').click();
      for (const [n, v] of [['items', 'Conduit fittings'], ['pieces', '1 pallet'], ['weight', '400']]) await f.locator(`[name=${n}]`).fill(v);
      await f.locator('.lead-submit').click();
      ok(await pg.locator('#quote-form-done h3[data-mode=mail]').isVisible(), 'real: send-by-email step shows');
      const m = decodeURIComponent((await pg.locator('#quote-form-done [data-mail]').getAttribute('href'))!);
      ok(m.startsWith('mailto:' + business.email) && m.includes('Service level: Scheduled / next-day') && m.includes('Weight: 400') && m.includes('Came from: Delivery page'), 'real: email has every answer');
      await pg.screenshot({ path: `${SHOTS}/real-quote-mail.png` });
      await pg.locator('#quote-form-done [data-edit]').click();
      ok(await f.isVisible() && await f.locator('[name=pickup]').inputValue() === '78641', 'real: can go back and change answers');
    }
    const todoLeft = (await pg.locator('mark.todo').count()) > 0;
    ok(todoLeft ? await pg.locator('meta[name=robots][content=noindex]').count() === 1 : true, 'real: pages with TODOs stay out of Google');
    ok(!JSON.stringify(await pg.locator('script[type="application/ld+json"]').allTextContents()).includes('[[TODO'), 'real: no TODO in structured data');
    ok(!(await pg.content()).includes('9994372'), 'real: old DOT number not used');
    await pg.goto(R + '/');
    ok(await pg.locator('a[href="/delivery"]').count() > 0, 'real: home links to the delivery pages');
    await ctx.close();
  }
} finally {
  await browser.close();
  for (const s of servers) try { process.kill(-s.pid!); } catch {}
}
console.log(`${good} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
