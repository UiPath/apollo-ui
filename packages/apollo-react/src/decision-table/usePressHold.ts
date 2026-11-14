import { useEffect, useRef, useState } from 'react';

const PRESS_ENDS = ['pointerup', 'mouseup', 'pointercancel', 'keydown', 'click'] as const;

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock']);

/** Whether an event ends a press at once: a pointercancel, a key that is no modifier and no repeat, or a click outside `node`, which a click inside it ends itself. */
const endsAtOnce = (node: Node, event: Event): boolean => {
  if (event instanceof KeyboardEvent) return !event.repeat && !MODIFIER_KEYS.has(event.key);
  if (event.type !== 'click') return true;
  const [origin] = event.composedPath();
  return !(origin instanceof Node && node.contains(origin));
};

/** Calls `onEnd` once a press ends: a task after its release, or at once from an event `endsAtOnce` names; returns what stops waiting. */
const onPressEnd = (node: Node, onEnd: () => void): (() => void) => {
  const target = node.ownerDocument ?? document;
  let release: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearTimeout(release);
    for (const type of PRESS_ENDS) target.removeEventListener(type, listener, true);
  };
  const listener = (event: Event) => {
    if (event.type === 'pointerup' || event.type === 'mouseup') {
      clearTimeout(release);
      release = setTimeout(onEnd);
    } else if (endsAtOnce(node, event)) {
      onEnd();
    }
  };
  for (const type of PRESS_ENDS) target.addEventListener(type, listener, true);
  return stop;
};

export interface PressHold {
  /** Whether a press on the view is under way. */
  pressing: boolean;
  /** Starts a press on `view`, unless one is under way. */
  start: (view: Node) => void;
  /** Runs `send` now, or after what the press under way already holds, once it ends. */
  hold: (send: () => void) => void;
  /** Ends the press under way, running what it held. */
  end: () => void;
}

/** A primary press on the view, which holds what is sent through it until the press ends. */
export const usePressHold = (): PressHold => {
  const [pressing, setPressing] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const heldRef = useRef<(() => void) | null>(null);
  const end = () => {
    stopRef.current?.();
    stopRef.current = null;
    setPressing(false);
    const held = heldRef.current;
    heldRef.current = null;
    held?.();
  };
  useEffect(
    () => () => {
      stopRef.current?.();
      heldRef.current?.();
    },
    []
  );
  const start = (view: Node) => {
    if (stopRef.current) return;
    stopRef.current = onPressEnd(view, end);
    setPressing(true);
  };
  const hold = (send: () => void) => {
    const held = heldRef.current;
    if (!stopRef.current) send();
    else
      heldRef.current = () => {
        held?.();
        send();
      };
  };
  return { pressing, start, hold, end };
};
