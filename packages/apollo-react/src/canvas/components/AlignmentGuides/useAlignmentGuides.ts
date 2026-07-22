import type { Node, OnNodeDrag } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_NODE_SIZE } from '../../constants';
import type { AlignmentGuideLine, NodeBounds } from './AlignmentGuides.types';

function toBounds(node: Node): NodeBounds {
  const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_SIZE;
  const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_SIZE;
  const x1 = node.position.x;
  const y1 = node.position.y;
  const x2 = x1 + width;
  const y2 = y1 + height;
  return { id: node.id, x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

/**
 * Matches the dragged node's edges/center against every other node's edges/center
 * on one axis, returning a guide line per match that clears `threshold`.
 * Lines that land on (nearly) the same position are merged into one, spanning
 * from the nearest to the farthest matched node so the line reaches every node
 * it's aligned with, not just the closest one.
 */
function collectAxisGuides(
  dragged: NodeBounds,
  others: NodeBounds[],
  threshold: number,
  orientation: 'vertical' | 'horizontal'
): AlignmentGuideLine[] {
  const draggedValues =
    orientation === 'vertical'
      ? [dragged.x1, dragged.cx, dragged.x2]
      : [dragged.y1, dragged.cy, dragged.y2];
  const otherRange = (o: NodeBounds) =>
    orientation === 'vertical' ? ([o.y1, o.y2] as const) : ([o.x1, o.x2] as const);
  const otherValues = (o: NodeBounds) =>
    orientation === 'vertical' ? [o.x1, o.cx, o.x2] : [o.y1, o.cy, o.y2];
  const draggedRange =
    orientation === 'vertical' ? ([dragged.y1, dragged.y2] as const) : ([dragged.x1, dragged.x2] as const);

  const matchesByPosition = new Map<number, { start: number; end: number }>();

  for (const other of others) {
    for (const draggedValue of draggedValues) {
      for (const otherValue of otherValues(other)) {
        if (Math.abs(draggedValue - otherValue) > threshold) continue;
        const key = Math.round(otherValue);
        const [oStart, oEnd] = otherRange(other);
        const start = Math.min(draggedRange[0], oStart);
        const end = Math.max(draggedRange[1], oEnd);
        const existing = matchesByPosition.get(key);
        matchesByPosition.set(key, {
          start: existing ? Math.min(existing.start, start) : start,
          end: existing ? Math.max(existing.end, end) : end,
        });
      }
    }
  }

  return Array.from(matchesByPosition.entries()).map(([position, { start, end }]) => ({
    id: `${orientation}-${position}`,
    orientation,
    position,
    start,
    end,
  }));
}

export function computeAlignmentGuides(
  dragged: NodeBounds,
  others: NodeBounds[],
  threshold: number
): AlignmentGuideLine[] {
  return [
    ...collectAxisGuides(dragged, others, threshold, 'vertical'),
    ...collectAxisGuides(dragged, others, threshold, 'horizontal'),
  ];
}

export interface UseAlignmentGuidesOptions {
  /** Match distance in flow-space units. @default 6 */
  threshold?: number;
}

export interface UseAlignmentGuidesReturn {
  guides: AlignmentGuideLine[];
  onNodeDrag: OnNodeDrag;
  onNodeDragStop: OnNodeDrag;
}

/**
 * Computes Figma-style alignment guide lines while a node is being dragged,
 * by comparing its edges and center against every other node's edges and
 * center. Visual only — never adjusts node position.
 *
 * Wire the returned handlers directly into BaseCanvas/ReactFlow's
 * onNodeDrag/onNodeDragStop, and render `guides` via AlignmentGuidesOverlay.
 */
export function useAlignmentGuides(
  nodes: Node[],
  options: UseAlignmentGuidesOptions = {}
): UseAlignmentGuidesReturn {
  const { threshold = 6 } = options;
  const [guides, setGuides] = useState<AlignmentGuideLine[]>([]);

  const onNodeDrag = useCallback<OnNodeDrag>(
    (_event, draggedNode) => {
      const others = nodes.filter((n) => n.id !== draggedNode.id);
      setGuides(
        computeAlignmentGuides(toBounds(draggedNode), others.map(toBounds), threshold)
      );
    },
    [nodes, threshold]
  );

  const onNodeDragStop = useCallback<OnNodeDrag>(() => {
    setGuides([]);
  }, []);

  return useMemo(() => ({ guides, onNodeDrag, onNodeDragStop }), [guides, onNodeDrag, onNodeDragStop]);
}
