// Runs after the build. The shared font (make-fonts.mjs --core) covers only the site frame; this
// gives each page a second small font with the characters its own text needs, declared in an
// inline <style> under the same family. Pages that share a character set share the files.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { codePoints, subset, visibleText } from './font-subset.mjs';

const DIST = 'dist';
const OUT = `${DIST}/_astro`;
const core = codePoints(fs.readFileSync('src/fonts/core.txt', 'utf8'));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)));
const written = new Set();
let pages = 0, total = 0;
const files = walk(DIST).filter((f) => f.endsWith('.html'));
const own = (html) => [...codePoints(visibleText(html))].filter((c) => !core.has(c) && c > 0x7f && !/\s/.test(String.fromCodePoint(c)));
// A page marked data-font-all (search) shows text from any page, so it gets every character.
const all = new Set(files.flatMap((f) => own(fs.readFileSync(f, 'utf8'))));
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const need = html.includes('data-font-all') ? all : new Set(own(html));
  if (!need.size) continue;
  const { rules, bytes } = await subset(need, {
    base: '/_astro/',
    name: (face, data) => `${face.name}-${crypto.createHash('sha256').update(data).digest('hex').slice(0, 10)}.woff2`,
    write: (name, data) => {
      if (written.has(name)) return;
      written.add(name);
      fs.writeFileSync(`${OUT}/${name}`, data);
    },
  });
  if (!html.includes('</head>')) throw new Error(`${file}: no </head>`);
  fs.writeFileSync(file, html.replace('</head>', `<style data-page-fonts>${rules.trim()}</style></head>`));
  pages++;
  total += bytes;
}
console.log(`page fonts: ${pages} pages, ${written.size} files, ${(total / pages / 1024).toFixed(0)}KB per page on average`);
