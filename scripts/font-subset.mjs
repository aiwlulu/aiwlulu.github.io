// Shared by make-fonts.mjs and page-fonts.mjs: cuts the rounded Chinese font down to a given set of
// characters. The font (Chiron GoRound TC, OFL-1.1) ships as 118 files split by unicode-range;
// each file that holds any wanted character becomes one small woff2 and one @font-face rule.
import fs from 'node:fs';
import subsetFont from 'subset-font';

export const FAMILY = 'Chiron GoRound TC';
const PKG = 'node_modules/@fontsource-variable/chiron-goround-tc';

const css = fs.readFileSync(`${PKG}/index.css`, 'utf8');
const faces = [...css.matchAll(/url\(\.\/files\/([^)]+)\)[^;]*;\s*unicode-range:\s*([^;]+);/g)].map(([, file, ranges]) => ({
  file,
  name: file.replace('-wght-normal', ''),
  ranges: ranges.split(',').map((part) => {
    const [a, b = a] = part.trim().replace(/^U\+/i, '').split('-').map((h) => parseInt(h, 16));
    return [a, b];
  }),
}));

/** Characters every build keeps: printable ASCII and common punctuation, so English text needs no rebuild. */
export const ALWAYS = (() => {
  const set = new Set();
  for (let c = 0x20; c < 0x7f; c++) set.add(c);
  for (const ch of '，。、；：！？（）「」『』《》〈〉…—～·•©') set.add(ch.codePointAt(0));
  return set;
})();

export const codePoints = (text) => {
  const set = new Set();
  for (const ch of text) set.add(ch.codePointAt(0));
  return set;
};

/**
 * Subsets the font to `chars` (a Set of code points). Calls write(name, bytes) for each file and
 * returns { rules, bytes, files } where each rule is an @font-face with src url(`${base}${fileName}`).
 * `name(face, bytes)` picks the file name.
 */
export async function subset(chars, { name, base, write }) {
  let rules = '', bytes = 0, files = 0;
  for (const face of faces) {
    const hit = [...chars].filter((c) => face.ranges.some(([a, b]) => c >= a && c <= b)).sort((x, y) => x - y);
    if (!hit.length) continue;
    // Keep only the weights the site uses.
    const small = await subsetFont(fs.readFileSync(`${PKG}/files/${face.file}`), String.fromCodePoint(...hit), { targetFormat: 'woff2', variationAxes: { wght: { min: 400, max: 900 } } });
    const file = name(face, small);
    write(file, small);
    const range = hit.map((c) => `U+${c.toString(16)}`).join(',');
    rules += `@font-face{font-family:'${FAMILY}';font-style:normal;font-display:swap;font-weight:400 900;src:url(${base}${file}) format('woff2');unicode-range:${range}}\n`;
    bytes += small.length;
    files++;
  }
  return { rules, bytes, files };
}

/**
 * Static TrueType cuts of the font at one weight, holding only the characters of `text`, for tools
 * that cannot read woff2 or variable fonts (satori, for the share images). One buffer per source file.
 */
export async function staticFonts(text, weight) {
  const chars = codePoints(text);
  const out = [];
  for (const face of faces) {
    const hit = [...chars].filter((c) => face.ranges.some(([a, b]) => c >= a && c <= b));
    if (!hit.length) continue;
    out.push(await subsetFont(fs.readFileSync(`${PKG}/files/${face.file}`), String.fromCodePoint(...hit), { targetFormat: 'truetype', variationAxes: { wght: weight } }));
  }
  return out;
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] !== '#') return NAMED[e.toLowerCase()] ?? m;
  return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
});

/** Text a reader can see on the page: the body without scripts, styles and tags, plus placeholders. */
export const visibleText = (html) => {
  const body = html.slice(html.indexOf('<body'));
  const attrs = [...body.matchAll(/\splaceholder="([^"]*)"/g)].map((m) => m[1]).join('');
  const text = body.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '');
  return decode(text + attrs);
};
