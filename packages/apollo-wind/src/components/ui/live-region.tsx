'use client';

import * as React from 'react';
import { cn } from '@/lib';

/**
 * A visually hidden live region for screen reader announcements, such as "Response ready" or
 * "3 files attached". Render it once, before anything needs announcing: screen readers only
 * speak changes to a region that already exists.
 *
 * Two ways to announce: set the `message` prop (announced when it changes), or call
 * `announce()` on the ref, which is a `LiveRegionHandle` rather than the DOM node. The handle
 * also repeats an identical message, which a prop that does not change cannot.
 *
 * `polite` maps to `role="status"` and waits for the reader to finish; `assertive` maps to
 * `role="alert"` and interrupts, so keep it for errors.
 */

export interface LiveRegionHandle {
  /** Announces `message`, after `debounce` ms when set. */
  announce: (message: string) => void;
  /** Empties the region and drops any pending announcement. */
  clear: () => void;
}

export interface LiveRegionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role' | 'aria-live'> {
  /** Text to announce. A new value is announced; re-rendering with the same value is not. */
  message?: string;
  /** `assertive` interrupts the reader; use it for errors only. */
  'aria-live'?: 'polite' | 'assertive';
  /** Milliseconds before the text is removed, so stale text is not found when browsing. `0` keeps it. */
  clearAfter?: number;
  /** Milliseconds to wait for quiet before announcing; only the last of a burst is spoken. */
  debounce?: number;
}

const LiveRegion = React.forwardRef<LiveRegionHandle, LiveRegionProps>(
  (
    {
      className,
      message,
      'aria-live': politeness = 'polite',
      'aria-atomic': atomic = true,
      clearAfter = 1000,
      debounce = 0,
      ...props
    },
    ref
  ) => {
    // `id` changes on every announcement so the text node is replaced, which makes screen
    // readers speak an identical message again.
    const [current, setCurrent] = React.useState<{ id: number; text: string }>({
      id: 0,
      text: '',
    });
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const clearTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const clear = React.useCallback(() => {
      clearTimeout(debounceTimer.current);
      clearTimeout(clearTimer.current);
      setCurrent((prev) => ({ id: prev.id + 1, text: '' }));
    }, []);

    const announce = React.useCallback(
      (next: string) => {
        clearTimeout(debounceTimer.current);
        const commit = () => {
          clearTimeout(clearTimer.current);
          setCurrent((prev) => ({ id: prev.id + 1, text: next }));
          if (clearAfter > 0) {
            clearTimer.current = setTimeout(
              () => setCurrent((prev) => ({ id: prev.id + 1, text: '' })),
              clearAfter
            );
          }
        };
        if (debounce > 0) {
          debounceTimer.current = setTimeout(commit, debounce);
        } else {
          commit();
        }
      },
      [clearAfter, debounce]
    );

    React.useImperativeHandle(ref, () => ({ announce, clear }), [announce, clear]);

    // Read the latest `announce` without re-announcing when only `clearAfter` or `debounce` change.
    const announceRef = React.useRef(announce);
    announceRef.current = announce;
    React.useEffect(() => {
      if (message) announceRef.current(message);
    }, [message]);

    React.useEffect(
      () => () => {
        clearTimeout(debounceTimer.current);
        clearTimeout(clearTimer.current);
      },
      []
    );

    return (
      <div
        data-slot="live-region"
        role={politeness === 'assertive' ? 'alert' : 'status'}
        aria-live={politeness}
        aria-atomic={atomic}
        className={cn('sr-only', className)}
        {...props}
      >
        {current.text ? <span key={current.id}>{current.text}</span> : null}
      </div>
    );
  }
);
LiveRegion.displayName = 'LiveRegion';

export { LiveRegion };
