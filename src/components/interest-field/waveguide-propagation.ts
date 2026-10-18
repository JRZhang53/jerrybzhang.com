/**
 * Integrate the coupled-mode equations from sample `start` to the end (RK4,
 * in a frame rotating with the common phase), starting from (ar, ai).
 */
export function propagate(xs: number[], kap: number[][], start: number, ar: number[], ai: number[]) {
  const GUIDES = ar.length;
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
