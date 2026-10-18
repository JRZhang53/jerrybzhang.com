import type { Pointer, Rgb, Sim } from './types';
import { clamp, rgb } from './helpers';
import { propagate } from './waveguide-propagation';

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

interface ModeProfile {
  start: number;
  values: Float64Array;
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
  private basis1: ReturnType<typeof propagate> = { re: [], im: [] };
  private basis4: ReturnType<typeof propagate> = { re: [], im: [] };
  private profiles: ModeProfile[][] = [];
  private fieldReal = new Float32Array(0);
  private fieldImaginary = new Float32Array(0);
  private pulseIntensity = new Float32Array(0);
  private paintedColor = '';

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
    // Geometry is fixed until resize. Propagating two unit inputs once is
    // equivalent to integrating their changing linear combination each frame.
    const unit = (guide: number) => Array.from({ length: GUIDES }, (_, n) => Number(n === guide));
    this.basis1 = propagate(this.xs, this.kap, 0, unit(1), new Array<number>(GUIDES).fill(0));
    this.basis4 = propagate(this.xs, this.kap, 0, unit(4), new Array<number>(GUIDES).fill(0));
    this.re = this.xs.map(() => new Array<number>(GUIDES).fill(0));
    this.im = this.xs.map(() => new Array<number>(GUIDES).fill(0));
    const reach = CORE / 2 + 4 / GAMMA;
    this.profiles = this.ys.map((ys) => ys.map((y) => {
      const center = y - this.top;
      const start = Math.max(0, Math.floor(center - reach));
      const end = Math.min(this.rows - 1, Math.ceil(center + reach));
      return { start, values: Float64Array.from({ length: end - start + 1 }, (_, r) => this.mode(start + r + 0.5 - center)) };
    }));
    this.fieldReal = new Float32Array(this.rows);
    this.fieldImaginary = new Float32Array(this.rows);
    this.pulseIntensity = new Float32Array(this.rows);
    this.paintedColor = '';
    this.solveSteady();
  }

  /** The steady field from the two drifting inputs. */
  private solveSteady() {
    const theta = Math.PI / 4 + (Math.PI / 4) * Math.sin((2 * Math.PI * this.t) / this.balancePeriod);
    const phi = (2 * Math.PI * this.t) / this.phasePeriod;
    const a = Math.cos(theta);
    const br = Math.sin(theta) * Math.cos(phi);
    const bi = Math.sin(theta) * Math.sin(phi);
    for (let i = 0; i < this.xs.length; i++) {
      for (let n = 0; n < GUIDES; n++) {
        this.re[i][n] = a * this.basis1.re[i][n] + br * this.basis4.re[i][n] - bi * this.basis4.im[i][n];
        this.im[i][n] = a * this.basis1.im[i][n] + br * this.basis4.im[i][n] + bi * this.basis4.re[i][n];
      }
    }
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
          const { re, im } = propagate(this.xs, this.kap, i, ar, new Array<number>(GUIDES).fill(0));
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
    const { xs, re, im, image, rows, pulses, profiles } = this;
    if (!image) return;
    const data = image.data;
    const cols = xs.length;
    const fr = this.fieldReal;
    const fi = this.fieldImaginary;
    /** Pulse intensity, added on top of the steady field. */
    const extra = this.pulseIntensity;
    const colorKey = color.join(',');
    if (this.paintedColor !== colorKey) {
      for (let o = 0; o < data.length; o += 4) {
        data[o] = color[0];
        data[o + 1] = color[1];
        data[o + 2] = color[2];
      }
      this.paintedColor = colorKey;
    }
    const drift = 2 * Math.PI * RIPPLE_HZ * this.t;
    for (let i = 0; i < cols; i++) {
      fr.fill(0);
      fi.fill(0);
      extra.fill(0);
      let lowRow = rows;
      let highRow = 0;
      for (let n = 0; n < GUIDES; n++) {
        const ar = re[i][n];
        const ai = im[i][n];
        if (ar * ar + ai * ai < 1e-5) continue;
        const { start, values } = profiles[i][n];
        lowRow = Math.min(lowRow, start);
        highRow = Math.max(highRow, start + values.length - 1);
        for (let j = 0; j < values.length; j++) {
          const r = start + j;
          const u = values[j];
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
          const { start, values } = profiles[i][n];
          lowRow = Math.min(lowRow, start);
          highRow = Math.max(highRow, start + values.length - 1);
          for (let j = 0; j < values.length; j++) {
            const r = start + j;
            const u = values[j];
            extra[r] += power * u * u;
          }
        }
      }
      for (let r = 0; r < rows; r++) {
        const o = (r * cols + i) * 4;
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
