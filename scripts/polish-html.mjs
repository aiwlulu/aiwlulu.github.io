// Runs after the build, on the built HTML, so posts and components are covered by one rule:
//   1. every link that leaves the site opens in a new tab, so readers keep their place
//   2. quotes written entirely in English are marked lang="en" and get an English typeface
//   3. code blocks get their bar (language, wrap switch, copy) and one block per line
//   4. tables are put in a frame that can scroll sideways
import fs from 'node:fs';
import path from 'node:path';
import { codeBar, joinLines } from '../src/scripts/code-block.js';

const SITE = 'https://aiwlulu.github.io';
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)));
let changed = 0;
let quotes = 0;
let blocks = 0;
let tables = 0;
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
  const coded = done.replace(/<pre class="astro-code[^>]*data-language="([^"]*)"[^>]*>[\s\S]*?<\/pre>/g, (pre, language) => {
    if (language === 'mermaid') return pre; // drawn as a diagram in the browser
    blocks++;
    return `<div class="post-code" data-language="${language}">${codeBar(language)}${joinLines(pre)}</div>`;
  });
  const framed = coded.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
    tables++;
    return `<div class="post-table" role="region" aria-label="表格" tabindex="0">${table}</div>`;
  });
  if (framed !== html) fs.writeFileSync(file, framed);
}
console.log(`external links: ${changed} set to open in a new tab; English quotes: ${quotes}; code blocks: ${blocks}; tables: ${tables}`);
