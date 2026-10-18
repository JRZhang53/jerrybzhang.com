import type { Pointer, Rgb, Sim } from './types';
import { clamp, rgb } from './helpers';
import { periodicGrid } from './periodic-grid';

// ---------------------------------------------------------------------------
// Vicsek swarm: self-propelled agents that steer toward their neighbors'
// average heading, plus a little noise. The pointer scatters them.

export class Swarm implements Sim {
  private n = 0;
  private x = new Float32Array(0);
  private y = new Float32Array(0);
  private a = new Float32Array(0);
  private w = 0;
  private h = 0;
  private readonly speed = 70;
  private readonly radius = 38;
  private readonly noise = 0.45;
  private grid = periodicGrid(1, 1, this.radius);
  private buckets: number[][] = [];
  private next = new Float32Array(0);

  resize(width: number, height: number) {
    const first = this.n === 0;
    this.w = width;
    this.h = height;
    this.grid = periodicGrid(width, height, this.radius);
    this.buckets = this.grid.neighbors.map(() => []);
    if (!first) return;
    this.n = clamp(Math.round((width * height) / 4200), 70, 240);
    this.x = new Float32Array(this.n);
    this.y = new Float32Array(this.n);
    this.a = new Float32Array(this.n);
    this.next = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) {
      this.x[i] = Math.random() * width;
      this.y[i] = Math.random() * height;
      this.a[i] = Math.random() * Math.PI * 2;
    }
    for (let i = 0; i < 120; i++) this.step(1 / 60, { x: 0, y: 0, active: false });
  }

  step(dt: number, pointer: Pointer) {
    const { n, x, y, a, w, h, radius } = this;
    dt = Math.min(dt, 1 / 30);
    // Spatial hash so each agent only checks nearby cells.
    const { columns: gc, rows: gr, cellWidth, cellHeight, neighbors } = this.grid;
    const { buckets, next } = this;
    for (const bucket of buckets) bucket.length = 0;
    for (let i = 0; i < n; i++) {
      const cx = clamp((x[i] / cellWidth) | 0, 0, gc - 1);
      const cy = clamp((y[i] / cellHeight) | 0, 0, gr - 1);
      buckets[cy * gc + cx].push(i);
    }
    const r2 = radius * radius;
    for (let i = 0; i < n; i++) {
      const cx = clamp((x[i] / cellWidth) | 0, 0, gc - 1);
      const cy = clamp((y[i] / cellHeight) | 0, 0, gr - 1);
      let sx = 0;
      let sy = 0;
      for (const cell of neighbors[cy * gc + cx]) {
        for (const j of buckets[cell]) {
          let dx = x[j] - x[i];
          let dy = y[j] - y[i];
          if (dx > w / 2) dx -= w;
          if (dx < -w / 2) dx += w;
          if (dy > h / 2) dy -= h;
          if (dy < -h / 2) dy += h;
          if (dx * dx + dy * dy < r2) {
            sx += Math.cos(a[j]);
            sy += Math.sin(a[j]);
          }
        }
      }
      let heading = Math.atan2(sy, sx) + this.noise * (Math.random() - 0.5);
      if (pointer.active) {
        const dx = x[i] - pointer.x;
        const dy = y[i] - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 120) {
          const away = Math.atan2(dy, dx);
          let diff = away - heading;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          heading += diff * (1 - d / 120) * 0.9;
        }
      }
      next[i] = heading;
    }
    for (let i = 0; i < n; i++) {
      a[i] = next[i];
      x[i] = (x[i] + Math.cos(a[i]) * this.speed * dt + w) % w;
      y[i] = (y[i] + Math.sin(a[i]) * this.speed * dt + h) % h;
    }
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const { n, x, y, a } = this;
    ctx.fillStyle = rgb(color);
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const c = Math.cos(a[i]);
      const s = Math.sin(a[i]);
      // A small dart pointing along the heading.
      ctx.moveTo(x[i] + c * 7, y[i] + s * 7);
      ctx.lineTo(x[i] - c * 4 - s * 3.5, y[i] - s * 4 + c * 3.5);
      ctx.lineTo(x[i] - c * 2, y[i] - s * 2);
      ctx.lineTo(x[i] - c * 4 + s * 3.5, y[i] - s * 4 - c * 3.5);
      ctx.closePath();
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
