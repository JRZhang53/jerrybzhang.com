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

export type SimKey = 'spins' | 'swarm' | 'waveguide' | 'boltzmann';

const rgb = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Wide screens keep the busiest part of each sim to the right of the name. */
const rightBias = (width: number) => (width >= 768 ? 0.42 : 0.06);

// ---------------------------------------------------------------------------
// Ising model: Metropolis updates on a square lattice just above the critical
// temperature, where domains of every size form and dissolve. The pointer
// heats the spins around it.

const T_BASE = 2.35;

export class SpinLattice implements Sim {
  private cols = 0;
  private rows = 0;
  private cell = 13;
  private spins = new Int8Array(0);
  private boltz = { 4: 0, 8: 0 } as Record<number, number>;

  resize(width: number, height: number) {
    this.cell = clamp(Math.round(width / 95), 10, 15);
    this.cols = Math.ceil(width / this.cell);
    this.rows = Math.ceil(height / this.cell);
    this.spins = new Int8Array(this.cols * this.rows);
    for (let i = 0; i < this.spins.length; i++) this.spins[i] = Math.random() < 0.5 ? 1 : -1;
    this.boltz = { 4: Math.exp(-4 / T_BASE), 8: Math.exp(-8 / T_BASE) };
    // Settle into critical-looking domains before the first frame.
    for (let i = 0; i < 40; i++) this.sweep(1, null);
  }

  private sweep(fraction: number, pointer: Pointer | null) {
    const { cols, rows, spins, cell } = this;
    const n = cols * rows;
    const attempts = Math.floor(n * fraction);
    const heat = pointer?.active ? pointer : null;
    const radius = 7 * cell;
    for (let a = 0; a < attempts; a++) {
      const i = (Math.random() * n) | 0;
      const x = i % cols;
      const y = (i / cols) | 0;
      const s = spins[i];
      const sum =
        spins[y * cols + ((x + 1) % cols)] +
        spins[y * cols + ((x - 1 + cols) % cols)] +
        spins[((y + 1) % rows) * cols + x] +
        spins[((y - 1 + rows) % rows) * cols + x];
      const dE = 2 * s * sum;
      if (dE <= 0) {
        spins[i] = -s as -1 | 1;
        continue;
      }
      let p = this.boltz[dE];
      if (heat) {
        const d = Math.hypot((x + 0.5) * cell - heat.x, (y + 0.5) * cell - heat.y);
        if (d < radius) p = Math.exp(-dE / (T_BASE + 7 * (1 - d / radius)));
      }
      if (Math.random() < p) spins[i] = -s as -1 | 1;
    }
  }

  step(dt: number, pointer: Pointer) {
    this.sweep(clamp(dt * 60, 0, 2) * 0.35, pointer);
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const { cols, rows, spins, cell } = this;
    ctx.fillStyle = rgb(color);
    const big = cell - 4;
    const small = Math.max(1.5, cell * 0.16);
    ctx.globalAlpha = 0.3;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (spins[y * cols + x] > 0) ctx.fillRect(x * cell + 2, y * cell + 2, big, big);
      }
    }
    ctx.globalAlpha = 0.2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (spins[y * cols + x] < 0) {
          ctx.fillRect((x + 0.5) * cell - small / 2, (y + 0.5) * cell - small / 2, small, small);
        }
      }
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
// Waveguide: a 2D scalar wave equation (finite differences) with a slower,
// higher-index core bent into an S. Light launched at the left stays in the
// core by total internal reflection. The pointer drops ripples into the field.

const N_CORE = 1.7;

export class Waveguide implements Sim {
  private cell = 5;
  private cols = 0;
  private rows = 0;
  private u = new Float32Array(0);
  private prev = new Float32Array(0);
  private k2 = new Float32Array(0);
  private damp = new Float32Array(0);
  private center: number[] = [];
  private halfWidth = 4;
  private readonly edge = 14;
  private t = 0;
  private dropClock = 0;
  private image: ImageData | null = null;
  private buffer: HTMLCanvasElement | null = null;
  private w = 0;
  private h = 0;

  resize(width: number, height: number) {
    this.w = width;
    this.h = height;
    this.cell = width < 600 ? 4 : 5;
    const cols = (this.cols = Math.ceil(width / this.cell));
    const rows = (this.rows = Math.ceil(height / this.cell));
    const n = cols * rows;
    this.u = new Float32Array(n);
    this.prev = new Float32Array(n);
    this.k2 = new Float32Array(n);
    this.damp = new Float32Array(n);
    this.halfWidth = Math.max(3, Math.round(rows * 0.035));
    const bendAt = cols * (width >= 768 ? 0.62 : 0.5);
    const low = rows * 0.8;
    const high = rows * (width >= 768 ? 0.36 : 0.22);
    this.center = Array.from({ length: cols }, (_, x) => low - ((low - high) * (1 + Math.tanh((x - bendAt) / (cols * 0.13)))) / 2);
    const edge = this.edge;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const inCore = Math.abs(y - this.center[x]) <= this.halfWidth;
        const c = inCore ? 1 / N_CORE : 1;
        this.k2[i] = c * c * 0.25; // (c·dt/dx)², with dt = 0.5
        const d = Math.min(x, y, cols - 1 - x, rows - 1 - y);
        // Absorbing layer at every edge, so nothing reflects back in, and a
        // slightly lossy cladding so light that escapes the core fades out.
        const edgeLoss = d < edge ? 0.06 * (1 - d / edge) ** 2 : 0;
        const coreDist = Math.abs(y - this.center[x]) - this.halfWidth;
        const claddingLoss = coreDist > 3 ? Math.min(0.012, 0.0025 * (coreDist - 3)) : 0;
        this.damp[i] = Math.max(edgeLoss, claddingLoss);
      }
    }
    this.image = new ImageData(cols, rows);
    this.buffer = document.createElement('canvas');
    this.buffer.width = cols;
    this.buffer.height = rows;
    // Fill the guide before the first frame.
    for (let i = 0; i < Math.ceil(cols * 3.2); i++) this.tick();
  }

  private tick() {
    const { cols, rows, u, prev, k2, damp } = this;
    // Continuous source just inside the left edge, shaped like the guide's lowest mode.
    this.t += 0.5;
    const sx = this.edge + 1;
    const cy = this.center[sx];
    for (let dy = -this.halfWidth; dy <= this.halfWidth; dy++) {
      const y = Math.round(cy + dy);
      if (y < 1 || y >= rows - 1) continue;
      const profile = Math.cos((dy / (this.halfWidth + 1)) * (Math.PI / 2));
      // Ramp up gently: a sudden start sprays light at every angle.
      const ramp = Math.min(1, this.t / 120);
      u[y * cols + sx] += 0.35 * ramp * profile * Math.sin(this.t * 0.42);
    }
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        const lap = u[i - 1] + u[i + 1] + u[i - cols] + u[i + cols] - 4 * u[i];
        // Leapfrog: the step before is no longer needed, so the new field goes there.
        prev[i] = (2 * u[i] - prev[i] + k2[i] * lap) * (1 - damp[i]);
      }
    }
    // Swap roles: `prev` now holds the newest field.
    this.u = prev;
    this.prev = u;
  }

  step(dt: number, pointer: Pointer) {
    const steps = clamp(Math.round(dt * 60 * 2), 1, 4);
    for (let s = 0; s < steps; s++) this.tick();
    this.dropClock -= dt;
    if (pointer.active && this.dropClock <= 0) {
      this.dropClock = 0.12;
      const px = Math.round(pointer.x / this.cell);
      const py = Math.round(pointer.y / this.cell);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = px + dx;
          const y = py + dy;
          if (x < 1 || y < 1 || x >= this.cols - 1 || y >= this.rows - 1) continue;
          this.u[y * this.cols + x] += 0.9 * Math.exp(-(dx * dx + dy * dy) / 2);
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const { image, buffer, u, cols, rows } = this;
    if (!image || !buffer) return;
    const data = image.data;
    for (let i = 0; i < cols * rows; i++) {
      const o = i * 4;
      data[o] = color[0];
      data[o + 1] = color[1];
      data[o + 2] = color[2];
      data[o + 3] = Math.min(200, Math.abs(u[i]) * 240);
    }
    buffer.getContext('2d')?.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buffer, 0, 0, cols * this.cell, rows * this.cell);
    // The core's edges, faintly.
    ctx.strokeStyle = rgb(color);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let x = 0; x < cols; x += 2) {
        const y = (this.center[x] + side * (this.halfWidth + 0.5)) * this.cell;
        if (x === 0) ctx.moveTo(0, y);
        else ctx.lineTo(x * this.cell, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// Restricted Boltzmann machine: a row of visible units and a row of hidden
// units, block Gibbs sampled back and forth. Clicking a visible unit clamps it
// on (click again to release), and the hidden layer follows.

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export class Boltzmann implements Sim {
  private nv = 0;
  private nh = 0;
  private wts: number[][] = [];
  private bv: number[] = [];
  private bh: number[] = [];
  private v: number[] = [];
  private h: number[] = [];
  private shownV: number[] = [];
  private shownH: number[] = [];
  private clamped: boolean[] = [];
  private posV: [number, number][] = [];
  private posH: [number, number][] = [];
  private clock = 0;
  private sampleHidden = true;
  private hover: { layer: 'v' | 'h'; i: number } | null = null;
  private r = 9;

  resize(width: number, height: number) {
    const wide = width >= 768;
    const nv = wide ? 10 : 7;
    const nh = wide ? 6 : 4;
    if (nv !== this.nv) this.init(nv, nh);
    const left = width * rightBias(width) + width * 0.04;
    const right = width * (wide ? 0.95 : 0.94);
    const spread = (count: number, y: number) =>
      Array.from({ length: count }, (_, i) => [left + ((right - left) * (i + 0.5)) / count, y] as [number, number]);
    this.posH = spread(nh, height * (wide ? 0.28 : 0.2));
    this.posV = spread(nv, height * (wide ? 0.76 : 0.84));
    this.r = wide ? 9 : 7;
  }

  private init(nv: number, nh: number) {
    this.nv = nv;
    this.nh = nh;
    // Each hidden unit likes a contiguous patch of visible units, so samples
    // show recognizable on/off blocks rather than noise.
    this.wts = Array.from({ length: nv }, (_, i) =>
      Array.from({ length: nh }, (_, j) => {
        const centerOf = ((j + 0.5) / nh) * nv;
        const near = Math.abs(i + 0.5 - centerOf) < nv / nh;
        return (near ? 2.6 : -1.2) + (Math.random() - 0.5) * 0.8;
      })
    );
    this.bv = Array.from({ length: nv }, () => -0.6);
    this.bh = Array.from({ length: nh }, () => -1.2);
    this.v = Array.from({ length: nv }, () => (Math.random() < 0.4 ? 1 : 0));
    this.h = Array.from({ length: nh }, () => 0);
    this.shownV = [...this.v];
    this.shownH = [...this.h];
    this.clamped = Array.from({ length: nv }, () => false);
  }

  step(dt: number, pointer: Pointer) {
    this.clock -= dt;
    if (this.clock <= 0) {
      this.clock = 0.32;
      if (this.sampleHidden) {
        this.h = this.h.map((_, j) => {
          let z = this.bh[j];
          for (let i = 0; i < this.nv; i++) z += this.wts[i][j] * this.v[i];
          return Math.random() < sigmoid(z) ? 1 : 0;
        });
      } else {
        this.v = this.v.map((old, i) => {
          if (this.clamped[i]) return 1;
          let z = this.bv[i];
          for (let j = 0; j < this.nh; j++) z += this.wts[i][j] * this.h[j];
          return Math.random() < sigmoid(z) ? 1 : 0;
        });
      }
      this.sampleHidden = !this.sampleHidden;
    }
    const ease = 1 - Math.exp(-dt * 12);
    this.shownV = this.shownV.map((s, i) => s + (this.v[i] - s) * ease);
    this.shownH = this.shownH.map((s, j) => s + (this.h[j] - s) * ease);
    this.hover = pointer.active ? this.nearest(pointer.x, pointer.y) : null;
  }

  private nearest(x: number, y: number) {
    const hit = (pos: [number, number][]) => pos.findIndex(([px, py]) => Math.hypot(px - x, py - y) < this.r * 2.4);
    const vi = hit(this.posV);
    if (vi >= 0) return { layer: 'v' as const, i: vi };
    const hi = hit(this.posH);
    if (hi >= 0) return { layer: 'h' as const, i: hi };
    return null;
  }

  press(x: number, y: number) {
    const target = this.nearest(x, y);
    if (target?.layer !== 'v') return;
    const i = target.i;
    this.clamped[i] = !this.clamped[i];
    if (this.clamped[i]) this.v[i] = 1;
  }

  draw(ctx: CanvasRenderingContext2D, color: Rgb) {
    const { posV, posH, shownV, shownH, wts, hover, r } = this;
    ctx.strokeStyle = rgb(color);
    ctx.fillStyle = rgb(color);
    let maxW = 0;
    for (const row of wts) for (const w of row) maxW = Math.max(maxW, Math.abs(w));
    // Edges: brighter where both ends are on, and around the hovered unit.
    for (let i = 0; i < posV.length; i++) {
      for (let j = 0; j < posH.length; j++) {
        const w = wts[i][j];
        const touched = hover && ((hover.layer === 'v' && hover.i === i) || (hover.layer === 'h' && hover.i === j));
        const live = shownV[i] * shownH[j];
        ctx.globalAlpha = Math.min(0.9, (0.12 + 0.55 * (Math.abs(w) / maxW) * (0.3 + 0.7 * live)) * (touched ? 2 : 1));
        ctx.lineWidth = w > 0 ? 1.2 : 0.6;
        ctx.setLineDash(w > 0 ? [] : [3, 4]);
        ctx.beginPath();
        ctx.moveTo(posV[i][0], posV[i][1]);
        ctx.lineTo(posH[j][0], posH[j][1]);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    const node = (p: [number, number], on: number, ring: boolean, highlighted: boolean) => {
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
      ctx.stroke();
      if (on > 0.02) {
        ctx.globalAlpha = 0.85 * on;
        ctx.beginPath();
        ctx.arc(p[0], p[1], r - 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ring || highlighted) {
        ctx.globalAlpha = ring ? 0.9 : 0.4;
        ctx.beginPath();
        ctx.arc(p[0], p[1], r + 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    posH.forEach((p, j) => node(p, shownH[j], false, hover?.layer === 'h' && hover.i === j));
    posV.forEach((p, i) => node(p, shownV[i], this.clamped[i], hover?.layer === 'v' && hover.i === i));
    // Row labels.
    ctx.globalAlpha = 0.6;
    ctx.font = '500 11px "Bricolage Grotesque", system-ui, sans-serif';
    const label = (text: string, p: [number, number] | undefined) => {
      if (!p) return;
      // Beside the row when there's room, otherwise just above its first unit.
      if (p[0] - r - 12 > 52) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, p[0] - r - 12, p[1]);
      } else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, p[0] - r, p[1] - r - 8);
      }
    };
    label('hidden', posH[0]);
    label('visible', posV[0]);
    ctx.globalAlpha = 1;
  }
}

export const SIMS: Record<SimKey, { create: () => Sim; caption: string }> = {
  spins: {
    create: () => new SpinLattice(),
    caption: 'Ising spins near the critical temperature. Your cursor heats them.',
  },
  swarm: {
    create: () => new Swarm(),
    caption: 'A Vicsek swarm: each agent follows its neighbors. Your cursor scatters them.',
  },
  waveguide: {
    create: () => new Waveguide(),
    caption: 'Light held in an S-bend waveguide. Your cursor drops ripples into the field.',
  },
  boltzmann: {
    create: () => new Boltzmann(),
    caption: 'A restricted Boltzmann machine, Gibbs sampling. Click a visible unit to clamp it.',
  },
};
