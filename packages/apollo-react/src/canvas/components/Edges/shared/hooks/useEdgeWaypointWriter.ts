import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import type { Waypoint } from '../types';
import { waypointsEqual } from '../waypoints';

/**
 * Returns a stable callback that persists an edge's waypoints. In controlled
 * mode (an `onChange` is supplied) it calls that instead of touching React Flow
 * state — the consumer owns persistence. Otherwise it writes straight into the
 * edge's `data.waypoints`, skipping the update when nothing changed.
 *
 * Shared by the waypoint editor and the node-drag rebalancer so both commit the
 * same way.
 */
export function useEdgeWaypointWriter(
  edgeId: string,
  onChange?: (next: Waypoint[]) => void
): (next: Waypoint[]) => void {
  const { setEdges } = useReactFlow();
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  return useCallback(
    (next: Waypoint[]) => {
      const consumer = onChangeRef.current;
      if (consumer) {
        consumer(next);
        return;
      }
      setEdges((edges) => {
        let changed = false;
        const updated = edges.map((edge) => {
          if (edge.id !== edgeId) return edge;
          const current = (edge.data as { waypoints?: Waypoint[] } | undefined)?.waypoints ?? [];
          if (waypointsEqual(current, next)) return edge;
          changed = true;
          return { ...edge, data: { ...edge.data, waypoints: next } };
        });
        return changed ? updated : edges;
      });
    },
    [edgeId, setEdges]
  );
}
