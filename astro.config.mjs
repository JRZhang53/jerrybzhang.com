// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { mathOptions, rehypeMathFinish } from './src/lib/math';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://jerrybzhang.com',
  // Preserve spaces around inline links while upgrading to Astro 7.
  compressHTML: true,
  integrations: [react(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, mathOptions], rehypeMathFinish],
    }),
  },
  vite: { plugins: [tailwindcss()] },
});
