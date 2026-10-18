import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { type Pointer, type Rgb, SIMS, type Sim, type SimKey } from './sims';

interface InterestFieldProps {
  sim: SimKey;
  /** Freeze the simulation where it is. */
  paused?: boolean;
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
// Switching `sim` fades the old one out and the new one in.
export default function InterestField({ sim, paused = false, className, children }: InterestFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const wantedRef = useRef<SimKey>(sim);
  const pausedRef = useRef(paused);
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    kickRef.current();
  }, [paused]);

  useEffect(() => {
    wantedRef.current = sim;
    kickRef.current();
  }, [sim]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!(root && canvas && ctx)) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer: Pointer = { x: 0, y: 0, active: false };
    let color = accentColor();
    let width = 0;
    let height = 0;
    let shownKey: SimKey | null = null;
    let fadingOut = false;
    let raf = 0;
    let last = 0;
    let visible = true;
    let fadeTimer = 0;

    const paint = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / Math.max(width, 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      simRef.current?.draw(ctx, color);
    };

    const mount = (key: SimKey) => {
      shownKey = key;
      const next = SIMS[key].create();
      next.resize(width, height);
      simRef.current = next;
      paint();
      canvas.style.opacity = '1';
    };

    // Swap to the wanted sim, fading through transparent.
    const sync = () => {
      const wanted = wantedRef.current;
      if (wanted === shownKey || fadingOut || !width) return;
      if (!shownKey || reduceMotion) {
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

    const running = () => visible && !pausedRef.current && !reduceMotion;

    const loop = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!running()) return;
      simRef.current?.step(dt, pointer);
      paint();
      raf = requestAnimationFrame(loop);
    };

    const play = () => {
      sync();
      if (!raf && running()) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    kickRef.current = play;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const sizeChanged = Math.abs(rect.width - width) > 1 || Math.abs(rect.height - height) > 1;
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (sizeChanged) simRef.current?.resize(width, height);
      sync();
      paint();
    };

    resize();
    play();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      play();
    });
    intersection.observe(root);
    const onVisibility = () => {
      visible = !document.hidden;
      play();
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Theme switches change the accent color.
    const themeObserver = new MutationObserver(() => {
      color = accentColor();
      paint();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onMove = (event: PointerEvent) => {
      local(event);
      pointer.active = event.pointerType === 'mouse' || event.buttons > 0;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest('a, button')) return;
      local(event);
      pointer.active = true;
      simRef.current?.press?.(pointer.x, pointer.y);
      if (!running()) paint();
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') pointer.active = false;
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimer);
      kickRef.current = () => {};
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onLeave);
    };
  }, []);

  return (
    <div className={cn('relative flex w-full items-center overflow-hidden', className)} ref={rootRef}>
      <div aria-hidden="true" className="interest-field pointer-events-none absolute inset-0">
        <canvas
          className="h-full w-full opacity-0 transition-opacity ease-out"
          ref={canvasRef}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        />
      </div>
      {children}
    </div>
  );
}
