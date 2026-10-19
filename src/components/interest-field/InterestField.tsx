import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { type Rgb, SIMS, type Sim, type SimKey } from './sims';
import { createFrameLoop } from './frame-loop';
import { createPointerInput } from './pointer-input';

interface InterestFieldProps {
  sim: SimKey;
  /** Changing this starts a fresh instance of the same sim (e.g. a new random graph). */
  variant?: number;
  paused?: boolean;
  /** Explicit visitor opt-in, even when their system prefers reduced motion. */
  allowMotion?: boolean;
  className?: string;
  /** Content shown over the simulation. */
  children?: ReactNode;
}

const FADE_MS = 380;

function accentColor(): Rgb {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return m ? [Number.parseInt(m[1], 16), Number.parseInt(m[2], 16), Number.parseInt(m[3], 16)] : [39, 66, 232];
}

// A full-bleed canvas running one simulation at a time behind its children.
// Switching `sim` (or `variant`) fades the old one out and the new one in.
export default function InterestField({ sim, variant = 0, paused = false, allowMotion = false, className, children }: InterestFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const wantedRef = useRef(`${sim}:${variant}`);
  const kickRef = useRef<() => void>(() => {});
  const pausedRef = useRef(paused);
  const allowMotionRef = useRef(allowMotion);

  useEffect(() => {
    wantedRef.current = `${sim}:${variant}`;
    pausedRef.current = paused;
    allowMotionRef.current = allowMotion;
    kickRef.current();
  }, [sim, variant, paused, allowMotion]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!(root && canvas && ctx)) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reducedMotion = () => motionPreference.matches && !allowMotionRef.current;
    const input = createPointerInput((x, y) => simRef.current?.press?.(x, y));
    let color = accentColor();
    let width = 0;
    let height = 0;
    let shownKey: string | null = null;
    let fadingOut = false;
    let fadeTimer = 0;

    const paint = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / Math.max(width, 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      simRef.current?.draw(ctx, color);
    };

    const mount = (id: string) => {
      input.cancel();
      shownKey = id;
      const next = SIMS[id.split(':')[0] as SimKey].create();
      next.resize(width, height);
      simRef.current = next;
      paint();
      canvas.style.opacity = '1';
    };

    // Swap to the wanted sim, fading through transparent.
    const sync = () => {
      const wanted = wantedRef.current;
      if (wanted === shownKey || fadingOut || !width) return;
      if (!shownKey || reducedMotion() || pausedRef.current) {
        mount(wanted);
        return;
      }
      fadingOut = true;
      canvas.style.opacity = '0';
      fadeTimer = window.setTimeout(() => {
        fadingOut = false;
        mount(wantedRef.current);
      }, FADE_MS);
    };

    const clock = createFrameLoop((dt) => {
      simRef.current?.step(dt, input.pointer);
      input.step(dt);
      paint();
    });

    const play = () => {
      if (pausedRef.current && fadingOut) {
        window.clearTimeout(fadeTimer);
        fadingOut = false;
        mount(wantedRef.current);
      }
      sync();
      clock.update({ documentVisible: !document.hidden, reducedMotion: reducedMotion(), paused: pausedRef.current });
      if (!clock.running()) input.cancel();
    };
    kickRef.current = play;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const sizeChanged = Math.abs(rect.width - width) > 1 || Math.abs(rect.height - height) > 1;
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      if (sizeChanged) simRef.current?.resize(width, height);
      sync();
      paint();
    };

    resize();
    play();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      clock.update({ inView: entry.isIntersecting });
      play();
    });
    intersection.observe(root);
    const onVisibility = () => {
      play();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const onMotionChange = () => {
      if (reducedMotion() && fadingOut) {
        window.clearTimeout(fadeTimer);
        fadingOut = false;
        mount(wantedRef.current);
      }
      play();
    };
    motionPreference.addEventListener('change', onMotionChange);
    // Theme switches change the accent color.
    const themeObserver = new MutationObserver(() => {
      color = accentColor();
      paint();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { id: event.pointerId, kind: event.pointerType, x: event.clientX - rect.left, y: event.clientY - rect.top, time: event.timeStamp };
    };
    const onMove = (event: PointerEvent) => {
      if (clock.running()) input.move(local(event));
    };
    // Touch pointers leave immediately after pointerup; keep that tap's impulse alive.
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') input.cancel();
    };
    const onCancel = () => input.cancel();
    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary || (event.target as Element).closest('a, button') || !clock.running()) return;
      input.down(local(event));
    };
    const onUp = (event: PointerEvent) => {
      if (clock.running()) input.up(local(event));
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);

    return () => {
      clock.dispose();
      window.clearTimeout(fadeTimer);
      kickRef.current = () => {};
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionPreference.removeEventListener('change', onMotionChange);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  return (
    <div className={cn('relative flex w-full items-center overflow-hidden', className)} ref={rootRef}>
      <div aria-hidden="true" className="interest-field pointer-events-none absolute inset-0">
        <canvas
          className="h-full w-full opacity-0 transition-opacity ease-out motion-reduce:transition-none"
          ref={canvasRef}
          style={{ transitionDuration: paused ? '0ms' : `${FADE_MS}ms` }}
        />
      </div>
      {children}
    </div>
  );
}
