/**
 * Storybook-only stand-in for Flow Workbench's layout behavior, so the
 * Tidy up & Alignment demo moves nodes exactly the way the product does
 * without Apollo shipping (or depending on) a layout engine.
 *
 * - Tidy up nodes / Tidy selected replay ELK output recorded from Flow
 *   Workbench's own `flow-core/layout` engine (see `record-layout.mts`), then
 *   apply the same anchoring Flow Workbench's LayoutService applies.
 * - Align / distribute are copied from `flow-core/layout/alignment.ts` and
 *   `distribution.ts` (no dependencies).
 *
 * The recording covers the demo workflow only: every selection of 2+ of its
 * nodes, keyed by id in model order. Regenerate it when Flow Workbench changes
 * its layout settings; `FLOW_WORKBENCH_LAYOUT_SOURCE` records the commit.
 */
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../../constants';
import recorded from './recorded-layout.json';

/** Positions as [x, y] by node id, routed bends as [x, y][] by edge id. */
type RecordedLayout = {
  p: Record<string, number[]>;
  w: Record<string, number[][]>;
};

const FULL: RecordedLayout = recorded.full;
const SUBSETS: Record<string, RecordedLayout> = recorded.subsets;
const VARIANTS: Record<ProposedLayout, RecordedLayout> = recorded.variants;

/**
 * Proposed strategies Flow Workbench doesn't offer yet, recorded from its own
 * ELK engine with different settings: `compact` uses 48/64px spacing,
 * `vertical` lays out top-down with handles on the top and bottom.
 */
export type ProposedLayout = 'compact' | 'vertical';

export const FLOW_WORKBENCH_LAYOUT_SOURCE = recorded.source;

/** Flow Workbench's layout animation timings (useLayoutOperations). */
export const TIDY_ANIMATION_MS = 500;
export const ALIGN_ANIMATION_MS = 300;

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionDirection = 'horizontal' | 'vertical';

export interface LayoutResult {
  nodes: Node[];
  /** Routed edge bends by edge id; edges without an entry route straight. */
  waypoints: Map<string, { x: number; y: number }[]>;
}

export const snapToGrid = (value: number) => Math.round(value / GRID_SPACING) * GRID_SPACING;

const width = (node: Node) => node.measured?.width ?? node.width ?? 96;
const height = (node: Node) => node.measured?.height ?? node.height ?? 96;

function applyRecorded(
  allNodes: Node[],
  layout: RecordedLayout,
  offset: { x: number; y: number }
): LayoutResult {
  const nodes = allNodes.map((node) => {
    const point = layout.p[node.id];
    if (!point) return node;
    const [x = 0, y = 0] = point;
    return {
      ...node,
      position: { x: snapToGrid(x + offset.x), y: snapToGrid(y + offset.y) },
    };
  });
  const waypoints = new Map(
    Object.entries(layout.w).map(([edgeId, points]) => [
      edgeId,
      points.map(([x = 0, y = 0]) => ({
        x: snapToGrid(x + offset.x),
        y: snapToGrid(y + offset.y),
      })),
    ])
  );
  return { nodes, waypoints };
}

function anchoredToLeftmost(nodes: Node[], layout: RecordedLayout): LayoutResult {
  const leftmost = nodes.reduce((left, node) => (node.position.x < left.position.x ? node : left));
  const point = layout.p[leftmost.id];
  if (!point) return { nodes, waypoints: new Map() };
  const [x = 0, y = 0] = point;
  return applyRecorded(nodes, layout, { x: leftmost.position.x - x, y: leftmost.position.y - y });
}

/**
 * Tidy up nodes (⌘⇧L). Flow Workbench keeps the leftmost node where it is and
 * moves everything else around it. It does not refit the viewport.
 */
export function tidyAll(nodes: Node[]): LayoutResult {
  return anchoredToLeftmost(nodes, FULL);
}

/** A proposed strategy, anchored the same way as Tidy up nodes. */
export function tidyProposed(nodes: Node[], layout: ProposedLayout): LayoutResult {
  return anchoredToLeftmost(nodes, VARIANTS[layout]);
}

/**
 * Tidy selected (⌘⌥L). Lays out only the selection and keeps its top-left
 * corner in place. Returns null when fewer than two nodes are selected.
 */
export function tidySelected(nodes: Node[], modelOrder: string[]): LayoutResult | null {
  const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
  if (selectedIds.size < 2) return null;
  const key = modelOrder.filter((id) => selectedIds.has(id)).join(',');
  const layout = selectedIds.size === modelOrder.length ? FULL : SUBSETS[key];
  if (!layout) return null;

  const selected = nodes.filter((n) => selectedIds.has(n.id));
  const minX = Math.min(...selected.map((n) => n.position.x));
  const minY = Math.min(...selected.map((n) => n.position.y));
  const points = Object.values(layout.p);
  const layoutMinX = Math.min(...points.map(([x = 0]) => x));
  const layoutMinY = Math.min(...points.map(([, y = 0]) => y));
  return applyRecorded(nodes, layout, { x: minX - layoutMinX, y: minY - layoutMinY });
}

/** Copied from flow-core/layout/alignment.ts. */
export function alignNodes(nodes: Node[], alignment: AlignmentType): Node[] {
  if (nodes.length < 2) return nodes;
  const move = (fn: (node: Node) => Partial<Node['position']>) =>
    nodes.map((node) => ({ ...node, position: { ...node.position, ...fn(node) } }));

  switch (alignment) {
    case 'left': {
      const minX = snapToGrid(Math.min(...nodes.map((n) => n.position.x)));
      return move(() => ({ x: minX }));
    }
    case 'center': {
      const avg = nodes.reduce((sum, n) => sum + n.position.x + width(n) / 2, 0) / nodes.length;
      return move((n) => ({ x: snapToGrid(avg - width(n) / 2) }));
    }
    case 'right': {
      const maxX = snapToGrid(Math.max(...nodes.map((n) => n.position.x + width(n))));
      return move((n) => ({ x: maxX - width(n) }));
    }
    case 'top': {
      const minY = snapToGrid(Math.min(...nodes.map((n) => n.position.y)));
      return move(() => ({ y: minY }));
    }
    case 'middle': {
      const avg = nodes.reduce((sum, n) => sum + n.position.y + height(n) / 2, 0) / nodes.length;
      return move((n) => ({ y: snapToGrid(avg - height(n) / 2) }));
    }
    case 'bottom': {
      const maxY = snapToGrid(Math.max(...nodes.map((n) => n.position.y + height(n))));
      return move((n) => ({ y: maxY - height(n) }));
    }
  }
}

/**
 * Copied from flow-core/layout/distribution.ts: equal gaps between bounding
 * boxes, first and last nodes stay put.
 */
export function distributeNodes(nodes: Node[], direction: DistributionDirection): Node[] {
  if (nodes.length < 3) return nodes;
  const horizontal = direction === 'horizontal';
  const start = (n: Node) => (horizontal ? n.position.x : n.position.y);
  const size = horizontal ? width : height;

  const sorted = [...nodes].sort((a, b) => start(a) - start(b));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return nodes;
  const span = start(last) + size(last) - start(first);
  const sizes = sorted.reduce((sum, n) => sum + size(n), 0);
  const gap = Math.max(0, (span - sizes) / (sorted.length - 1));

  let cursor = start(first) + size(first) + gap;
  return sorted.map((node, i) => {
    if (i === 0 || i === sorted.length - 1) return node;
    const value = snapToGrid(cursor);
    cursor = value + size(node) + gap;
    return {
      ...node,
      position: horizontal ? { ...node.position, x: value } : { ...node.position, y: value },
    };
  });
}

/**
 * Proposed, not in Flow Workbench: "Subtle align" from apollo-ui#957. Nudges
 * nodes that are already close to sharing a row or column onto that line and
 * leaves the rest alone, so the workflow keeps its shape.
 */
export function subtleAlignNodes(nodes: Node[], threshold = 24): Node[] {
  const snapAxis = (values: number[]) => {
    const order = values
      .map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value);
    const clusters: { indices: number[]; sum: number }[] = [];
    for (const { value, index } of order) {
      const current = clusters[clusters.length - 1];
      if (current && value - current.sum / current.indices.length <= threshold) {
        current.indices.push(index);
        current.sum += value;
      } else {
        clusters.push({ indices: [index], sum: value });
      }
    }
    const snapped = [...values];
    for (const { indices, sum } of clusters) {
      for (const index of indices) snapped[index] = snapToGrid(sum / indices.length);
    }
    return snapped;
  };

  const xs = snapAxis(nodes.map((n) => n.position.x));
  const ys = snapAxis(nodes.map((n) => n.position.y));
  return nodes.map((node, i) => ({
    ...node,
    position: { x: xs[i] ?? node.position.x, y: ys[i] ?? node.position.y },
  }));
}

/** Applies routed bends from a layout pass, clearing stale ones on the moved edges. */
export function applyWaypoints(
  edges: Edge[],
  movedIds: Set<string>,
  waypoints: LayoutResult['waypoints']
): Edge[] {
  return edges.map((edge) => {
    if (!movedIds.has(edge.source) && !movedIds.has(edge.target)) return edge;
    const points = waypoints.get(edge.id);
    const { routedWaypoints: _stale, ...data } = (edge.data ?? {}) as Record<string, unknown>;
    return {
      ...edge,
      data: points
        ? { ...data, routedWaypoints: points.map((p, i) => ({ id: `${edge.id}-r${i}`, ...p })) }
        : data,
    };
  });
}

/** Flow Workbench's default easing for layout animation (AnimationService). */
const easeOutCubic = (t: number) => {
  const p = t - 1;
  return p * p * p + 1;
};

/**
 * Animates node positions toward `target`, calling `onFrame` with the
 * interpolated nodes each frame. Resolves when the animation finishes.
 */
export function animateNodes(
  from: Node[],
  target: Node[],
  duration: number,
  onFrame: (nodes: Node[]) => void
): Promise<void> {
  const start = new Map(from.map((n) => [n.id, n.position]));
  const begin = performance.now();
  return new Promise((resolve) => {
    const step = (now: number) => {
      const progress = Math.min((now - begin) / duration, 1);
      const eased = easeOutCubic(progress);
      onFrame(
        target.map((node) => {
          const origin = start.get(node.id) ?? node.position;
          return {
            ...node,
            position: {
              x: origin.x + (node.position.x - origin.x) * eased,
              y: origin.y + (node.position.y - origin.y) * eased,
            },
          };
        })
      );
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}
