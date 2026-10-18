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
// is a magnetic field: spins under it align, leaving a trail that slowly
// melts back into the domains.

const T_BASE = 2.3;
/** Lattice sweeps per second. Slow on purpose: domains drift rather than churn. */
const SWEEPS_PER_SECOND = 1.4;
/** How fast a cell's drawn state follows its spin (per second). Low = gentle fades. */
const FADE_RATE = 3.5;
const LEVELS = 8;
/** Field strength at the pointer, in units of the coupling J. */
const FIELD = 6;

export class SpinLattice implements Sim {
  private cols = 0;
  private rows = 0;
  private cell = 13;
  private spins = new Int8Array(0);
  /** Drawn state per cell, easing from -1 (down) to 1 (up). */
  private shown = new Float32Array(0);
  private boltz = { 4: 0, 8: 0 } as Record<number, number>;
  private pending = 0;
  /** Where the field is, and how visible its ring is (eases in and out). */
  private magnet = { x: 0, y: 0, shown: 0 };

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

  /** One Metropolis attempt at cell (x, y), with field `h` pushing spins up. */
  private attempt(x: number, y: number, h: number) {
    const { cols, rows, spins } = this;
    const i = y * cols + x;
    const s = spins[i];
    const sum =
      spins[y * cols + ((x + 1) % cols)] +
      spins[y * cols + ((x - 1 + cols) % cols)] +
      spins[((y + 1) % rows) * cols + x] +
      spins[((y - 1 + rows) % rows) * cols + x];
    const dE = 2 * s * (sum + h);
    if (dE <= 0 || Math.random() < (h === 0 ? this.boltz[dE] : Math.exp(-dE / T_BASE))) {
      spins[i] = -s as -1 | 1;
    }
  }

  private fieldAt(x: number, y: number, pointer: Pointer | null) {
    if (!pointer?.active) return 0;
    const radius = 5 * this.cell;
    const d = Math.hypot((x + 0.5) * this.cell - pointer.x, (y + 0.5) * this.cell - pointer.y);
    return d < radius ? FIELD * (1 - d / radius) : 0;
  }

  private sweep(fraction: number, pointer: Pointer | null) {
    const n = this.cols * this.rows;
    const attempts = Math.floor(n * fraction);
    for (let a = 0; a < attempts; a++) {
      const i = (Math.random() * n) | 0;
      const x = i % this.cols;
      const y = (i / this.cols) | 0;
      this.attempt(x, y, this.fieldAt(x, y, pointer));
    }
  }

  /** Extra updates right around the pointer, so the field acts at once. */
  private sweepNear(pointer: Pointer, count: number) {
    const reach = 5;
    const cx = Math.floor(pointer.x / this.cell);
    const cy = Math.floor(pointer.y / this.cell);
    for (let a = 0; a < count; a++) {
      const x = cx + Math.round((Math.random() * 2 - 1) * reach);
      const y = cy + Math.round((Math.random() * 2 - 1) * reach);
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) continue;
      this.attempt(x, y, this.fieldAt(x, y, pointer));
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
      this.sweepNear(pointer, Math.round(dt * 2400));
      this.magnet.x = pointer.x;
      this.magnet.y = pointer.y;
    }
    this.magnet.shown += ((pointer.active ? 1 : 0) - this.magnet.shown) * (1 - Math.exp(-dt * 6));
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
    // A faint ring marks the field's reach, so the cursor reads as a magnet.
    if (this.magnet.shown > 0.01) {
      ctx.strokeStyle = rgb(color);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5 * this.magnet.shown;
      ctx.beginPath();
      ctx.arc(this.magnet.x, this.magnet.y, 5 * cell, 0, Math.PI * 2);
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
// Photonic circuit: a small chip layout. Light enters through a grating
// coupler, splits at a Y-branch, and runs along two buses past add-drop ring
// resonators, a directional coupler, and an all-pass ring. Each ring's
// resonance drifts slowly; on resonance (a Lorentzian line) it pulls light out
// of the bus into its drop port. Hovering a ring heats it onto resonance.
// Brightness follows smoothed optical power, so nothing strobes; small dots
// drift along each guide to show which way light flows.

type Pt = [number, number];

/** Sample a straight line from a to b. */
function line(a: Pt, b: Pt, step = 6): Pt[] {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as Pt);
}

/** Sample a smooth S-bend from a to b (cosine easing in y). */
function sbend(a: Pt, b: Pt, step = 4): Pt[] {
  const n = Math.max(2, Math.ceil(Math.abs(b[0] - a[0]) / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + ((b[1] - a[1]) * (1 - Math.cos(Math.PI * t))) / 2] as Pt;
  });
}

/** Join path pieces, dropping each piece's duplicated first point. */
function path(...pieces: Pt[][]): Pt[] {
  return pieces.flatMap((p, i) => (i === 0 ? p : p.slice(1)));
}

interface Guide {
  pts: Pt[];
  /** Cumulative length at each point, for placing flow dots. */
  len: number[];
  /** Power carried, 0..1, eased toward its target. */
  shown: number;
  target: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  /** Resonance drift: detuning = amp * sin(2π t / period + phase). */
  period: number;
  phase: number;
  /** Current detuning, in linewidths, eased toward its target. */
  detune: number;
  /** Fraction of incoming light the ring takes (Lorentzian in detuning). */
  take: number;
  /** Light circulating in the ring, 0..1, eased. */
  glow: number;
  hovered: boolean;
}

const FLOW_SPEED = 46;
const DOT_SPACING = 30;
const DRIFT_AMPLITUDE = 4.5;
const POWER_RATE = 3;

export class PhotonicCircuit implements Sim {
  private guides: Record<string, Guide> = {};
  private rings: Ring[] = [];
  private couplers: { at: Pt; out: boolean; guide: string }[] = [];
  private t = 0;
  private hoverRadius = 30;

  resize(width: number, height: number) {
    const wide = width >= 768;
    // Wide screens: keep the whole chip clear of the name on the left.
    const L = wide ? width * 0.56 : width * 0.08;
    const R = width * 0.97;
    const T = height * (wide ? 0.13 : 0.1);
    const B = height * (wide ? 0.86 : 0.9);
    const X = (u: number) => L + (R - L) * u;
    const Y = (v: number) => T + (B - T) * v;
    // Rings shrink on narrow screens so neighbouring parts don't collide.
    const r = clamp(Math.min((B - T) * 0.085, (R - L) * 0.05), 9, 26);
    const bendLength = clamp(r * 3, 24, 60);
    const gap = 4;
    this.hoverRadius = r * 1.9;

    const inY = Y(0.5);
    const upY = Y(0.34);
    const lowY = Y(0.72);
    const ring1: Pt = [X(0.42), upY - gap - r];
    const ring2: Pt = [X(0.66), upY - gap - r];
    const ring3: Pt = [X(0.86), lowY + gap + r];
    const drop1Y = ring1[1] - r - gap;
    const drop2Y = ring2[1] - r - gap;
    const crossY = lowY + gap + 1.5;

    const g = (pts: Pt[]): Guide => {
      const len = [0];
      for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { pts, len, shown: 0, target: 0 };
    };

    this.guides = {
      input: g(line([X(0), inY], [X(0.1), inY])),
      splitUp: g(sbend([X(0.1), inY], [X(0.24), upY])),
      splitDown: g(sbend([X(0.1), inY], [X(0.24), lowY])),
      upA: g(line([X(0.24), upY], [ring1[0], upY])),
      upB: g(line([ring1[0], upY], [ring2[0], upY])),
      upC: g(line([ring2[0], upY], [X(1), upY])),
      drop1Stub: g(line([ring1[0] - r * 1.8, drop1Y], [ring1[0], drop1Y])),
      drop1: g(
        path(
          line([ring1[0], drop1Y], [ring1[0] + r * 1.6, drop1Y]),
          sbend([ring1[0] + r * 1.6, drop1Y], [ring1[0] + r * 1.6 + bendLength, Y(0.02)]),
          line([ring1[0] + r * 1.6 + bendLength, Y(0.02)], [X(1), Y(0.02)])
        )
      ),
      drop2Stub: g(line([ring2[0] - r * 1.8, drop2Y], [ring2[0], drop2Y])),
      drop2: g(line([ring2[0], drop2Y], [X(1), drop2Y])),
      lowA: g(line([X(0.24), lowY], [X(0.44), lowY])),
      lowCoupler: g(line([X(0.44), lowY], [X(0.58), lowY])),
      lowB: g(line([X(0.58), lowY], [ring3[0], lowY])),
      lowC: g(line([ring3[0], lowY], [X(1), lowY])),
      crossIn: g(path(line([X(0.3), Y(0.99)], [X(0.32), Y(0.99)]), sbend([X(0.32), Y(0.99)], [X(0.44), crossY]))),
      crossCoupler: g(line([X(0.44), crossY], [X(0.58), crossY])),
      crossOut: g(path(sbend([X(0.58), crossY], [X(0.7), Y(0.99)]), line([X(0.7), Y(0.99)], [X(1), Y(0.99)]))),
    };

    // Keep each ring's drift when resizing, so the light doesn't jump.
    const old = this.rings;
    this.rings = [ring1, ring2, ring3].map(([x, y], i) => ({
      x,
      y,
      r,
      period: old[i]?.period ?? 7 + Math.random() * 4,
      phase: old[i]?.phase ?? Math.random() * Math.PI * 2,
      detune: old[i]?.detune ?? DRIFT_AMPLITUDE,
      take: old[i]?.take ?? 0,
      glow: old[i]?.glow ?? 0,
      hovered: false,
    }));
    this.couplers = [
      { at: [X(0), inY], out: false, guide: 'input' },
      { at: [X(1), upY], out: true, guide: 'upC' },
      { at: [X(1), Y(0.02)], out: true, guide: 'drop1' },
      { at: [X(1), drop2Y], out: true, guide: 'drop2' },
      { at: [X(1), lowY], out: true, guide: 'lowC' },
      { at: [X(1), Y(0.99)], out: true, guide: 'crossOut' },
    ];
    // Start settled rather than fading in from dark.
    this.solve();
    for (const guide of Object.values(this.guides)) guide.shown = guide.target;
  }

  /** Steady-state power through the circuit for the rings' current detuning. */
  private solve() {
    const [r1, r2, r3] = this.rings;
    for (const ring of this.rings) ring.take = 1 / (1 + ring.detune * ring.detune);
    const set = (name: string, p: number) => {
      this.guides[name].target = p;
    };
    set('input', 1);
    set('splitUp', 0.5);
    set('splitDown', 0.5);
    set('upA', 0.5);
    set('drop1', 0.5 * r1.take);
    const afterRing1 = 0.5 * (1 - r1.take);
    set('upB', afterRing1);
    set('drop2', afterRing1 * r2.take);
    set('upC', afterRing1 * (1 - r2.take));
    set('lowA', 0.5);
    set('lowCoupler', 0.375);
    set('crossIn', 0);
    set('drop1Stub', 0);
    set('drop2Stub', 0);
    set('crossCoupler', 0.125);
    set('crossOut', 0.25);
    set('lowB', 0.25);
    // The all-pass ring mostly absorbs what it takes.
    set('lowC', 0.25 * (1 - 0.85 * r3.take));
  }

  step(dt: number, pointer: Pointer) {
    this.t += dt;
    const ease = 1 - Math.exp(-dt * POWER_RATE);
    for (const ring of this.rings) {
      ring.hovered = pointer.active && Math.hypot(pointer.x - ring.x, pointer.y - ring.y) < this.hoverRadius;
      // Hovering heats the ring onto resonance; otherwise it drifts.
      const target = ring.hovered ? 0 : DRIFT_AMPLITUDE * Math.sin((2 * Math.PI * this.t) / ring.period + ring.phase);
      ring.detune += (target - ring.detune) * (1 - Math.exp(-dt * 2.5));
    }
    this.solve();
    for (const guide of Object.values(this.guides)) guide.shown += (guide.target - guide.shown) * ease;
    const [r1, r2, r3] = this.rings;
    const feeds = [0.5 * r1.take, this.guides.upB.target * r2.take, 0.25 * r3.take];
    this.rings.forEach((ring, i) => {
      ring.glow += (Math.min(1, feeds[i] * 2.2) - ring.glow) * ease;
    });
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const c = rgb(color);
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineCap = 'round';
    const level = (p: number) => Math.min(1, p * 1.8);

    const stroke = (pts: Pt[]) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };

    // The chip layout, then the light it carries.
    for (const guide of Object.values(this.guides)) {
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1.5;
      stroke(guide.pts);
      const p = level(guide.shown);
      if (p > 0.01) {
        ctx.globalAlpha = 0.12 + 0.5 * p;
        ctx.lineWidth = 3;
        stroke(guide.pts);
      }
    }

    // Flow dots, drifting left to right.
    const offset = (this.t * FLOW_SPEED) % DOT_SPACING;
    for (const guide of Object.values(this.guides)) {
      const p = level(guide.shown);
      if (p < 0.03) continue;
      ctx.globalAlpha = 0.8 * p;
      const total = guide.len[guide.len.length - 1];
      let k = 0;
      ctx.beginPath();
      for (let d = offset; d < total; d += DOT_SPACING) {
        while (k < guide.len.length - 2 && guide.len[k + 1] < d) k++;
        const span = guide.len[k + 1] - guide.len[k] || 1;
        const f = (d - guide.len[k]) / span;
        const x = guide.pts[k][0] + (guide.pts[k + 1][0] - guide.pts[k][0]) * f;
        const y = guide.pts[k][1] + (guide.pts[k + 1][1] - guide.pts[k][1]) * f;
        ctx.moveTo(x + 2, y);
        ctx.arc(x, y, 2, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Rings: outline, circulating light, and a heater mark when hovered.
    for (const ring of this.rings) {
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      if (ring.glow > 0.01) {
        ctx.globalAlpha = 0.12 + 0.55 * ring.glow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.85 * ring.glow;
        ctx.beginPath();
        const count = Math.max(4, Math.round((2 * Math.PI * ring.r) / DOT_SPACING));
        const spin = (this.t * FLOW_SPEED) / ring.r;
        for (let i = 0; i < count; i++) {
          const a = spin + (i / count) * Math.PI * 2;
          const x = ring.x + Math.cos(a) * ring.r;
          const y = ring.y + Math.sin(a) * ring.r;
          ctx.moveTo(x + 2, y);
          ctx.arc(x, y, 2, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      if (ring.hovered) {
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Grating couplers: small fans where light enters and leaves the chip.
    for (const { at, out, guide } of this.couplers) {
      const p = level(this.guides[guide].shown);
      ctx.lineWidth = 1.2;
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.18 + 0.5 * p * (1 - i * 0.2);
        ctx.beginPath();
        const dir = out ? 0 : Math.PI;
        ctx.arc(at[0] - (out ? 6 : -6), at[1], 4 + i * 3.5, dir - 0.55, dir + 0.55);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }
}

// ---------------------------------------------------------------------------
// Boltzmann machine: units scattered across the space, each wired to a few
// nearby units with random positive (solid) or negative (dashed) weights.
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
    const count = wide ? 24 : 14;
    const left = width * rightBias(width) + width * 0.05;
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
    // Wire each unit to its three nearest neighbors (no duplicates).
    const seen = new Set<string>();
    this.edges = [];
    pos.forEach((p, a) => {
      const nearest = pos
        .map((q, b) => ({ b, d: Math.hypot(q[0] - p[0], q[1] - p[1]) }))
        .filter(({ b }) => b !== a)
        .sort((m, n) => m.d - n.d)
        .slice(0, 3);
      for (const { b } of nearest) {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // Mostly excitatory, some inhibitory, so on-clusters form and compete.
        const w = Math.random() < 0.7 ? 1.4 + Math.random() * 1.8 : -(1.2 + Math.random() * 1.6);
        this.edges.push({ a, b, w });
      }
    });
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
    caption: 'Ising spins near the critical temperature. Your cursor is a magnetic field: spins under it align.',
  },
  swarm: {
    create: () => new Swarm(),
    caption: 'A Vicsek swarm: each agent follows its neighbors. Your cursor scatters them.',
  },
  photonics: {
    create: () => new PhotonicCircuit(),
    caption: 'A photonic circuit: on resonance, a ring pulls light into its own waveguide. Hover a ring to tune it.',
  },
  boltzmann: {
    create: () => new Boltzmann(),
    caption: 'A Boltzmann machine, Gibbs sampling one unit at a time. Click a unit to clamp it on.',
  },
};
