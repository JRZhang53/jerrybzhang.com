import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPointerInput, type FieldPointer } from '../src/components/interest-field/pointer-input';

const touch = (overrides: Partial<FieldPointer> = {}): FieldPointer => ({
  id: 1, kind: 'touch', x: 120, y: 80, time: 0, ...overrides,
});
function setup() {
  const presses: number[][] = [];
  const input = createPointerInput((x, y) => presses.push([x, y]));
  return { input, presses };
}

test('a touch tap acts on release and stays active briefly without holding a finger', () => {
  const { input, presses } = setup();
  input.down(touch());
  assert.equal(input.pointer.active, false);
  assert.equal(presses.length, 0);
  input.up(touch({ time: 100 }));
  assert.deepEqual(presses, [[120, 80]]);
  input.step(0.5);
  assert.equal(input.pointer.active, true);
  input.step(0.4);
  assert.equal(input.pointer.active, false);
});

test('scrolls, canceled gestures, and long presses never trigger the simulation', () => {
  for (const gesture of ['scroll', 'cancel', 'hold']) {
    const { input, presses } = setup();
    input.down(touch());
    if (gesture === 'scroll') input.move(touch({ y: 105, time: 50 }));
    if (gesture === 'cancel') input.cancel();
    // Even a scroll returning to the starting point is not a tap.
    input.up(touch({ time: gesture === 'hold' ? 600 : 100 }));
    assert.equal(input.pointer.active, false, gesture);
    assert.equal(presses.length, 0, gesture);
  }
});

test('mouse hover remains continuous and a new gesture cannot replay an old tap', () => {
  const { input, presses } = setup();
  input.move(touch({ kind: 'mouse' }));
  input.step(2);
  assert.equal(input.pointer.active, true);
  input.down(touch({ kind: 'mouse' }));
  assert.equal(presses.length, 1);
  input.cancel();
  input.up(touch({ time: 100 }));
  assert.equal(input.pointer.active, false);
  assert.equal(presses.length, 1);
  input.down(touch());
  input.up(touch({ id: 2, time: 100 }));
  assert.equal(presses.length, 1);
});
