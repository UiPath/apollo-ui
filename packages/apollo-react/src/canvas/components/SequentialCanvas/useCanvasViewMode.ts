import { useStorageState } from '../../hooks/useStorageState';
import type { CanvasView } from '../../utils/sequential/sequential.types';

/** Keyed by `CanvasView` so adding a view to the union fails to compile until listed here. */
const CANVAS_VIEWS: Record<CanvasView, true> = { flow: true, sequential: true };

/** localStorage is untrusted input: a collision, hand edit, or retired view name must not leak through. */
export const isCanvasView = (value: unknown): value is CanvasView =>
  typeof value === 'string' && value in CANVAS_VIEWS;

/**
 * Persists the flow/sequential view choice in localStorage. `storageKey` must be unique per
 * canvas: `useStorageState` reads once on mount and never listens for `storage` events, so
 * two hooks sharing a key do not synchronize. An unknown stored value falls back to `initial`.
 */
export function useCanvasViewMode(
  storageKey: string,
  initial: CanvasView = 'flow'
): [CanvasView, (view: CanvasView) => void] {
  const [storedView, setStoredView] = useStorageState<CanvasView>(storageKey, initial);
  return [isCanvasView(storedView) ? storedView : initial, setStoredView];
}
