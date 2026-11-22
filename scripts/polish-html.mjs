// Runs after the build, on the built HTML, so posts and components are covered by one rule:
//   1. every link that leaves the site opens in a new tab, so readers keep their place
//   2. quotes written entirely in English are marked lang="en" and get an English typeface
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://aiwlulu.github.io';
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)));
let changed = 0;
let quotes = 0;
for (const file of walk('dist').filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  const out = html.replace(/<a\b([^>]*?)href="(https?:\/\/[^"]*)"([^>]*)>/g, (tag, before, href, after) => {
    if (href.startsWith(SITE) || /\btarget=/.test(before + after)) return tag;
    changed++;
    const rest = (before + after).replace(/\s*rel="[^"]*"/, '');
    const cls = /class="/.test(rest) ? rest.replace(/class="/, 'class="external ') : `${rest} class="external"`;
    return `<a${cls.startsWith(' ') ? '' : ' '}${cls.trim() ? cls.replace(/\s+$/, '') + ' ' : ''}href="${href}" target="_blank" rel="noopener noreferrer">`;
  });
  const done = out.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (tag, inner) => {
    const text = inner.replace(/<[^>]+>/g, '');
    if (/[\u3400-\u9fff]/.test(text) || !/[A-Za-z]{3}/.test(text)) return tag;
    quotes++;
    return `<blockquote lang="en" class="en">${inner}</blockquote>`;
  });
  if (done !== html) fs.writeFileSync(file, done);
}
console.log(`external links: ${changed} set to open in a new tab; English quotes: ${quotes}`);
