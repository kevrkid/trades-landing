// A fingerprint of everything that shapes the built site. `npm test` saves it to .test-pass when every check
// passes, and `npm run deploy` refuses to publish code whose fingerprint doesn't match (i.e. untested changes).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';

const ROOTS = ['src', 'scripts', 'brand-source', 'package.json', 'astro.config.mjs'];
const walk = (p: string): string[] => statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((f) => walk(`${p}/${f}`)) : [p];

export function sourceHash(): string {
  const h = createHash('sha256');
  for (const f of ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } })) h.update(f + '\0').update(readFileSync(f)).update('\0');
  return h.digest('hex');
}
export const PASS_FILE = '.test-pass';
