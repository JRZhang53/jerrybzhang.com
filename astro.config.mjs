// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jerrybzhang.com',
  // Preserve spaces around inline links while upgrading to Astro 7.
  compressHTML: true,
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
