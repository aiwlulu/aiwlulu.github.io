import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleText } from './font-subset.mjs';

test('visibleText keeps body text and placeholders only', () => {
  const html = '<html><head><title>標題</title><style>a{content:"樣"}</style></head><body><p>看得到</p><script>const s = "腳本";</script><!-- 註解 --><input placeholder="搜尋"></body></html>';
  const text = visibleText(html);
  assert.match(text, /看得到/);
  assert.match(text, /搜尋/);
  for (const hidden of ['標題', '樣', '腳本', '註解']) assert.doesNotMatch(text, new RegExp(hidden));
});

test('visibleText decodes entities', () => {
  assert.equal(visibleText('<body>&#x9e7f;&#40165;&amp;&lt;</body>').trim(), '鹿鳥&<');
});
