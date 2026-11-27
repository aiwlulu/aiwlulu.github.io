import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTemplate, fillTemplate } from '../src/scripts/prompt-template.js';

test('splits text and blanks; a blank may carry a hint after |', () => {
  assert.deepEqual(parseTemplate('我的任務是：{{任務|例如：寫一份週報}}，對象是{{讀者}}。'), [
    { text: '我的任務是：' },
    { name: '任務', hint: '例如：寫一份週報', block: false },
    { text: '，對象是' },
    { name: '讀者', hint: '', block: false },
    { text: '。' },
  ]);
});

test('trims spaces inside the braces', () => {
  assert.deepEqual(parseTemplate('{{ 任務 | 提示 }}'), [{ name: '任務', hint: '提示', block: true }]);
});

test('drops the blank lines and shared indent a template literal brings', () => {
  const parts = parseTemplate(`
    第一行
      縮排的第二行

    第四行
  `);
  assert.deepEqual(parts, [{ text: '第一行\n  縮排的第二行\n\n第四行' }]);
});

test('text without blanks stays one part', () => {
  assert.deepEqual(parseTemplate('沒有空格'), [{ text: '沒有空格' }]);
});

test('fills blanks with the reader\'s answers and reports none missing', () => {
  const parts = parseTemplate('任務：{{任務}}；讀者：{{讀者}}');
  assert.deepEqual(fillTemplate(parts, { 任務: '寫週報', 讀者: '主管' }), { text: '任務：寫週報；讀者：主管', missing: [] });
});

test('an empty answer keeps the hint in 【】 (the name when there is no hint), listed once', () => {
  const parts = parseTemplate('{{任務|例如：寫週報}} / {{讀者}} / {{任務}} / {{語氣}}');
  assert.deepEqual(fillTemplate(parts, { 任務: '  ', 讀者: '主管' }), {
    text: '【例如：寫週報】 / 主管 / 【例如：寫週報】 / 【語氣】',
    missing: ['任務', '語氣'],
  });
});

test('answers are trimmed but keep their inner line breaks', () => {
  const parts = parseTemplate('背景：\n{{背景}}');
  assert.equal(fillTemplate(parts, { 背景: '\n第一點\n第二點\n' }).text, '背景：\n第一點\n第二點');
});

test('a repeated blank without a hint reuses the hint given earlier', () => {
  const blanks = parseTemplate('{{任務|寫週報}}…{{任務}}').filter((p) => 'name' in p);
  assert.deepEqual(blanks.map((b) => b.hint), ['寫週報', '寫週報']);
});

test('a blank alone on its line is a block blank, for longer answers', () => {
  const parts = parseTemplate(`
    背景資料：
    {{背景|貼上會議記錄}}
    請整理成三點，語氣{{語氣}}。
    {{結尾}}
  `);
  const blocks = Object.fromEntries(parts.filter((p) => 'name' in p).map((p) => [p.name, p.block]));
  assert.deepEqual(blocks, { 背景: true, 語氣: false, 結尾: true });
});
