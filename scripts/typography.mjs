// Chinese typesetting rules for post content. Usage:
//   node scripts/typography.mjs          check; exits 1 and lists the lines that need changes
//   node scripts/typography.mjs --fix    rewrite the files
//
// Rules:
//   1. One half-width space between Chinese and English words or numbers; none next to full-width punctuation.
//   2. Punctuation in Chinese text is full-width: ，！？：； and paired （）.
//   3. One space on each side of **bold**, except at the start or end of a line or next to full-width punctuation.
// Left alone: code, URLs, HTML/JSX tags, English sentences, square brackets, and full stops (too ambiguous: "e.g.", "1.").
import fs from 'node:fs';
import path from 'node:path';

const CJK = '\\u3400-\\u4dbf\\u4e00-\\u9fff';
const FULL = '，。、；：！？（）「」『』《》〈〉';
const LATIN = 'A-Za-z0-9';
const TO_FULL = { ',': '，', '!': '！', '?': '？', ':': '：', ';': '；' };
// Private-use characters stand in for protected spans while the rules run.
const MASK = (i) => String.fromCharCode(0xe000 + i);
const MASKS = '\\ue000-\\uf8ff';
const hasCjkRe = new RegExp(`[${CJK}]`);
const SPACE = ' \\t\\u00a0';
// Names that must stay exactly as written.
const KEEP = ['SuperY超級歪'];

export function typeset(text) {
  const kept = [];
  const keep = (s) => { kept.push(s); return MASK(kept.length - 1); };
  let s = text;
  for (const name of KEEP) s = s.split(name).join(keep(name));
  s = s
    .replace(/`[^`\n]*`/g, keep)                      // inline code
    .replace(/\]\([^)\n]*\)/g, (m) => ']' + keep(m.slice(1))) // link and image targets
    .replace(/<[^>\n]+>/g, keep)                      // HTML and JSX tags
    .replace(/https?:\/\/[^\s）)]+/g, keep);          // bare URLs

  // Rule 2: half-width punctuation that follows Chinese, or sits between a word and Chinese.
  s = s.replace(new RegExp(`([${CJK}${FULL}])[${SPACE}]*([,!?:;]+)(?!\\[)`, 'g'), (_, a, p) => a + [...p].map((c) => TO_FULL[c]).join(''));
  s = s.replace(new RegExp(`([${LATIN}])([,:;])\\s*(?=[${CJK}])`, 'g'), (_, a, p) => a + TO_FULL[p]);
  // Sentence-ending ! and ? after an English word, when the line itself is Chinese.
  if (hasCjkRe.test(s)) s = s.replace(new RegExp(`([${LATIN}])([!?]+)(?=$|[${CJK}${FULL}])`, 'g'), (_, a, p) => a + [...p].map((c) => TO_FULL[c]).join(''));
  // Paired parentheses that touch Chinese on either side or contain Chinese.
  s = s.replace(new RegExp(`(^|[^\\\\])\\(([^()\\n]*)\\)`, 'g'), (m, pre, inner, at) => {
    const before = s.slice(0, at + pre.length).trimEnd().slice(-1);
    const after = s.slice(at + m.length).trimStart().slice(0, 1);
    const near = (c) => c && new RegExp(`[${CJK}${FULL}]`).test(c);
    return near(before) || near(after) || hasCjkRe.test(inner) ? `${pre}（${inner.trim()}）` : m;
  });

  // Rule 1: space between Chinese and English or numbers, also across [link text] and its target.
  s = s.replace(new RegExp(`([${CJK}])(\\[?)(?=[${LATIN}])`, 'g'), (m, a, b) => `${a} ${b}`);
  s = s.replace(new RegExp(`([${CJK}])(\\[)(?=\\\\?\\[?[${LATIN}])`, 'g'), '$1 $2');
  s = s.replace(new RegExp(`([${LATIN}%])((?:\\][${MASKS}])?)(?=[${CJK}])`, 'g'), '$1$2 ');
  s = s.replace(new RegExp(`([${CJK}])(\\][${MASKS}])(?=[${LATIN}])`, 'g'), '$1$2 ');

  // Rule 3: breathing room around bold.
  s = s.replace(/\*\*([^*\n]+)\*\*/g, (m, inner, at) => {
    const before = s[at - 1];
    const after = s[at + m.length];
    const open = before === undefined || /\s/.test(before) || FULL.includes(before) || /^[\s>#-]*$/.test(s.slice(0, at)) ? '' : ' ';
    const close = after === undefined || /\s/.test(after) || FULL.includes(after) ? '' : ' ';
    return `${open}**${inner.trim()}**${close}`;
  });

  // Rule 1, second half: no spaces hugging full-width punctuation (list and quote markers keep theirs).
  const lead = s.match(/^\s*(?:>\s*|[-*+]\s+|\d+\\?\.\s+|#+\s+)*/)[0];
  let rest = s.slice(lead.length);
  rest = rest.replace(new RegExp(`[${SPACE}]+(?=[${FULL}])`, 'g'), '').replace(new RegExp(`(?<=[${FULL}])[${SPACE}]+`, 'g'), '');
  s = lead + rest;

  s = s.replace(new RegExp(`[${MASKS}]`, 'g'), (c) => kept[c.charCodeAt(0) - 0xe000]);
  // Inline code counts as English for spacing.
  return s.replace(new RegExp(`(\`[^\`\\n]*\`)(?=[${CJK}])`, 'g'), '$1 ').replace(new RegExp(`([${CJK}])(?=\`[^\`\\n]*\`)`, 'g'), '$1 ');
}

// Applies typeset() to prose lines only: front matter text fields and the body outside code fences.
export function typesetFile(source) {
  const lines = source.split('\n');
  let inFront = false, frontDone = false, inFence = false;
  return lines.map((line, i) => {
    if (line.trim() === '---' && !frontDone && (i === 0 || inFront)) { frontDone = inFront; inFront = !inFront; return line; }
    if (inFront) {
      const m = line.match(/^(title|subtitle|description): '(.*)'$/);
      return m ? `${m[1]}: '${typeset(m[2])}'` : line;
    }
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return line; }
    // Indented lines are code, unless they are nested list items.
    const nestedItem = /^\s+(?:[-*+]|\d+\\?\.)\s/.test(line);
    if (inFence || (/^( {4}|\t)/.test(line) && !nestedItem) || /^\s*(import|export) /.test(line)) return line;
    return typeset(line);
  }).join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname;
if (isMain) {
  const fix = process.argv.includes('--fix');
  const dir = 'src/content/blog';
  const files = fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).map((f) => path.join(dir, f));
  let bad = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const after = typesetFile(before);
    if (typesetFile(after) !== after) { console.log(`  FAIL ${file}: rules are not stable on this file, report it`); bad++; }
    if (after === before) continue;
    const a = before.split('\n'), b = after.split('\n');
    const changed = a.map((l, i) => (l !== b[i] ? i : -1)).filter((i) => i >= 0);
    if (fix) { fs.writeFileSync(file, after); console.log(`fixed ${file}: ${changed.length} line(s)`); continue; }
    bad += changed.length;
    for (const i of changed) console.log(`  ${file}:${i + 1}\n    - ${a[i]}\n    + ${b[i]}`);
  }
  if (files.length === 0) { console.log('no content files found'); process.exit(1); }
  if (bad) { console.log(`\n${bad} line(s) need typesetting. Run: npm run fix:text`); process.exit(1); }
  console.log(`${files.length} files ${fix ? 'typeset' : 'pass the typesetting rules'}`);
}
