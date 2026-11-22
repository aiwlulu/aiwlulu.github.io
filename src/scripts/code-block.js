// Markup for the bar above a code block. Shared by the build step (scripts/polish-html.mjs),
// which wraps every code block in the built HTML, and by the page script, which does the same
// in `astro dev` where the build step does not run. Icons are Lucide (terminal, copy, check).

const ICON = {
  terminal: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19h8"/><path d="m4 17 6-6-6-6"/></svg>',
  copy: '<svg class="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  check: '<svg class="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
};

/** Names shown for the languages used in fenced code blocks. */
const LANGUAGES = {
  bash: 'Shell', sh: 'Shell', shell: 'Shell', zsh: 'Shell', console: 'Shell',
  js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML', html: 'HTML', css: 'CSS', astro: 'Astro', md: 'Markdown', mdx: 'MDX',
  py: 'Python', python: 'Python', sql: 'SQL', go: 'Go', rust: 'Rust', diff: 'Diff', plaintext: '文字', text: '文字', txt: '文字',
};

export const languageName = (id) => LANGUAGES[id] ?? (id ? id.toUpperCase() : '程式碼');

/** The bar: language on the left; a wrap switch and a copy button on the right. */
export function codeBar(language) {
  return (
    '<div class="post-code-bar">' +
    `<span class="post-code-lang">${ICON.terminal}${languageName(language)}</span>` +
    '<span class="post-code-actions">' +
    '<button type="button" class="switch" role="switch" aria-checked="true" data-code-wrap><span class="switch-track"><span class="switch-thumb"></span></span>自動換行</button>' +
    `<button type="button" class="post-code-copy" data-code-copy><span class="when-idle">${ICON.copy}</span><span class="when-done">${ICON.check}</span><span data-copy-label>複製</span></button>` +
    '</span></div>'
  );
}

/** Each line becomes its own block, so a wrapped line can hang its continuation under itself. */
export const joinLines = (html) => html.replace(/<\/span>\n(?=<span class="line")/g, '</span>');
