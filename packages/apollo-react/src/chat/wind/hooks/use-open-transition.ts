import React from 'react';

import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export type OpenTransitionState = 'open' | 'closed';

/**
 * Keeps the chat mounted through its exit animation and flips `state` a frame after mounting so
 * the enter animation has a start state. With reduced motion both happen at once.
 */
export function useOpenTransition(open: boolean, durationMs: number) {
  const reducedMotion = usePrefersReducedMotion();
  const [present, setPresent] = React.useState(open);
  const [state, setState] = React.useState<OpenTransitionState>(open ? 'open' : 'closed');

  React.useEffect(() => {
    if (open) {
      setPresent(true);

      if (reducedMotion) {
        setState('open');
        return;
      }

      const frame = requestAnimationFrame(() => setState('open'));

      return () => cancelAnimationFrame(frame);
    }

    setState('closed');

    if (reducedMotion) {
      setPresent(false);
      return;
    }

    const timeout = setTimeout(() => setPresent(false), durationMs);

    return () => clearTimeout(timeout);
  }, [open, reducedMotion, durationMs]);

  return { present, state };
}
