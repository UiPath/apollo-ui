import type { Node, OnNodeDrag } from '@uipath/apollo-react/canvas/xyflow/react';
import { useViewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_NODE_SIZE } from '../../constants';
import type { AlignmentGuideLine, NodeBounds } from './AlignmentGuides.types';

export function toBounds(node: Node): NodeBounds {
  const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_SIZE;
  const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_SIZE;
  const x1 = node.position.x;
  const y1 = node.position.y;
  const x2 = x1 + width;
  const y2 = y1 + height;
  return { id: node.id, x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

export interface AlignmentSnapDelta {
  dx: number;
  dy: number;
}

export interface AlignmentResult {
  guides: AlignmentGuideLine[];
  delta: AlignmentSnapDelta;
}

type AxisAnchors = [start: number, center: number, end: number];

interface AxisCandidate {
  delta: number;
  kind: 'center' | 'edge';
  matchedNodeId: string;
  position: number;
  priority: number;
}

function getAxisAnchors(
  bounds: NodeBounds,
  orientation: 'vertical' | 'horizontal'
): AxisAnchors {
  return orientation === 'vertical'
    ? [bounds.x1, bounds.cx, bounds.x2]
    : [bounds.y1, bounds.cy, bounds.y2];
}

function resolveAxisCandidate(
  dragged: NodeBounds,
  others: NodeBounds[],
  threshold: number,
  orientation: 'vertical' | 'horizontal'
): AxisCandidate | undefined {
  const draggedAnchors = getAxisAnchors(dragged, orientation);
  const candidates: AxisCandidate[] = [];

  for (const other of others) {
    const otherAnchors = getAxisAnchors(other, orientation);

    candidates.push({
      delta: otherAnchors[1] - draggedAnchors[1],
      kind: 'center',
      matchedNodeId: other.id,
      position: otherAnchors[1],
      priority: 0,
    });

    for (const draggedIndex of [0, 2] as const) {
      for (const otherIndex of [0, 2] as const) {
        candidates.push({
          delta: otherAnchors[otherIndex] - draggedAnchors[draggedIndex],
          kind: 'edge',
          matchedNodeId: other.id,
          position: otherAnchors[otherIndex],
          priority: draggedIndex === otherIndex ? 1 : 2,
        });
      }
    }
  }

  return candidates
    .filter(({ delta }) => Math.abs(delta) <= threshold)
    .sort(
      (a, b) =>
        Math.abs(a.delta) - Math.abs(b.delta) ||
        a.priority - b.priority ||
        a.position - b.position ||
        a.matchedNodeId.localeCompare(b.matchedNodeId)
    )[0];
}

function buildGuide(
  candidate: AxisCandidate,
  dragged: NodeBounds,
  others: NodeBounds[],
  orientation: 'vertical' | 'horizontal'
): AlignmentGuideLine {
  const matchingOthers = others.filter((other) => {
    const anchors = getAxisAnchors(other, orientation);
    const candidateAnchors = candidate.kind === 'center' ? [anchors[1]] : [anchors[0], anchors[2]];
    return candidateAnchors.some((anchor) => Math.abs(anchor - candidate.position) < 0.5);
  });
  const ranges = [dragged, ...matchingOthers].map((bounds) =>
    orientation === 'vertical'
      ? ([bounds.y1, bounds.y2] as const)
      : ([bounds.x1, bounds.x2] as const)
  );

  return {
    id: `${orientation}-${candidate.position}`,
    orientation,
    position: candidate.position,
    start: Math.min(...ranges.map(([rangeStart]) => rangeStart)),
    end: Math.max(...ranges.map(([, rangeEnd]) => rangeEnd)),
    kind: candidate.kind,
    matchedNodeIds: matchingOthers.map(({ id }) => id),
  };
}

/**
 * Resolves the single winning alignment candidate on each axis. The returned
 * guide lines and snap delta come from the same candidates, so the visual cue
 * can never disagree with the position applied by a consumer.
 */
export function computeAlignmentResult(
  dragged: NodeBounds,
  others: NodeBounds[],
  threshold: number
): AlignmentResult {
  const vertical = resolveAxisCandidate(dragged, others, threshold, 'vertical');
  const horizontal = resolveAxisCandidate(dragged, others, threshold, 'horizontal');
  const delta = { dx: vertical?.delta ?? 0, dy: horizontal?.delta ?? 0 };
  const snapped = {
    ...dragged,
    x1: dragged.x1 + delta.dx,
    x2: dragged.x2 + delta.dx,
    cx: dragged.cx + delta.dx,
    y1: dragged.y1 + delta.dy,
    y2: dragged.y2 + delta.dy,
    cy: dragged.cy + delta.dy,
  };
  const guides = [
    ...(vertical ? [buildGuide(vertical, snapped, others, 'vertical')] : []),
    ...(horizontal ? [buildGuide(horizontal, snapped, others, 'horizontal')] : []),
  ];

  return { guides, delta };
}

export function computeAlignmentGuides(
  dragged: NodeBounds,
  others: NodeBounds[],
  threshold: number
): AlignmentGuideLine[] {
  return computeAlignmentResult(dragged, others, threshold).guides;
}

export function computeAlignmentSnapDelta(
  dragged: NodeBounds,
  others: NodeBounds[],
  threshold: number
): AlignmentSnapDelta {
  return computeAlignmentResult(dragged, others, threshold).delta;
}

export function toGroupBounds(nodes: Node[]): NodeBounds {
  const bounds = nodes.map(toBounds);
  const x1 = Math.min(...bounds.map((item) => item.x1));
  const y1 = Math.min(...bounds.map((item) => item.y1));
  const x2 = Math.max(...bounds.map((item) => item.x2));
  const y2 = Math.max(...bounds.map((item) => item.y2));
  return {
    id: bounds.map(({ id }) => id).join(','),
    x1,
    y1,
    x2,
    y2,
    cx: (x1 + x2) / 2,
    cy: (y1 + y2) / 2,
  };
}

export interface UseAlignmentGuidesOptions {
  /**
   * Match distance in screen pixels, independent of zoom level. Converted to
   * flow-space internally (thresholdPx / zoom) so guides are equally easy to
   * hit whether the canvas is zoomed in or out.
   * @default 8
   */
  thresholdPx?: number;
  /**
   * Optional controlled-state callback for magnetic snapping. Every update is
   * an absolute position derived from React Flow's current drag event. When a
   * selection is dragged, all selected nodes receive the same delta.
   */
  onSnap?: (updates: AlignmentPositionUpdate[]) => void;
}

export interface AlignmentPositionUpdate {
  id: string;
  position: { x: number; y: number };
}

export function createAlignmentPositionUpdates(
  nodes: Node[],
  delta: AlignmentSnapDelta
): AlignmentPositionUpdate[] {
  return nodes.map(({ id, position }) => ({
    id,
    position: { x: position.x + delta.dx, y: position.y + delta.dy },
  }));
}

export interface UseAlignmentGuidesReturn {
  guides: AlignmentGuideLine[];
  draggedBounds: NodeBounds | null;
  onNodeDrag: OnNodeDrag;
  onNodeDragStop: OnNodeDrag;
}

/**
 * Computes Figma-style alignment guides and optional magnetic snap positions
 * while one node or a multi-selection is dragged. Guide lines and snap updates
 * always come from the same winning alignment candidate.
 *
 * Wire the returned handlers directly into BaseCanvas/ReactFlow's
 * onNodeDrag/onNodeDragStop, and render `guides` via AlignmentGuidesOverlay.
 */
export function useAlignmentGuides(
  nodes: Node[],
  options: UseAlignmentGuidesOptions = {}
): UseAlignmentGuidesReturn {
  const { thresholdPx = 8, onSnap } = options;
  const { zoom } = useViewport();
  const [guides, setGuides] = useState<AlignmentGuideLine[]>([]);
  const [draggedBounds, setDraggedBounds] = useState<NodeBounds | null>(null);

  const resolveDrag = useCallback(
    (draggedNode: Node, draggedNodes: Node[], showGuides: boolean) => {
      const activeNodes = draggedNodes.length > 0 ? draggedNodes : [draggedNode];
      const activeIds = new Set(activeNodes.map(({ id }) => id));
      const others = nodes.filter(({ id }) => !activeIds.has(id)).map(toBounds);
      const activeBounds = toGroupBounds(activeNodes);
      const result = computeAlignmentResult(activeBounds, others, thresholdPx / zoom);
      setDraggedBounds(
        showGuides
          ? {
              ...activeBounds,
              x1: activeBounds.x1 + result.delta.dx,
              x2: activeBounds.x2 + result.delta.dx,
              cx: activeBounds.cx + result.delta.dx,
              y1: activeBounds.y1 + result.delta.dy,
              y2: activeBounds.y2 + result.delta.dy,
              cy: activeBounds.cy + result.delta.dy,
            }
          : null
      );
      setGuides(showGuides ? result.guides : []);

      if (!onSnap || (result.delta.dx === 0 && result.delta.dy === 0)) return;
      onSnap(createAlignmentPositionUpdates(activeNodes, result.delta));
    },
    [nodes, onSnap, thresholdPx, zoom]
  );

  const onNodeDrag = useCallback<OnNodeDrag>(
    (_event, draggedNode, draggedNodes) => resolveDrag(draggedNode, draggedNodes, true),
    [resolveDrag]
  );

  const onNodeDragStop = useCallback<OnNodeDrag>(
    (_event, draggedNode, draggedNodes) => resolveDrag(draggedNode, draggedNodes, false),
    [resolveDrag]
  );

  return useMemo(
    () => ({ guides, draggedBounds, onNodeDrag, onNodeDragStop }),
    [guides, draggedBounds, onNodeDrag, onNodeDragStop]
  );
}
