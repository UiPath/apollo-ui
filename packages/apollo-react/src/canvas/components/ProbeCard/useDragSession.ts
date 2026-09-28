import { useCallback, useEffect, useRef } from 'react';
import { useLatestRef } from '../../hooks/useLatestRef';

interface DragSessionHandlers {
  onStart?: () => void;
  onMove?: (cumulativeDelta: { x: number; y: number }) => void;
  onEnd?: () => void;
}

/**
 * Mouse-drag session: captures clientX/Y on mousedown, calls `onMove` with
 * cumulative deltas, and cleans up window listeners on mouseup or unmount.
 */
export function useDragSession(handlers: DragSessionHandlers): (e: React.MouseEvent) => void {
  const handlersRef = useLatestRef(handlers);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  return useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      startRef.current = { x: e.clientX, y: e.clientY };
      handlersRef.current.onStart?.();

      const handleMove = (ev: MouseEvent) => {
        const start = startRef.current;
        if (!start) return;
        handlersRef.current.onMove?.({ x: ev.clientX - start.x, y: ev.clientY - start.y });
      };
      const handleUp = () => {
        startRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        cleanupRef.current = null;
        handlersRef.current.onEnd?.();
      };
      cleanupRef.current = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        startRef.current = null;
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [handlersRef, startRef, cleanupRef]
  );
}
