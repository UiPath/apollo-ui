/** A client point. */
export interface PointerPoint {
  x: number;
  y: number;
}

export interface PointerDragOptions {
  /** The scroll container whose scroll moves the content under a still pointer. */
  container: HTMLElement | null;
  /** The pointer that started the drag; undefined follows the first to move. */
  pointerId: number | undefined;
  pointer: PointerPoint;
  /** Scrolls one autoscroll step toward the pointer, and returns whether anything scrolled. */
  edgeScroll: (pointer: PointerPoint) => boolean;
  /** The pointer moved, or the content scrolled under it. */
  onPointer: (pointer: PointerPoint) => void;
  /** The owning pointer was released. */
  onDrop: (pointer: PointerPoint) => void;
  /** The drag ended: dropped, cancelled, or torn down. */
  onEnd: () => void;
}

/** Follows one pointer drag on the document with an rAF edge autoscroll, until release, Escape, cancel or the window hiding; returns its teardown. */
export const followPointerDrag = ({
  container,
  pointerId,
  pointer: start,
  edgeScroll,
  onPointer,
  onDrop,
  onEnd,
}: PointerDragOptions): (() => void) => {
  let pointer = start;
  let frame: number | null = null;
  let owner = pointerId;
  const isOwner = (event: PointerEvent) => {
    if (event.pointerId === undefined) {
      return true;
    }
    owner ??= event.pointerId;
    return event.pointerId === owner;
  };
  const autoscroll = () => {
    frame = null;
    // Compared before and after the write: held against a fully-scrolled edge, the band alone rescheduled forever.
    if (edgeScroll(pointer)) {
      onPointer(pointer);
      frame = requestAnimationFrame(autoscroll);
    }
  };
  const onPointerMove = (move: PointerEvent) => {
    if (!isOwner(move)) {
      return;
    }
    // A pointerup missed outside the window would leave the drag armed for the next unrelated click.
    if ((move.buttons & 1) === 0) {
      end();
      return;
    }
    pointer = { x: move.clientX, y: move.clientY };
    onPointer(pointer);
    if (frame === null) {
      frame = requestAnimationFrame(autoscroll);
    }
  };
  const onScroll = () => onPointer(pointer);
  const onPointerCancel = (cancel: PointerEvent) => {
    if (isOwner(cancel)) {
      end();
    }
  };
  const onVisibilityChange = () => {
    if (document.hidden) {
      end();
    }
  };
  const onPointerUp = (up: PointerEvent) => {
    if (!isOwner(up)) {
      return;
    }
    try {
      onDrop(pointer);
    } finally {
      end();
    }
  };
  const onKeyDown = (key: KeyboardEvent) => {
    key.stopPropagation();
    key.preventDefault();
    if (key.key === 'Escape') {
      end();
    }
  };
  const end = () => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', end);
    container?.removeEventListener('scroll', onScroll);
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    onEnd();
  };
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', end);
  container?.addEventListener('scroll', onScroll, { passive: true });
  frame = requestAnimationFrame(autoscroll);
  return end;
};
