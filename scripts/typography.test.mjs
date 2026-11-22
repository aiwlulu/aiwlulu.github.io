// Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { typeset, typesetFile } from './typography.mjs';

const cases = [
  // rule 1: spacing
  ['用AI寫code很快', '用 AI 寫 code 很快'],
  ['共5筆資料，跑了5公里', '共 5 筆資料，跑了 5 公里'],
  ['大小20MB，耗時100ms', '大小 20MB，耗時 100ms'],
  ['請使用 Markdown、JSON 等格式', '請使用 Markdown、JSON 等格式'],
  ['符合100%的需求', '符合 100% 的需求'],
  ['作者： 芭芭拉', '作者：芭芭拉'],
  // rule 2: punctuation
  ['共5筆,大小20MB!', '共 5 筆，大小 20MB！'],
  ['這是一段文字,請留意.', '這是一段文字，請留意.'],
  ['為什麼要學歷史?', '為什麼要學歷史？'],
  ['模式(專注與發散)很重要', '模式（專注與發散）很重要'],
  ['生理健康 (Physical Health)和心理', '生理健康（Physical Health）和心理'],
  // rule 3: bold
  ['這是**重點**喔', '這是 **重點** 喔'],
  ['結論：**喜歡！**', '結論：**喜歡！**'],
  ['**開頭粗體**後面', '**開頭粗體** 後面'],
  // left alone
  ['format: JSON, size: 10MB', 'format: JSON, size: 10MB'],
  ['BUT!!', 'BUT!!'],
  ['Hello, world! (really)', 'Hello, world! (really)'],
  ['看[文件](https://a.b/c,d)吧(真的)', '看[文件](https://a.b/c,d)吧（真的）'],
  ['`a,b`是code', '`a,b` 是 code'],
  ['圖：![說明](../a.png)', '圖：![說明](../a.png)'],
  ['<YT id="abc" />', '<YT id="abc" />'],
  ['- 《書名》', '- 《書名》'],
  ['> 引言， 後半句', '> 引言，後半句'],
  ['1. 第一項(補充)', '1. 第一項（補充）'],
  ['by SuperY超級歪', 'by SuperY超級歪'],
];

for (const [input, expected] of cases) {
  test(`typeset: ${input}`, () => {
    assert.equal(typeset(input), expected);
    assert.equal(typeset(expected), expected, 'must be stable when run twice');
  });
}

test('nested list items are typeset, indented code is not', () => {
  assert.equal(typesetFile('- 習慣\n    - 提示 (To-Do)\n'), '- 習慣\n    - 提示（To-Do）\n');
  assert.equal(typesetFile('段落\n\n    const a = "中文abc";\n'), '段落\n\n    const a = "中文abc";\n');
});

test('front matter keys, code fences and imports are untouched', () => {
  const src = "---\ntitle: '用AI寫作'\npubDate: 2026-11-22\ntags: ['AI工具']\n---\n\n內文用AI\n\n```js\nconst a='中文abc';\n```\n";
  const out = typesetFile(src);
  assert.match(out, /title: '用 AI 寫作'/);
  assert.match(out, /tags: \['AI工具'\]/);
  assert.match(out, /內文用 AI/);
  assert.match(out, /const a='中文abc';/);
});
