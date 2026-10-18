import type { Pointer, Rgb, Sim } from './types';
import { rgb } from './helpers';

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
