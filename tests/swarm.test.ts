import assert from 'node:assert/strict';
import test from 'node:test';
import { periodicGrid } from '../src/components/interest-field/periodic-grid';

test('periodic neighbor cells include every point within the radius across edges and corners', () => {
  const radius = 38;
  for (const [width, height] of [[390, 440], [811, 640], [100, 100], [30, 20]]) {
    const grid = periodicGrid(width, height, radius);
    const points = Array.from({ length: 40 }, (_, i) => [i * width / 40, ((i * 17) % 40) * height / 40]);
    // A shortened last cell in the old ceil-based grid missed these neighbors.
    points.push([1, 1], [Math.max(0, width - 30), 1], [1, Math.max(0, height - 30)], [Math.max(0, width - 20), Math.max(0, height - 20)]);
    const cell = ([x, y]: number[]) => Math.floor(y / grid.cellHeight) * grid.columns + Math.floor(x / grid.cellWidth);
    for (const a of points) for (const b of points) {
      const dx = Math.min(Math.abs(a[0] - b[0]), width - Math.abs(a[0] - b[0]));
      const dy = Math.min(Math.abs(a[1] - b[1]), height - Math.abs(a[1] - b[1]));
      if (dx * dx + dy * dy < radius * radius) assert.ok(grid.neighbors[cell(a)].includes(cell(b)));
    }
    for (const neighbors of grid.neighbors) assert.equal(neighbors.length, new Set(neighbors).size);
  }
});
