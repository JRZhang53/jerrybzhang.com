import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { CoupledWaveguides } from '../src/components/interest-field/coupled-waveguides';
import { seeded, simulationEnvironment } from '../tests/helpers/simulation-environment';

// Compare against the reviewed pre-refactor revision, never a moving HEAD.
const reference = 'ba2d556';
const temporary = mkdtempSync(join(tmpdir(), 'waveguide-benchmark-'));
const baselineFile = join(temporary, 'baseline.ts');
try {
  const source = execFileSync('git', ['show', `${reference}:src/components/interest-field/sims.ts`], { encoding: 'utf8' });
  writeFileSync(baselineFile, source);
  const { CoupledWaveguides: Baseline } = await import(pathToFileURL(baselineFile).href);
  const pointer = { active: false, x: 0, y: 0 };
  const color: [number, number, number] = [39, 66, 232];
  for (const [width, height] of [[390, 440], [1440, 640]]) {
    const run = (Constructor: typeof CoupledWaveguides) => {
      const environment = simulationEnvironment();
      const wave = seeded(() => new Constructor());
      const startResize = performance.now();
      wave.resize(width, height);
      const resize = performance.now() - startResize;
      const snapshots: Uint8ClampedArray[] = [];
      // Include a pointer pulse near input guide 1 and enough time for it to exit.
      const left = width * (width >= 768 ? 0.56 : 0.06);
      const mid = height * (width >= 768 ? 0.5 : 0.52);
      const far = Math.min(52, Math.max(18, height * (width >= 768 ? 0.72 : 0.62) / 6.5));
      for (let frame = 0; frame < 300; frame++) {
        wave.step(1 / 60, frame < 2 ? { active: true, x: left, y: mid - 1.5 * far } : pointer);
        wave.paint(color);
        if ([0, 1, 30, 120, 299].includes(frame)) snapshots.push(environment.image().data.slice());
      }
      const samples: number[] = [];
      for (let batch = 0; batch < 5; batch++) {
        const start = performance.now();
        for (let frame = 0; frame < 120; frame++) { wave.step(1 / 60, pointer); wave.paint(color); }
        samples.push((performance.now() - start) / 120);
      }
      samples.sort((a, b) => a - b);
      return { resize, frame: samples[2], snapshots };
    };
    const before = run(Baseline);
    const after = run(CoupledWaveguides);
    let maxPixelDelta = 0;
    for (let s = 0; s < before.snapshots.length; s++) {
      assert.equal(before.snapshots[s].length, after.snapshots[s].length);
      for (let p = 0; p < before.snapshots[s].length; p++) {
        maxPixelDelta = Math.max(maxPixelDelta, Math.abs(before.snapshots[s][p] - after.snapshots[s][p]));
      }
    }
    assert.ok(maxPixelDelta <= 1, `Pixel difference ${maxPixelDelta} exceeds rounding tolerance`);
    console.log(JSON.stringify({ width, height, baselineRevision: reference, baselineResizeMs: before.resize, optimizedResizeMs: after.resize, baselineFrameMs: before.frame, optimizedFrameMs: after.frame, speedup: before.frame / after.frame, maxPixelDelta }));
  }
} finally {
  if (existsSync(baselineFile)) unlinkSync(baselineFile);
  rmdirSync(temporary);
}
