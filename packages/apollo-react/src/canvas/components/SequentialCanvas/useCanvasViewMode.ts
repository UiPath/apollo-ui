import { useCallback } from 'react';
import { useStorageState } from '../../hooks/useStorageState';
import type { CanvasView } from '../../utils/sequential/sequential.types';

/**
 * Persists the flow/sequential view choice per canvas (D11), wrapping the
 * existing {@link useStorageState} localStorage helper. The host passes a stable
 * `storageKey` (typically per-canvas); the choice survives reloads. Open product
 * question Q4 notes a host-owned preference service can replace this later
 * without touching the view components.
 */
export function useCanvasViewMode(
  storageKey: string,
  initial: CanvasView = 'flow'
): [CanvasView, (view: CanvasView) => void] {
  const [view, setStoredView] = useStorageState<CanvasView>(storageKey, initial);

  const setView = useCallback(
    (next: CanvasView) => {
      setStoredView(next);
    },
    [setStoredView]
  );

  return [view, setView];
}
