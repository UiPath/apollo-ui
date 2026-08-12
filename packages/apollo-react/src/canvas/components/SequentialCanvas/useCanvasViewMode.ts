import { useCallback } from 'react';
import { useStorageState } from '../../hooks/useStorageState';
import type { CanvasView } from '../../utils/sequential/sequential.types';

/**
 * Keyed by `CanvasView` so adding a view to the union fails to compile until it
 * is listed here, rather than silently falling back to `initial` at runtime.
 */
const CANVAS_VIEWS: Record<CanvasView, true> = { flow: true, sequential: true };

/**
 * localStorage is shared, mutable, and outlives any one version of this package,
 * so what comes back is untrusted input rather than a `CanvasView`: a key
 * collision, a hand-edited value, or a view name retired in a later release all
 * produce a string that is not one of the views we render. Validating on read
 * makes the fallback documented behaviour instead of a coincidence of what the
 * current call sites happen to check.
 */
export const isCanvasView = (value: unknown): value is CanvasView =>
  typeof value === 'string' && value in CANVAS_VIEWS;

/**
 * Persists the flow/sequential view choice per canvas (D11), wrapping the
 * existing {@link useStorageState} localStorage helper. The host passes a stable
 * `storageKey` (typically per-canvas); the choice survives reloads. Open product
 * question Q4 notes a host-owned preference service can replace this later
 * without touching the view components.
 *
 * A stored value that is not a known view falls back to `initial`.
 */
export function useCanvasViewMode(
  storageKey: string,
  initial: CanvasView = 'flow'
): [CanvasView, (view: CanvasView) => void] {
  const [storedView, setStoredView] = useStorageState<CanvasView>(storageKey, initial);

  const setView = useCallback(
    (next: CanvasView) => {
      setStoredView(next);
    },
    [setStoredView]
  );

  return [isCanvasView(storedView) ? storedView : initial, setView];
}
