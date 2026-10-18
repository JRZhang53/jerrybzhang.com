import type { Pointer, Rgb, Sim } from './types';
import { clamp, rgb } from './helpers';

// ---------------------------------------------------------------------------
// Ising model: Metropolis updates on a square lattice near the critical
// temperature, where domains of every size form and dissolve. Updates run
// slowly and each cell fades between states, so nothing flickers. The pointer
// is a heat source: spins under it get hot and flip at random, melting the
// domains there; once it moves on, order slowly returns.

const T_BASE = 2.3;
/** Lattice sweeps per second. Slow on purpose: domains drift rather than churn. */
const SWEEPS_PER_SECOND = 1.4;
/** How fast a cell's drawn state follows its spin (per second). Low = gentle fades. */
const FADE_RATE = 3.5;
const LEVELS = 8;
/** Extra temperature at the pointer's center, in units of J/k. */
const HEAT = 9;

export class SpinLattice implements Sim {
  private cols = 0;
  private rows = 0;
  private cell = 13;
  private spins = new Int8Array(0);
  /** Drawn state per cell, easing from -1 (down) to 1 (up). */
  private shown = new Float32Array(0);
  private boltz = { 4: 0, 8: 0 } as Record<number, number>;
  private pending = 0;
  /** Where the heat is, and how visible its ring is (eases in and out). */
  private heater = { x: 0, y: 0, shown: 0 };

  resize(width: number, height: number) {
    this.cell = clamp(Math.round(width / 95), 10, 15);
    this.cols = Math.ceil(width / this.cell);
    this.rows = Math.ceil(height / this.cell);
    this.spins = new Int8Array(this.cols * this.rows);
    for (let i = 0; i < this.spins.length; i++) this.spins[i] = Math.random() < 0.5 ? 1 : -1;
    this.boltz = { 4: Math.exp(-4 / T_BASE), 8: Math.exp(-8 / T_BASE) };
    // Settle into critical-looking domains before the first frame.
    for (let i = 0; i < 60; i++) this.sweep(1, null);
    this.shown = Float32Array.from(this.spins);
  }

  /** One Metropolis attempt at cell (x, y), at temperature `temp`. */
  private attempt(x: number, y: number, temp: number) {
    const { cols, rows, spins } = this;
    const i = y * cols + x;
    const s = spins[i];
    const sum =
      spins[y * cols + ((x + 1) % cols)] +
      spins[y * cols + ((x - 1 + cols) % cols)] +
      spins[((y + 1) % rows) * cols + x] +
      spins[((y - 1 + rows) % rows) * cols + x];
    const dE = 2 * s * sum;
    if (dE <= 0 || Math.random() < (temp === T_BASE ? this.boltz[dE] : Math.exp(-dE / temp))) {
      spins[i] = -s as -1 | 1;
    }
  }

  private tempAt(x: number, y: number, pointer: Pointer | null) {
    if (!pointer?.active) return T_BASE;
    const radius = 5 * this.cell;
    const d = Math.hypot((x + 0.5) * this.cell - pointer.x, (y + 0.5) * this.cell - pointer.y);
    return d < radius ? T_BASE + HEAT * (1 - d / radius) : T_BASE;
  }

  private sweep(fraction: number, pointer: Pointer | null) {
    const n = this.cols * this.rows;
    const attempts = Math.floor(n * fraction);
    for (let a = 0; a < attempts; a++) {
      const i = (Math.random() * n) | 0;
      const x = i % this.cols;
      const y = (i / this.cols) | 0;
      this.attempt(x, y, this.tempAt(x, y, pointer));
    }
  }

  /** Extra updates right around the pointer, so the heat acts at once. */
  private sweepNear(pointer: Pointer, count: number) {
    const reach = 5;
    const cx = Math.floor(pointer.x / this.cell);
    const cy = Math.floor(pointer.y / this.cell);
    for (let a = 0; a < count; a++) {
      const x = cx + Math.round((Math.random() * 2 - 1) * reach);
      const y = cy + Math.round((Math.random() * 2 - 1) * reach);
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) continue;
      this.attempt(x, y, this.tempAt(x, y, pointer));
    }
  }

  step(dt: number, pointer: Pointer) {
    // Accumulate fractional sweeps so the rate holds at any frame rate.
    this.pending += dt * SWEEPS_PER_SECOND;
    const whole = Math.floor(this.pending * 100) / 100;
    if (whole > 0) {
      this.sweep(whole, pointer);
      this.pending -= whole;
    }
    if (pointer.active) {
      this.sweepNear(pointer, Math.round(dt * 1500));
      this.heater.x = pointer.x;
      this.heater.y = pointer.y;
    }
    this.heater.shown += ((pointer.active ? 1 : 0) - this.heater.shown) * (1 - Math.exp(-dt * 6));
    const ease = 1 - Math.exp(-dt * FADE_RATE);
    const { shown, spins } = this;
    for (let i = 0; i < shown.length; i++) shown[i] += (spins[i] - shown[i]) * ease;
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const { cols, rows, shown, cell } = this;
    ctx.fillStyle = rgb(color);
    const big = cell - 4;
    const small = Math.max(1.5, cell * 0.16);
    // Bucket cells by how "up" they look, so each level is drawn in one pass.
    for (let level = 0; level < LEVELS; level++) {
      const t = level / (LEVELS - 1);
      const size = small + (big - small) * t;
      ctx.globalAlpha = 0.16 + 0.14 * t;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const u = (shown[y * cols + x] + 1) / 2;
          if (Math.round(u * (LEVELS - 1)) !== level) continue;
          ctx.fillRect((x + 0.5) * cell - size / 2, (y + 0.5) * cell - size / 2, size, size);
        }
      }
    }
    // A faint ring marks how far the heat reaches.
    if (this.heater.shown > 0.01) {
      ctx.strokeStyle = rgb(color);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5 * this.heater.shown;
      ctx.beginPath();
      ctx.arc(this.heater.x, this.heater.y, 5 * cell, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
