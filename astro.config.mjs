import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { siteFiles } from './scripts/site-files.ts';
import { siteUrl } from './src/lib/derive.ts';

export default defineConfig({
  site: siteUrl() || undefined,
  outDir: process.env.OUT_DIR || 'dist',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
  integrations: [siteFiles()],
});
