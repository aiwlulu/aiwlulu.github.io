import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Old Hugo URLs that had duplicates or pagination; each points at its single canonical page.
const redirects = {
  '/blog/001_the-beginning': '/blog/the-beginning/',
  '/blog/002_snipaste': '/blog/snipaste/',
  '/blog/003_emotional-first-aid': '/blog/emotional-first-aid/',
  '/blog/004_why-learn-history': '/blog/why-learn-history/',
  '/blog/why_learn_history': '/blog/why-learn-history/',
  '/blog/20210308_a-mind-for-numbers': '/blog/a-mind-for-numbers/',
  '/blog/page/1': '/blog/',
  '/blog/page/2': '/blog/',
  '/blog/page/3': '/blog/',
  '/page/1': '/',
  '/page/2': '/',
  '/contact': '/about/',
  // Tags retired when the tag list was trimmed to topics.
  '/tags/hugo': '/tags/',
  '/tags/github': '/tags/',
  '/tags/hahow': '/tags/',
  '/tags/english': '/tags/',
  '/tags/tools': '/tags/效率/',
};

export default defineConfig({
  site: 'https://aiwlulu.github.io',
  trailingSlash: 'always',
  redirects,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // The search page is noindex, so it stays out of the sitemap too.
  integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/search/') && !Object.keys(redirects).some((r) => decodeURI(page).endsWith(r + '/')) })],
  // Small fonts would otherwise be inlined into the render-blocking stylesheet as base64.
  vite: { build: { assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined) } },
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false } },
});
