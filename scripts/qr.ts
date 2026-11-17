// npm run qr: makes qr/van-qr.svg and qr/van-qr.png for the wrap shop.
// Error correction Q, 4-module quiet zone, black on white, no logo.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { biz } from '../src/lib/derive.ts';

// The pages.dev address keeps working even after a custom domain is added, so it is safe to print.
const domain = process.env.QR_DOMAIN || biz.domain || biz.temporaryUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
if (!domain) {
  console.error('No domain or temporaryUrl yet. Add one to src/data/business.ts first, then run this again.\nDo not print a QR code before then: a van wrap is expensive to redo.');
  process.exit(1);
}
const dir = process.env.QR_DIR || 'qr';
mkdirSync(dir, { recursive: true });
const url = `https://${domain}/van`;
const opts = { errorCorrectionLevel: 'Q' as const, margin: 4, color: { dark: '#000000', light: '#ffffff' } };
writeFileSync(join(dir, 'van-qr.svg'), await QRCode.toString(url, { ...opts, type: 'svg' }));
await QRCode.toFile(join(dir, 'van-qr.png'), url, { ...opts, type: 'png', width: 2048 });
console.log(`Made ${dir}/van-qr.svg and ${dir}/van-qr.png for ${url}`);
