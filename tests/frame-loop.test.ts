import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFrameLoop } from '../src/components/interest-field/frame-loop';

function setup() {
  let now = 0;
  let nextId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const elapsed: number[] = [];
  const clock = createFrameLoop((dt) => elapsed.push(dt), {
    request(callback) { frames.set(++nextId, callback); return nextId; },
    cancel(id) { frames.delete(id); },
    now: () => now,
  });
  return {
    clock, frames, elapsed,
    advance(ms: number) {
      now += ms;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(now));
    },
  };
}

test('returning to a visible tab never resumes an offscreen canvas', () => {
  const { clock, frames, elapsed, advance } = setup();
  clock.update({ inView: true });
  advance(16);
  clock.update({ inView: false });
  clock.update({ documentVisible: false });
  clock.update({ documentVisible: true });
  advance(1000);
  assert.equal(frames.size, 0);
  assert.deepEqual(elapsed, [0.016]);
});

test('live motion preference and user pause remain independent and resume only one clock', () => {
  const { clock, frames, elapsed, advance } = setup();
  clock.update({ inView: true });
  clock.update({ reducedMotion: true });
  assert.equal(frames.size, 0);
  clock.update({ paused: true, reducedMotion: false });
  assert.equal(frames.size, 0);
  advance(60_000);
  clock.update({ paused: false });
  clock.update({ inView: true });
  assert.equal(frames.size, 1);
  advance(16);
  assert.deepEqual(elapsed, [0.016]);
  advance(1000);
  assert.equal(elapsed[1], 0.05);
});

test('disposing cancels pending work and prevents further restarts', () => {
  const { clock, frames, elapsed, advance } = setup();
  clock.update({ inView: true });
  clock.dispose();
  clock.update({ inView: true, paused: false });
  advance(16);
  assert.equal(frames.size, 0);
  assert.equal(elapsed.length, 0);
});
