import test from 'node:test';
import assert from 'node:assert/strict';
import { splitAttribution } from '../src/scripts/quote.js';

test('moves a trailing attribution to its own line', () => {
  assert.equal(splitAttribution('\n<p>才能學得好。—— Barbara Oakley</p>\n'), '\n<p>才能學得好。</p><footer class="quote-by">Barbara Oakley</footer>\n');
});

test('handles an attribution with no space after the dash', () => {
  assert.equal(splitAttribution('<p>所換來的！——《返校》導演徐漢強</p>'), '<p>所換來的！</p><footer class="quote-by">《返校》導演徐漢強</footer>');
});

test('only looks at the last paragraph', () => {
  const inner = '<p>第一段 —— 不是出處</p><p>第二段。—— 岡田英弘</p>';
  assert.equal(splitAttribution(inner), '<p>第一段 —— 不是出處</p><p>第二段。</p><footer class="quote-by">岡田英弘</footer>');
});

test('leaves quotes without an attribution alone', () => {
  const inner = '<p>you will thrive.</p>';
  assert.equal(splitAttribution(inner), inner);
});

test('leaves a dash in the middle of a sentence alone', () => {
  const inner = '<p>這件事——其實很簡單——大家都知道，而且後面還有很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長的一段話。</p>';
  assert.equal(splitAttribution(inner), inner);
});

test('leaves an attribution that holds a link alone', () => {
  const inner = '<p>一句話。—— <a href="https://example.com">某人</a></p>';
  assert.equal(splitAttribution(inner), inner);
});

test('leaves a short clause after a mid-sentence dash alone', () => {
  const inner = '<p>這件事其實很簡單——大家都知道</p>';
  assert.equal(splitAttribution(inner), inner);
});
