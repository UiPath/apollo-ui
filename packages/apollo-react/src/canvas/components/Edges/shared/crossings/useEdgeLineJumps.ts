import { useCallback, useLayoutEffect, useSyncExternalStore } from 'react';
import type { PathJump, Point } from '../types';
import { EMPTY_JUMPS, useEdgeCrossingsStore } from './EdgeCrossingsContext';

/**
 * Publish this edge's polyline to the shared crossings store and read back the
 * points where it should hop over another edge.
 *
 * Registration runs in a layout effect so the store's recompute microtask
 * drains before paint: the first frame that shows a new crossing already shows
 * its notch. When `enabled` is false, or no `EdgeCrossingsProvider` is mounted,
 * this neither registers nor subscribes and returns a stable empty list — so an
 * edge that hasn't opted in costs nothing and is invisible to the ones that have.
 */
export function useEdgeLineJumps(
  edgeId: string,
  points: Point[],
  enabled: boolean
): readonly PathJump[] {
  const store = useEdgeCrossingsStore();

  useLayoutEffect(() => {
    if (!store || !enabled) return;
    store.register(edgeId, points);
    return () => store.unregister(edgeId);
  }, [store, enabled, edgeId, points]);

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      store && enabled ? store.subscribe(edgeId, onStoreChange) : () => {},
    [store, enabled, edgeId]
  );

  const getSnapshot = useCallback(
    () => (store && enabled ? store.getSnapshot(edgeId) : EMPTY_JUMPS),
    [store, enabled, edgeId]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
