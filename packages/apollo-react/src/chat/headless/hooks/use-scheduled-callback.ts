import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for scheduling callbacks with requestAnimationFrame.
 * Automatically cancels pending calls and cleans up on unmount.
 *
 * @example
 * const scheduleUpdate = useScheduledCallback(() => {
 *   popoverRef.current?.updatePosition();
 * });
 *
 * // Call whenever you need to schedule an update
 * scheduleUpdate();
 */
export function useScheduledCallback(callback: () => void) {
  const rafIdRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Return memoized scheduler function
  return useCallback(() => {
    // Cancel any pending update
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule new update
    rafIdRef.current = requestAnimationFrame(() => {
      callbackRef.current();
      rafIdRef.current = null;
    });
  }, []);
}
