import type { Pointer } from './types';

export interface FieldPointer {
  id: number;
  kind: string;
  x: number;
  y: number;
  time: number;
}

/** Touch is a short impulse after a tap, never a drag or the start of a scroll. */
export function createPointerInput(press: (x: number, y: number) => void) {
  const pointer: Pointer = { x: 0, y: 0, active: false };
  let contact: FieldPointer | null = null;
  let remaining = 0;
  const place = (event: FieldPointer) => {
    pointer.x = event.x;
    pointer.y = event.y;
  };
  const cancel = () => {
    contact = null;
    remaining = 0;
    pointer.active = false;
  };
  return {
    pointer,
    cancel,
    down(event: FieldPointer) {
      cancel();
      if (event.kind === 'mouse') {
        place(event);
        pointer.active = true;
        press(pointer.x, pointer.y);
      } else {
        contact = event;
      }
    },
    move(event: FieldPointer) {
      if (event.kind === 'mouse') {
        place(event);
        remaining = 0;
        pointer.active = true;
      } else if (contact?.id === event.id && Math.hypot(event.x - contact.x, event.y - contact.y) > 12) {
        cancel();
      }
    },
    up(event: FieldPointer) {
      if (contact?.id !== event.id) return;
      const tapped = event.time - contact.time <= 500
        && Math.hypot(event.x - contact.x, event.y - contact.y) <= 12;
      contact = null;
      if (!tapped) return;
      place(event);
      pointer.active = true;
      remaining = 0.85;
      press(pointer.x, pointer.y);
    },
    step(dt: number) {
      if (remaining <= 0) return;
      remaining = Math.max(0, remaining - dt);
      if (remaining === 0) pointer.active = false;
    },
  };
}
