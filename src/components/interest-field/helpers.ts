import type { Rgb } from './types';

export const rgb = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
