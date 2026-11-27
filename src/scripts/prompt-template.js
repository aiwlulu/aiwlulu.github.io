// Prompt card templates (src/components/Prompt.astro). A template is plain text with blanks for
// the reader: {{名稱}} or {{名稱|提示}}. Shared by the component, its page script and the tests.

const BLANK = /\{\{\s*([^|}]+?)\s*(?:\|\s*([^}]*?)\s*)?\}\}/g;

/** Template literals in MDX bring the surrounding blank lines and indent; drop both. */
function dedent(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}

/**
 * Splits a template into text parts ({ text }) and blanks ({ name, hint, block }). A blank alone
 * on its line is a block blank: a wide box for longer, multi-line answers.
 */
export function parseTemplate(source) {
  const template = dedent(source);
  const parts = [];
  const hints = new Map();
  let last = 0;
  for (const m of template.matchAll(BLANK)) {
    if (m.index > last) parts.push({ text: template.slice(last, m.index) });
    // A blank used again keeps the hint it was first given.
    if (m[2] && !hints.has(m[1])) hints.set(m[1], m[2]);
    const end = m.index + m[0].length;
    const block = (m.index === 0 || template[m.index - 1] === '\n') && (end === template.length || template[end] === '\n');
    parts.push({ name: m[1], hint: m[2] || hints.get(m[1]) || '', block });
    last = end;
  }
  if (last < template.length) parts.push({ text: template.slice(last) });
  return parts;
}

/**
 * The finished prompt. A blank left empty keeps its hint (or its name) in 【】, so whoever pastes
 * the prompt can see what still needs filling in.
 */
export function fillTemplate(parts, values) {
  const missing = [];
  const text = parts
    .map((p) => {
      if ('text' in p) return p.text;
      const value = (values[p.name] ?? '').trim();
      if (value) return value;
      if (!missing.includes(p.name)) missing.push(p.name);
      return `【${p.hint || p.name}】`;
    })
    .join('');
  return { text, missing };
}
