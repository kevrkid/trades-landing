// npm run deploy: checks the config, builds the site and publishes it to Cloudflare Pages.
// Login: `npx wrangler login` once on a machine with a browser, or set CLOUDFLARE_API_TOKEN
// and CLOUDFLARE_ACCOUNT_ID as env vars on a headless server. Never put them in a file in git.
import { execSync, spawnSync } from 'node:child_process';
import { business } from '../src/data/business.ts';
import { todos } from '../src/lib/derive.ts';

delete process.env.SAMPLE_DATA;
const missing = todos().filter((t) => t.blocker);
if (missing.length && process.env.ALLOW_INCOMPLETE !== '1') {
  console.error('Not publishing yet. People scanning the van would land on a page missing:');
  missing.forEach((t) => console.error('  - ' + t.item));
  console.error('Fill these in at src/data/business.ts. To publish anyway: ALLOW_INCOMPLETE=1 npm run deploy');
  process.exit(1);
}
const run = (cmd: string) => execSync(cmd, { stdio: 'inherit' });
run('npm run -s images');
run('npm run -s build');
// The delivery pages show unconfirmed facts as [[TODO: ...]]. Never publish those.
const left = execSync("grep -rlF '[[TODO' dist --include='*.html' || true", { encoding: 'utf8' }).trim();
if (left && process.env.ALLOW_INCOMPLETE !== '1') {
  console.error('Not publishing yet. These pages still show [[TODO]] placeholders (fill them in src/data/delivery.ts and cities.ts):');
  left.split('\n').forEach((f) => console.error('  - ' + f));
  console.error('Run `npm run todo` for the list. To publish anyway: ALLOW_INCOMPLETE=1 npm run deploy');
  process.exit(1);
}
const project = business.cloudflareProject;
const made = spawnSync('npx', ['wrangler', 'pages', 'project', 'create', project, '--production-branch', 'main'], { encoding: 'utf8' });
const said = `${made.stdout}${made.stderr}`;
if (made.status !== 0 && !/already exists/i.test(said)) { console.error(said); process.exit(1); }
run(`npx wrangler pages deploy dist --project-name ${project} --branch main --commit-dirty=true`);
