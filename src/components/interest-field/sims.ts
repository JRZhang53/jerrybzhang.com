// Four small simulations drawn behind the home page hero, one per interest.
// Each draws in a single color (the site accent) and reacts to the pointer.

export type Rgb = [number, number, number];
export type Pointer = { x: number; y: number; active: boolean };

export interface Sim {
  /** Called on start and whenever the canvas size (CSS px) changes. */
  resize(width: number, height: number): void;
  /** Advance by `dt` seconds. */
  step(dt: number, pointer: Pointer): void;
  draw(ctx: CanvasRenderingContext2D, color: Rgb): void;
  /** A pointer press at (x, y), in CSS px. */
  press?(x: number, y: number): void;
}

export type SimKey = 'spins' | 'swarm' | 'photonics' | 'boltzmann';

const rgb = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Wide screens keep the busiest part of each sim to the right of the name. */
const rightBias = (width: number) => (width >= 768 ? 0.42 : 0.06);

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

  resize(width: number, height: number) {
    const first = this.n === 0;
    this.w = width;
    this.h = height;
    if (!first) return;
    this.n = clamp(Math.round((width * height) / 4200), 70, 240);
    this.x = new Float32Array(this.n);
    this.y = new Float32Array(this.n);
    this.a = new Float32Array(this.n);
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
    const gc = Math.ceil(w / radius);
    const gr = Math.ceil(h / radius);
    const buckets: number[][] = Array.from({ length: gc * gr }, () => []);
    for (let i = 0; i < n; i++) {
      const cx = clamp((x[i] / radius) | 0, 0, gc - 1);
      const cy = clamp((y[i] / radius) | 0, 0, gr - 1);
      buckets[cy * gc + cx].push(i);
    }
    const next = new Float32Array(n);
    const r2 = radius * radius;
    for (let i = 0; i < n; i++) {
      const cx = clamp((x[i] / radius) | 0, 0, gc - 1);
      const cy = clamp((y[i] / radius) | 0, 0, gr - 1);
      let sx = 0;
      let sy = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const bx = (cx + ox + gc) % gc;
          const by = (cy + oy + gr) % gr;
          for (const j of buckets[by * gc + bx]) {
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

// ---------------------------------------------------------------------------
// Coupled waveguides: six parallel guides whose spacing changes along the
// chip. Where neighbors run close, light tunnels between them (coupled-mode
// theory: each guide carries a complex amplitude, and da/dz = i·K(z)·a).
// Sections: a tight array (discrete diffraction), directional-coupler pairs,
// then a shifted pairing. Light enters two guides with a slowly drifting
// balance and phase, so the interference pattern downstream keeps changing.
//
// Each guide is a core of real width that confines a slab-waveguide mode:
// cos(k·y) inside, an evanescent tail exp(-γ·|y|) outside, with k from the
// symmetric-mode condition tan(k·w/2) = γ/k. What's drawn is the coherent sum
// of all the guides' mode fields, so where cores run close you can see the
// tails overlap, and that overlap is what sets the coupling.
//
// The pointer perturbs the wave: touching a guide launches a pulse into it,
// which travels downstream and spreads to its neighbors through the same
// coupling. Brightness is the steady intensity plus the pulses, with a slow,
// faint ripple on the wave's phase to show it travelling. Nothing strobes.

const GUIDES = 6;
/** Core width (px): what confines each guide's mode. */
const CORE = 8;
/** Center spacing (px) where guides couple strongly (edge-to-edge gap: TIGHT - CORE). */
const TIGHT = 16;
/** Evanescent decay outside the core (per px). Coupling falls off at the same rate. */
const GAMMA = 1 / 4.5;
/** Coupling (per px) at TIGHT spacing. */
const KAPPA = 0.012;
/** Spatial frequency of the drawn ripple (crest every ~26 px). */
const BETA = (2 * Math.PI) / 26;
const RIPPLE_HZ = 0.45;
const RIPPLE_DEPTH = 0.2;
const STEP = 2;
/** Pulses: speed (px/s), length (px), strength, and the minimum time between launches. */
const PULSE_SPEED = 150;
const PULSE_LENGTH = 38;
const PULSE_STRENGTH = 0.85;
const PULSE_INTERVAL = 0.6;

type Layout = number[];

interface Pulse {
  /** Sample index where it was launched. */
  start: number;
  born: number;
  /** Amplitudes per guide from `start` to the chip's end (unit power at launch). */
  re: number[][];
  im: number[][];
}

export class CoupledWaveguides implements Sim {
  private xs: number[] = [];
  /** ys[i][n]: guide n's height at sample i. */
  private ys: number[][] = [];
  /** kap[i][n]: coupling between guides n and n+1 at sample i. */
  private kap: number[][] = [];
  /** Steady field at each sample: re[i][n], im[i][n]. */
  private re: number[][] = [];
  private im: number[][] = [];
  private pulses: Pulse[] = [];
  private lastLaunch = Number.NEGATIVE_INFINITY;
  private t = Math.random() * 60;
  private balancePeriod = 10 + Math.random() * 4;
  private phasePeriod = 12 + Math.random() * 5;
  /** Transverse wavenumber of the mode inside the core. */
  private kCore = 0;
  private image: ImageData | null = null;
  private buffer: HTMLCanvasElement | null = null;
  private top = 0;
  private rows = 0;

  resize(width: number, height: number) {
    const wide = width >= 768;
    const L = wide ? width * 0.56 : width * 0.06;
    const R = width * 0.97;
    const mid = height * (wide ? 0.5 : 0.52);
    const far = clamp((height * (wide ? 0.72 : 0.62)) / 6.5, 18, 52);

    const centered = (gap: number): Layout => Array.from({ length: GUIDES }, (_, n) => (n - (GUIDES - 1) / 2) * gap);
    const spread = centered(far);
    const array = centered(TIGHT);
    // Pairs (0,1) (2,3) (4,5), each pair tight, pairs far apart.
    const pairs: Layout = [-1, -1, 0, 0, 1, 1].map((c, n) => c * far * 1.8 + (n % 2 === 0 ? -TIGHT / 2 : TIGHT / 2));
    // Shifted pairs (1,2) (3,4), with guides 0 and 5 off on their own.
    const shifted: Layout = [-2.6 * far, -far - TIGHT / 2, -far + TIGHT / 2, far - TIGHT / 2, far + TIGHT / 2, 2.6 * far];
    const keys: [number, Layout][] = [
      [0, spread],
      [0.08, spread],
      [0.18, array],
      [0.4, array],
      [0.48, pairs],
      [0.66, pairs],
      [0.74, shifted],
      [0.9, shifted],
      [1, spread],
    ];
    const layoutAt = (u: number): Layout => {
      let k = 0;
      while (k < keys.length - 2 && u > keys[k + 1][0]) k++;
      const [u0, a] = keys[k];
      const [u1, b] = keys[k + 1];
      const t = clamp((u - u0) / (u1 - u0), 0, 1);
      const e = (1 - Math.cos(Math.PI * t)) / 2;
      return a.map((y, n) => mid + y + (b[n] - y) * e);
    };

    const count = Math.max(2, Math.ceil((R - L) / STEP));
    this.xs = Array.from({ length: count + 1 }, (_, i) => L + ((R - L) * i) / count);
    this.ys = this.xs.map((_, i) => layoutAt(i / count));
    this.kap = this.ys.map((ys) =>
      Array.from({ length: GUIDES - 1 }, (_, n) => {
        const gap = ys[n + 1] - ys[n];
        // Coupling follows the overlap of evanescent tails across the gap.
        return gap > TIGHT + 30 ? 0 : KAPPA * Math.exp(-(gap - TIGHT) * GAMMA);
      })
    );
    this.pulses = [];

    // Symmetric slab mode: solve tan(k·a) = γ/k for k in (0, π/2a) by bisection.
    const a = CORE / 2;
    let lo = 1e-6;
    let hi = Math.PI / (2 * a) - 1e-6;
    for (let it = 0; it < 60; it++) {
      const m = (lo + hi) / 2;
      if (Math.tan(m * a) - GAMMA / m < 0) lo = m;
      else hi = m;
    }
    this.kCore = (lo + hi) / 2;

    // Pixel buffer covering every core plus its tails.
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const ys of this.ys) {
      for (const y of ys) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    this.top = Math.floor(minY - a - 20);
    this.rows = Math.ceil(maxY + a + 20 - this.top);
    this.image = new ImageData(this.xs.length, this.rows);
    this.buffer = document.createElement('canvas');
    this.buffer.width = this.xs.length;
    this.buffer.height = this.rows;
    this.solveSteady();
  }

  /**
   * Integrate the coupled-mode equations from sample `start` to the end (RK4,
   * in a frame rotating with the common phase), starting from (ar, ai).
   */
  private evolve(start: number, ar: number[], ai: number[]) {
    const { xs, kap } = this;
    const outRe: number[][] = [];
    const outIm: number[][] = [];
    const deriv = (k: number[], r: number[], m: number[]) => {
      const dr = new Array<number>(GUIDES);
      const dm = new Array<number>(GUIDES);
      for (let n = 0; n < GUIDES; n++) {
        // c = κ_{n-1}·a_{n-1} + κ_n·a_{n+1};  da/dz = i·c
        let cr = 0;
        let ci = 0;
        if (n > 0) {
          cr += k[n - 1] * r[n - 1];
          ci += k[n - 1] * m[n - 1];
        }
        if (n < GUIDES - 1) {
          cr += k[n] * r[n + 1];
          ci += k[n] * m[n + 1];
        }
        dr[n] = -ci;
        dm[n] = cr;
      }
      return [dr, dm];
    };
    const add = (r: number[], m: number[], dr: number[], dm: number[], f: number) => [
      r.map((v, n) => v + dr[n] * f),
      m.map((v, n) => v + dm[n] * f),
    ];
    for (let i = start; i < xs.length; i++) {
      outRe.push(ar.slice());
      outIm.push(ai.slice());
      if (i === xs.length - 1) break;
      const h = xs[i + 1] - xs[i];
      const k = kap[i];
      const [k1r, k1i] = deriv(k, ar, ai);
      const [r2, m2] = add(ar, ai, k1r, k1i, h / 2);
      const [k2r, k2i] = deriv(k, r2, m2);
      const [r3, m3] = add(ar, ai, k2r, k2i, h / 2);
      const [k3r, k3i] = deriv(k, r3, m3);
      const [r4, m4] = add(ar, ai, k3r, k3i, h);
      const [k4r, k4i] = deriv(k, r4, m4);
      ar = ar.map((v, n) => v + (h / 6) * (k1r[n] + 2 * k2r[n] + 2 * k3r[n] + k4r[n]));
      ai = ai.map((v, n) => v + (h / 6) * (k1i[n] + 2 * k2i[n] + 2 * k3i[n] + k4i[n]));
    }
    return { re: outRe, im: outIm };
  }

  /** The steady field from the two drifting inputs. */
  private solveSteady() {
    const theta = Math.PI / 4 + (Math.PI / 4) * Math.sin((2 * Math.PI * this.t) / this.balancePeriod);
    const phi = (2 * Math.PI * this.t) / this.phasePeriod;
    const ar = new Array<number>(GUIDES).fill(0);
    const ai = new Array<number>(GUIDES).fill(0);
    ar[1] = Math.cos(theta);
    ar[4] = Math.sin(theta) * Math.cos(phi);
    ai[4] = Math.sin(theta) * Math.sin(phi);
    const { re, im } = this.evolve(0, ar, ai);
    this.re = re;
    this.im = im;
  }

  /** Brightness envelope of a pulse at sample i (0 before its launch point). */
  private envelope(p: Pulse, i: number) {
    if (i < p.start) return 0;
    const age = this.t - p.born;
    const center = this.xs[p.start] + PULSE_SPEED * age;
    const d = (this.xs[i] - center) / PULSE_LENGTH;
    return PULSE_STRENGTH * Math.min(1, age / 0.15) * Math.exp(-d * d);
  }

  step(dt: number, pointer: Pointer) {
    this.t += dt;
    const { xs, ys } = this;
    // Touching a guide launches a pulse into it, at most every PULSE_INTERVAL.
    if (pointer.active && xs.length && this.t - this.lastLaunch >= PULSE_INTERVAL) {
      const inside = pointer.x >= xs[0] && pointer.x <= xs[xs.length - 1] - PULSE_LENGTH;
      if (inside) {
        const i = clamp(Math.round((pointer.x - xs[0]) / STEP), 0, xs.length - 1);
        let best = -1;
        let bestD = CORE / 2 + 6;
        ys[i].forEach((y, n) => {
          const d = Math.abs(y - pointer.y);
          if (d < bestD) {
            bestD = d;
            best = n;
          }
        });
        if (best >= 0) {
          const ar = new Array<number>(GUIDES).fill(0);
          ar[best] = 1;
          const { re, im } = this.evolve(i, ar, new Array<number>(GUIDES).fill(0));
          this.pulses.push({ start: i, born: this.t, re, im });
          this.lastLaunch = this.t;
        }
      }
    }
    // Drop pulses once they've left the chip.
    const end = xs[xs.length - 1] + 3 * PULSE_LENGTH;
    this.pulses = this.pulses.filter((p) => xs[p.start] + PULSE_SPEED * (this.t - p.born) < end);
    this.solveSteady();
  }

  /** Mode field at distance d from a core's center (peak 1). */
  private mode(d: number) {
    const a = CORE / 2;
    const ad = Math.abs(d);
    return ad <= a ? Math.cos(this.kCore * d) : Math.cos(this.kCore * a) * Math.exp(-GAMMA * (ad - a));
  }

  /** Fill the pixel buffer with the light's intensity, in `color`. */
  paint(color: Rgb) {
    const { xs, ys, re, im, image, rows, top, pulses } = this;
    if (!image) return;
    const data = image.data;
    const cols = xs.length;
    const reach = CORE / 2 + 4 / GAMMA;
    const fr = new Float32Array(rows);
    const fi = new Float32Array(rows);
    /** Pulse intensity, added on top of the steady field. */
    const extra = new Float32Array(rows);
    const drift = 2 * Math.PI * RIPPLE_HZ * this.t;
    for (let i = 0; i < cols; i++) {
      fr.fill(0);
      fi.fill(0);
      extra.fill(0);
      let lowRow = rows;
      let highRow = 0;
      const touch = (yc: number) => {
        const r0 = Math.max(0, Math.floor(yc - reach));
        const r1 = Math.min(rows - 1, Math.ceil(yc + reach));
        lowRow = Math.min(lowRow, r0);
        highRow = Math.max(highRow, r1);
        return [r0, r1];
      };
      for (let n = 0; n < GUIDES; n++) {
        const ar = re[i][n];
        const ai = im[i][n];
        if (ar * ar + ai * ai < 1e-5) continue;
        const yc = ys[i][n] - top;
        const [r0, r1] = touch(yc);
        for (let r = r0; r <= r1; r++) {
          const u = this.mode(r + 0.5 - yc);
          fr[r] += ar * u;
          fi[r] += ai * u;
        }
      }
      for (const p of pulses) {
        const env = this.envelope(p, i);
        if (env < 0.01) continue;
        const k = i - p.start;
        for (let n = 0; n < GUIDES; n++) {
          const power = (p.re[k][n] ** 2 + p.im[k][n] ** 2) * env * env;
          if (power < 1e-4) continue;
          const yc = ys[i][n] - top;
          const [r0, r1] = touch(yc);
          for (let r = r0; r <= r1; r++) {
            const u = this.mode(r + 0.5 - yc);
            extra[r] += power * u * u;
          }
        }
      }
      for (let r = 0; r < rows; r++) {
        const o = (r * cols + i) * 4;
        data[o] = color[0];
        data[o + 1] = color[1];
        data[o + 2] = color[2];
        if (r < lowRow || r > highRow) {
          data[o + 3] = 0;
          continue;
        }
        const steady = fr[r] * fr[r] + fi[r] * fi[r];
        const intensity = steady + extra[r];
        if (intensity < 0.002) {
          data[o + 3] = 0;
          continue;
        }
        const phase = Math.atan2(fi[r], fr[r]) + BETA * (xs[i] - xs[0]) - drift;
        const ripple = 1 - RIPPLE_DEPTH / 2 + (RIPPLE_DEPTH / 2) * Math.cos(phase);
        data[o + 3] = Math.min(235, steady * 330 * ripple + extra[r] * 260);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const { xs, ys, re, im, image, buffer } = this;
    if (!xs.length) return;
    const c = rgb(color);
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineCap = 'round';
    const a = CORE / 2;
    // The cores: a faint fill between two edge lines, so their width reads.
    for (let n = 0; n < GUIDES; n++) {
      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0][n] - a);
      for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i][n] - a);
      for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], ys[i][n] + a);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = 1;
      for (const side of [-a, a]) {
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0][n] + side);
        for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i][n] + side);
        ctx.stroke();
      }
    }
    // The light: the coherent mode field plus any pulses, confined to the
    // cores with evanescent tails reaching across the narrow gaps.
    if (image && buffer) {
      this.paint(color);
      buffer.getContext('2d')?.putImageData(image, 0, 0);
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = true;
      const span = xs[xs.length - 1] - xs[0];
      const colWidth = span / Math.max(1, xs.length - 1);
      ctx.drawImage(buffer, xs[0] - colWidth / 2, this.top, span + colWidth, this.rows);
    }
    // Grating couplers: fans where light enters (guides 1 and 4) and leaves.
    const fan = (x: number, y: number, out: boolean, level: number) => {
      ctx.lineWidth = 1.1;
      for (let k = 1; k <= 3; k++) {
        ctx.globalAlpha = 0.16 + 0.5 * level * (1 - k * 0.2);
        ctx.beginPath();
        const dir = out ? 0 : Math.PI;
        ctx.arc(x - (out ? 5 : -5), y, 3 + k * 3, dir - 0.55, dir + 0.55);
        ctx.stroke();
      }
    };
    const last = xs.length - 1;
    for (let n = 0; n < GUIDES; n++) {
      const inLevel = Math.min(1, (re[0][n] ** 2 + im[0][n] ** 2) * 1.6);
      if (n === 1 || n === 4) fan(xs[0], ys[0][n], false, inLevel);
      fan(xs[last], ys[last][n], true, Math.min(1, (re[last][n] ** 2 + im[last][n] ** 2) * 1.6));
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }
}

// ---------------------------------------------------------------------------
// Boltzmann machine: units scattered across the space, wired by a random
// graph with positive (solid) or negative (dashed) weights. The graph is
// random but tidy: edges come from the units' Gabriel graph (so none cross),
// a random spanning tree keeps everything connected, and a random share of
// the remaining short edges is added on top.
// Units update one at a time by Gibbs sampling and fade on and off. Clicking
// a unit clamps it on (click again to release), and its influence spreads.

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
/** Single-unit updates per second. */
const UPDATES_PER_SECOND = 9;

export class Boltzmann implements Sim {
  private pos: [number, number][] = [];
  private edges: { a: number; b: number; w: number }[] = [];
  private neighbors: { j: number; w: number }[][] = [];
  private bias: number[] = [];
  private state: number[] = [];
  private shown: number[] = [];
  private clamped: boolean[] = [];
  private clock = 0;
  private hover = -1;
  private r = 8;
  private width = 0;
  private height = 0;

  resize(width: number, height: number) {
    // Only rebuild when the layout would change a lot (e.g. rotating a phone).
    if (this.pos.length && Math.abs(width - this.width) < 80 && Math.abs(height - this.height) < 80) {
      const sx = width / this.width;
      const sy = height / this.height;
      this.pos = this.pos.map(([x, y]) => [x * sx, y * sy]);
      this.width = width;
      this.height = height;
      return;
    }
    this.width = width;
    this.height = height;
    const wide = width >= 768;
    this.r = wide ? 8 : 6.5;
    const count = wide ? 21 : 14;
    // Wide screens: keep the graph clear of the name on the left.
    const left = wide ? width * 0.57 : width * 0.08;
    const right = width * 0.96;
    const top = height * 0.12;
    const bottom = height * 0.86;
    // Scatter units with a minimum spacing so the graph stays readable.
    const minGap = Math.sqrt(((right - left) * (bottom - top)) / count) * 0.62;
    const pos: [number, number][] = [];
    for (let tries = 0; pos.length < count && tries < 4000; tries++) {
      const p: [number, number] = [left + Math.random() * (right - left), top + Math.random() * (bottom - top)];
      if (pos.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) > minGap)) pos.push(p);
    }
    this.pos = pos;
    const weight = () => (Math.random() < 0.7 ? 1.4 + Math.random() * 1.8 : -(1.2 + Math.random() * 1.6));
    const dist = (a: number, b: number) => Math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]);
    // Gabriel graph: a and b connect if no other unit sits inside the circle
    // with ab as its diameter. It never has crossing edges.
    const candidates: { a: number; b: number; d: number }[] = [];
    for (let a = 0; a < pos.length; a++) {
      for (let b = a + 1; b < pos.length; b++) {
        const mx = (pos[a][0] + pos[b][0]) / 2;
        const my = (pos[a][1] + pos[b][1]) / 2;
        const r = dist(a, b) / 2;
        const blocked = pos.some((p, c) => c !== a && c !== b && Math.hypot(p[0] - mx, p[1] - my) < r);
        if (!blocked) candidates.push({ a, b, d: dist(a, b) });
      }
    }
    // A random spanning tree (Kruskal on shuffled candidates) keeps it connected.
    const root = pos.map((_, i) => i);
    const find = (i: number): number => (root[i] === i ? i : (root[i] = find(root[i])));
    const shuffled = candidates.slice().sort(() => Math.random() - 0.5);
    const lengths = candidates.map((c) => c.d).sort((m, n) => m - n);
    const longest = lengths[Math.floor(lengths.length * 0.8)] ?? Number.POSITIVE_INFINITY;
    this.edges = [];
    const extra: typeof candidates = [];
    for (const c of shuffled) {
      const ra = find(c.a);
      const rb = find(c.b);
      if (ra !== rb) {
        root[ra] = rb;
        this.edges.push({ a: c.a, b: c.b, w: weight() });
      } else if (c.d <= longest) {
        extra.push(c);
      }
    }
    // Then some of the remaining short edges, so it's a graph, not just a tree.
    for (const c of extra) if (Math.random() < 0.45) this.edges.push({ a: c.a, b: c.b, w: weight() });
    this.neighbors = pos.map(() => []);
    for (const { a, b, w } of this.edges) {
      this.neighbors[a].push({ j: b, w });
      this.neighbors[b].push({ j: a, w });
    }
    this.bias = pos.map(() => -1.6 + Math.random() * 0.6);
    this.state = pos.map(() => (Math.random() < 0.3 ? 1 : 0));
    this.shown = [...this.state];
    this.clamped = pos.map(() => false);
  }

  private update(i: number) {
    if (this.clamped[i]) {
      this.state[i] = 1;
      return;
    }
    let z = this.bias[i];
    for (const { j, w } of this.neighbors[i]) z += w * this.state[j];
    this.state[i] = Math.random() < sigmoid(z) ? 1 : 0;
  }

  step(dt: number, pointer: Pointer) {
    this.clock += dt * UPDATES_PER_SECOND;
    while (this.clock >= 1) {
      this.clock -= 1;
      this.update((Math.random() * this.pos.length) | 0);
    }
    // Units fade on and off rather than blinking.
    const ease = 1 - Math.exp(-dt * 3.5);
    this.shown = this.shown.map((s, i) => s + (this.state[i] - s) * ease);
    this.hover = pointer.active ? this.nearest(pointer.x, pointer.y) : -1;
  }

  private nearest(x: number, y: number) {
    return this.pos.findIndex(([px, py]) => Math.hypot(px - x, py - y) < this.r * 2.6);
  }

  press(x: number, y: number) {
    const i = this.nearest(x, y);
    if (i < 0) return;
    this.clamped[i] = !this.clamped[i];
    if (this.clamped[i]) this.state[i] = 1;
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const { pos, edges, shown, hover, r } = this;
    if (!pos.length) return;
    ctx.strokeStyle = rgb(color);
    ctx.fillStyle = rgb(color);
    // Edges: brighter where both ends are on, and around the hovered unit.
    for (const { a, b, w } of edges) {
      const touched = hover === a || hover === b;
      const live = shown[a] * shown[b];
      ctx.globalAlpha = Math.min(0.9, (0.14 + 0.5 * live) * (Math.abs(w) / 3.2) * (touched ? 2.4 : 1) + (touched ? 0.15 : 0));
      ctx.lineWidth = w > 0 ? 1.3 : 0.9;
      ctx.setLineDash(w > 0 ? [] : [3, 4]);
      ctx.beginPath();
      ctx.moveTo(pos[a][0], pos[a][1]);
      ctx.lineTo(pos[b][0], pos[b][1]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    pos.forEach((p, i) => {
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
      ctx.stroke();
      if (shown[i] > 0.02) {
        ctx.globalAlpha = 0.85 * shown[i];
        ctx.beginPath();
        ctx.arc(p[0], p[1], r - 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (this.clamped[i] || hover === i) {
        ctx.globalAlpha = this.clamped[i] ? 0.9 : 0.4;
        ctx.beginPath();
        ctx.arc(p[0], p[1], r + 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }
}

export const SIMS: Record<SimKey, { create: () => Sim; caption: string }> = {
  spins: {
    create: () => new SpinLattice(),
    caption: 'Ising spins near the critical temperature. Your cursor heats them, so they flip at random.',
  },
  swarm: {
    create: () => new Swarm(),
    caption: 'A Vicsek swarm: each agent follows its neighbors. Your cursor scatters them.',
  },
  photonics: {
    create: () => new CoupledWaveguides(),
    caption: 'Coupled waveguides: each core confines light, which tunnels across where evanescent tails overlap. Touch a guide to send a pulse.',
  },
  boltzmann: {
    create: () => new Boltzmann(),
    caption: 'A Boltzmann machine, Gibbs sampling one unit at a time. Click a unit to clamp it on.',
  },
};
