import test from 'node:test';
import assert from 'node:assert/strict';
import { at, CYCLE, LEAD, totalSeconds } from '../src/scripts/breath-cycle.js';

test('a cycle is 4 + 7 + 8 seconds', () => {
  assert.equal(CYCLE, 19);
  assert.equal(totalSeconds(4), LEAD + 76);
});

test('starts with a lead-in, then breathes in', () => {
  assert.equal(at(0, 4).phase, 'ready');
  assert.equal(at(LEAD - 0.01, 4).phase, 'ready');
  const first = at(LEAD, 4);
  assert.deepEqual([first.phase, first.round, first.left, first.fill], ['in', 1, 4, 0]);
});

test('phases change at 4, 11 and 19 seconds into a round', () => {
  assert.equal(at(LEAD + 3.99, 4).phase, 'in');
  assert.equal(at(LEAD + 4, 4).phase, 'hold');
  assert.equal(at(LEAD + 10.99, 4).phase, 'hold');
  assert.equal(at(LEAD + 11, 4).phase, 'out');
  assert.equal(at(LEAD + 18.99, 4).phase, 'out');
  const next = at(LEAD + 19, 4);
  assert.deepEqual([next.phase, next.round], ['in', 2]);
});

test('lungs fill while breathing in, stay full on hold, empty while breathing out', () => {
  assert.ok(at(LEAD + 1, 4).fill < at(LEAD + 3, 4).fill);
  assert.ok(Math.abs(at(LEAD + 2, 4).fill - 0.5) < 1e-9);
  assert.equal(at(LEAD + 7, 4).fill, 1);
  assert.ok(at(LEAD + 12, 4).fill > at(LEAD + 18, 4).fill);
  assert.ok(Math.abs(at(LEAD + 15, 4).fill - 0.5) < 1e-9);
});

test('the countdown shows whole seconds from the phase length down to 1', () => {
  const shown = (t) => Math.ceil(at(t, 4).left);
  assert.equal(shown(LEAD), 4);
  assert.equal(shown(LEAD + 3.5), 1);
  assert.equal(shown(LEAD + 4), 7);
  assert.equal(shown(LEAD + 11), 8);
});

test('ends after the chosen number of rounds', () => {
  assert.equal(at(LEAD + 4 * CYCLE - 0.01, 4).phase, 'out');
  assert.equal(at(LEAD + 4 * CYCLE, 4).phase, 'done');
  assert.equal(at(LEAD + 4 * CYCLE, 8).round, 5);
});
