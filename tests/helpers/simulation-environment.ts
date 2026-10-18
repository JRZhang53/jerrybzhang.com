/** Minimal pixel surface for testing numerical work without launching a browser. */
export function simulationEnvironment() {
  let image: ImageData;
  class PixelData {
    data: Uint8ClampedArray;
    colorSpace = 'srgb' as const;
    constructor(public width: number, public height: number) {
      this.data = new Uint8ClampedArray(width * height * 4);
      image = this as ImageData;
    }
  }
  Object.defineProperty(globalThis, 'ImageData', { configurable: true, value: PixelData });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => ({ width: 0, height: 0, getContext: () => ({ putImageData() {} }) }) },
  });
  return { image: () => image };
}

export function seeded<T>(action: () => T, seed = 123456) {
  const original = Math.random;
  let state = seed;
  Math.random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  try { return action(); } finally { Math.random = original; }
}
