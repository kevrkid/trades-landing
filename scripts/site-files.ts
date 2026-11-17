// Writes the small generated files after each build: redirects, headers, sitemap,
// robots and the "save my number" contact card.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { biz, siteUrl } from '../src/lib/derive.ts';

export function siteFiles() {
  return {
    name: 'site-files',
    hooks: {
      'astro:build:done': ({ dir }: { dir: URL }) => {
        const out = fileURLToPath(dir);
        const write = (name: string, text: string) => writeFileSync(join(out, name), text);
        const url = siteUrl();

        // A link that isn't set yet goes home instead of a dead end.
        write('_redirects', [
          `/book ${biz.links.booking || '/'} 302`,
          `/pay ${biz.links.deposit || '/'} 302`,
          `/review ${biz.links.googleReview || '/'} 302`,
        ].join('\n') + '\n');

        write('_headers', [
          '/*', '  X-Content-Type-Options: nosniff', '  Referrer-Policy: strict-origin-when-cross-origin', '  X-Frame-Options: DENY',
          '/_astro/*', '  Cache-Control: public, max-age=31536000, immutable',
          '/contact.vcf', '  Content-Type: text/vcard; charset=utf-8', '  Content-Disposition: attachment; filename="contact.vcf"',
        ].join('\n') + '\n');

        write('robots.txt', `User-agent: *\nAllow: /\n${url ? `Sitemap: ${url}/sitemap.xml\n` : ''}`);

        if (url) {
          const locs = ['/', '/freight', '/privacy'].map((p) => `  <url><loc>${url}${p === '/' ? '/' : p}</loc></url>`).join('\n');
          write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs}\n</urlset>\n`);
        }

        if (biz.phone) {
          const card = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${biz.name || 'My tradesperson'}`];
          if (biz.name) card.push(`ORG:${biz.name}`);
          card.push(`TEL;TYPE=CELL:${biz.phone}`);
          if (biz.email) card.push(`EMAIL:${biz.email}`);
          if (url) card.push(`URL:${url}`);
          card.push('END:VCARD');
          write('contact.vcf', card.join('\r\n') + '\r\n');
        }
      },
    },
  };
}
