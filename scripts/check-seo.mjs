// Checks every built page in dist/ for the SEO basics. Run after `npm run build`.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = 'https://aiwlulu.github.io';
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)));
const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));
const urlOf = (f) => '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
const known = new Set([...pages.map(urlOf), ...files.map((f) => '/' + path.relative(DIST, f))]);
const attr = (html, re) => html.match(re)?.[1];
// Count CJK as 2 and Latin as 1, close to how search results measure width.
const width = (s) => [...s].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e7f ? 2 : 1), 0);

let problems = 0;
let checked = 0;
let redirects = 0;
const titles = new Map();
const descriptions = new Map();
const fail = (page, msg) => { problems++; console.log(`  FAIL ${page}: ${msg}`); };

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const page = urlOf(file);
  if (/http-equiv="refresh"/.test(html)) {
    redirects++;
    const to = attr(html, /url=([^"]+)"/);
    if (!to || !known.has(decodeURI(to))) fail(page, `redirects to a missing page ${to}`);
    if (!/rel="canonical"/.test(html)) fail(page, 'redirect has no canonical');
    continue;
  }
  checked++;
  const noindex = /name="robots" content="noindex"/.test(html);
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /name="description" content="([^"]*)"/);
  const canonical = attr(html, /rel="canonical" href="([^"]*)"/);

  if (!/<html lang="zh-Hant-TW"/.test(html)) fail(page, 'html lang is not zh-Hant-TW');
  if (!title) fail(page, 'no <title>');
  else if (width(title) > 70) fail(page, `title is ${width(title)} wide, keep it within 70`);
  if (!desc) fail(page, 'no meta description');
  else if (width(desc) < 80 || width(desc) > 320) fail(page, `description is ${width(desc)} wide, aim for 80 to 320 (40 to 160 Chinese characters)`);
  if (!noindex) {
    if (canonical !== SITE + encodeURI(decodeURI(page)) && canonical !== SITE + page) fail(page, `canonical is ${canonical}`);
    if (titles.has(title)) fail(page, `same title as ${titles.get(title)}`);
    if (descriptions.has(desc)) fail(page, `same description as ${descriptions.get(desc)}`);
    titles.set(title, page);
    descriptions.set(desc, page);
  }
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(page, `${h1} <h1> elements, need exactly 1`);
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) if (!html.includes(`property="${p}"`)) fail(page, `missing ${p}`);

  // Heading levels must not skip (h2 -> h4).
  let last = 1;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const level = +m[1];
    if (level > last + 1) fail(page, `heading jumps from h${last} to h${level}`);
    last = level;
  }
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) {
    if (!/\balt\b/.test(img)) fail(page, `image without alt: ${img.slice(0, 80)}`);
    if (!/\bwidth=/.test(img) || !/\bheight=/.test(img)) fail(page, `image without width/height (causes layout shift): ${img.slice(0, 80)}`);
  }
  for (const a of html.match(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g) ?? []) {
    if (a.includes(`href="${SITE}`)) continue;
    if (!/target="_blank"/.test(a) || !/rel="[^"]*noopener/.test(a)) fail(page, `external link does not open in a new tab: ${a.slice(0, 90)}`);
  }
  for (const block of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(block[1]); } catch { fail(page, 'JSON-LD does not parse'); }
  }
  if (page.startsWith('/blog/') && page !== '/blog/' && !html.includes('"@type":"BlogPosting"')) fail(page, 'post has no BlogPosting JSON-LD');
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = decodeURI(m[1]);
    if (!known.has(href) && !known.has(href.replace(/\/?$/, '/'))) fail(page, `broken internal link ${href}`);
  }
}

for (const need of ['sitemap-index.xml', 'robots.txt', 'rss.xml', 'llms.txt', 'og.png', '404.html']) if (!fs.existsSync(path.join(DIST, need))) fail('/', `missing ${need}`);
const sitemap = fs.existsSync(`${DIST}/sitemap-0.xml`) ? fs.readFileSync(`${DIST}/sitemap-0.xml`, 'utf8') : '';
for (const r of pages.filter((f) => /http-equiv="refresh"/.test(fs.readFileSync(f, 'utf8')))) if (sitemap.includes(`<loc>${SITE}${urlOf(r)}</loc>`)) fail(urlOf(r), 'redirect is listed in the sitemap');

console.log(`${checked} pages and ${redirects} redirects checked`);
if (problems) { console.log(`${problems} problem(s)`); process.exit(1); }
console.log('all SEO checks pass');
