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
