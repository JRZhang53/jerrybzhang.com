import assert from 'node:assert/strict';
import test from 'node:test';
import { propagate } from '../src/components/interest-field/waveguide-propagation';
import { CoupledWaveguides } from '../src/components/interest-field/coupled-waveguides';
import { seeded, simulationEnvironment } from './helpers/simulation-environment';

test('RK4 matches analytic power exchange between two identical guides', () => {
  const xs = Array.from({ length: 251 }, (_, i) => i * 2);
  const coupling = 0.012;
  const { re, im } = propagate(xs, xs.map(() => [coupling]), 0, [1, 0], [0, 0]);
  for (let i = 0; i < xs.length; i++) {
    assert.ok(Math.abs(re[i][0] - Math.cos(coupling * xs[i])) < 2e-8);
    assert.ok(Math.abs(im[i][1] - Math.sin(coupling * xs[i])) < 2e-8);
    assert.ok(Math.abs(re[i][0] ** 2 + im[i][1] ** 2 - 1) < 1e-8);
  }
});

test('complex input superposition preserves propagation with varying coupling', () => {
  const xs = Array.from({ length: 200 }, (_, i) => i * 1.7);
  const kap = xs.map((x) => Array.from({ length: 5 }, (_, n) => 0.012 * (1 + Math.sin(x / 50 + n)) / 2));
  const unit = (n: number) => Array.from({ length: 6 }, (_, i) => Number(n === i));
  const zero = () => new Array<number>(6).fill(0);
  const a = propagate(xs, kap, 0, unit(1), zero());
  const b = propagate(xs, kap, 0, unit(4), zero());
  for (const phase of [0, 0.3, 2, 5]) {
    const ar = unit(1).map((v, i) => v * 0.6 + unit(4)[i] * 0.8 * Math.cos(phase));
    const ai = unit(4).map((v) => v * 0.8 * Math.sin(phase));
    const direct = propagate(xs, kap, 0, ar, ai);
    for (let i = 0; i < xs.length; i++) for (let n = 0; n < 6; n++) {
      const re = 0.6 * a.re[i][n] + 0.8 * (Math.cos(phase) * b.re[i][n] - Math.sin(phase) * b.im[i][n]);
      const im = 0.6 * a.im[i][n] + 0.8 * (Math.cos(phase) * b.im[i][n] + Math.sin(phase) * b.re[i][n]);
      assert.ok(Math.abs(direct.re[i][n] - re) < 1e-12);
      assert.ok(Math.abs(direct.im[i][n] - im) < 1e-12);
    }
  }
});

test('waveguide pixels remain bounded and recolor without changing intensity', () => {
  const environment = simulationEnvironment();
  const wave = seeded(() => new CoupledWaveguides());
  for (const [width, height] of [[390, 440], [1440, 640]]) {
    wave.resize(width, height);
    wave.step(1 / 60, { active: false, x: 0, y: 0 });
    wave.paint([39, 66, 232]);
    const first = environment.image().data.slice();
    assert.ok(first.some((value, i) => i % 4 === 3 && value > 0));
    wave.paint([147, 163, 255]);
    const second = environment.image().data;
    for (let i = 0; i < second.length; i += 4) {
      assert.deepEqual(Array.from(second.subarray(i, i + 3)), [147, 163, 255]);
      assert.equal(second[i + 3], first[i + 3]);
      assert.ok(second[i + 3] <= 235);
    }
  }
});
