import { useCallback, useEffect, useRef, useState } from 'react';

const EVENT_START_POLL_INTERVAL = 150;

/**
 * Captures scroll (wheel) events on an overflowing element without hijacking
 * an in-progress canvas zoom gesture.
 *
 * Returns a ref to attach to the scrollable element and props to spread onto it.
 * Adds the `nowheel` class only when the pointer entered while no wheel gesture
 * was active and the element has overflow.
 */
export function useScrollCapture<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [captureScroll, setCaptureScroll] = useState(false);
  const wheelActiveRef = useRef(false);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Track global wheel activity so we can distinguish "pointer entered while idle"
  // from "pointer drifted over during a canvas zoom gesture".
  useEffect(() => {
    const onWheel = () => {
      wheelActiveRef.current = true;
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        wheelActiveRef.current = false;
      }, EVENT_START_POLL_INTERVAL);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const onMouseEnter = useCallback(() => {
    if (wheelActiveRef.current) return;
    const el = ref.current;
    if (el && el.scrollHeight > el.clientHeight) {
      setCaptureScroll(true);
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    setCaptureScroll(false);
  }, []);

  return {
    ref,
    scrollCaptureProps: {
      className: captureScroll ? 'nowheel' : undefined,
      onMouseEnter,
      onMouseLeave,
    },
  };
}
