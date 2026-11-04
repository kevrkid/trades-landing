// npm run todo: lists what's still blank in src/data/business.ts
import { todos } from '../src/lib/derive.ts';
const all = todos();
const must = all.filter((t) => t.blocker);
const rest = all.filter((t) => !t.blocker);
if (must.length) { console.log('\nNeeded before going live:'); must.forEach((t) => console.log('  [ ] ' + t.item)); }
if (rest.length) { console.log('\nHidden on the site until you add it:'); rest.forEach((t) => console.log('  [ ] ' + t.item)); }
if (!all.length) console.log('Nothing left to fill in.');
console.log('');
