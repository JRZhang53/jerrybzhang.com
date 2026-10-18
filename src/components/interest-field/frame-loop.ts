interface Conditions {
  inView: boolean;
  documentVisible: boolean;
  reducedMotion: boolean;
  paused: boolean;
}

interface Scheduler {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
  now(): number;
}

/** One clock for the canvas. Independent stop conditions cannot resume each other. */
export function createFrameLoop(
  step: (seconds: number) => void,
  scheduler: Scheduler = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
    now: () => performance.now(),
  },
) {
  const conditions: Conditions = { inView: false, documentVisible: true, reducedMotion: false, paused: false };
  let frame: number | null = null;
  let last = 0;
  let disposed = false;
  const running = () => !disposed && conditions.inView && conditions.documentVisible && !conditions.reducedMotion && !conditions.paused;
  const tick = (now: number) => {
    frame = null;
    if (!running()) return;
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
    last = now;
    step(dt);
    if (running()) frame = scheduler.request(tick);
  };
  return {
    running,
    update(next: Partial<Conditions>) {
      Object.assign(conditions, next);
      if (!running()) {
        if (frame !== null) scheduler.cancel(frame);
        frame = null;
      } else if (frame === null) {
        last = scheduler.now();
        frame = scheduler.request(tick);
      }
    },
    dispose() {
      disposed = true;
      if (frame !== null) scheduler.cancel(frame);
      frame = null;
    },
  };
}
