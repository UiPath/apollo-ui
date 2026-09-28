import { useCallback, useLayoutEffect, useSyncExternalStore } from 'react';
import type { PathJump, Point } from '../types';
import { EMPTY_JUMPS, useEdgeCrossingsStore } from './EdgeCrossingsContext';

/**
 * Publish this edge's polyline to the shared crossings store and read back the
 * points where it should hop over another edge.
 *
 * Registration runs in a layout effect so the store's recompute microtask
 * drains before the browser paints, keeping the arcs in step with the stroke as
 * a node is dragged. The opening frame is the exception: the subscription below
 * is installed in a passive effect, so the first recompute has nobody to notify
 * and the notch lands on the commit after it.
 *
 * When `enabled` is false, or no `EdgeCrossingsProvider` is mounted, this
 * neither registers nor subscribes and returns a stable empty list — an edge
 * that hasn't opted in stays invisible to the ones that have, and pays nothing
 * beyond the hooks themselves.
 */
export function useEdgeLineJumps(
  edgeId: string,
  points: Point[],
  enabled: boolean
): readonly PathJump[] {
  const store = useEdgeCrossingsStore();

  // Publishing and withdrawing are deliberately separate effects. Publishing is
  // keyed on the points so a moved edge republishes; withdrawing is keyed only
  // on identity, so it runs when this edge stops taking part rather than on
  // every geometry change. Combining them would delete the stored polyline
  // before each re-registration, erasing the baseline `register` compares
  // against and defeating its no-op guard.
  useLayoutEffect(() => {
    if (store && enabled) store.register(edgeId, points);
  }, [store, enabled, edgeId, points]);

  useLayoutEffect(() => {
    if (!store || !enabled) return;
    return () => store.unregister(edgeId);
  }, [store, enabled, edgeId]);

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
