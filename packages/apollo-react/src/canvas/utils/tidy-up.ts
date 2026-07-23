import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { d3HierarchyLayout } from './coded-agents/d3-layout';

export type TidyUpStrategyId = 'subtle' | 'compact';

export interface TidyUpStrategyOption {
  id: TidyUpStrategyId;
  label: string;
  description: string;
}

export const TIDY_UP_STRATEGIES: TidyUpStrategyOption[] = [
  {
    id: 'subtle',
    label: 'Subtle align',
    description: 'Snaps close nodes into a neat grid.',
  },
  {
    id: 'compact',
    label: 'Compact layout',
    description: 'Re-flows into a tight hierarchy.',
  },
];

const DEFAULT_SNAP_THRESHOLD = 24;

/**
 * Clusters nearby values on a single axis and snaps every value in a cluster to
 * the cluster's average. Values that aren't close to any neighbor are left as-is
 * (each becomes its own single-value cluster).
 */
function snapAxis(values: number[], threshold: number): number[] {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const clusters: Array<{ indices: number[]; sum: number }> = [];

  for (const { value, index } of order) {
    const current = clusters[clusters.length - 1];
    const currentAverage = current ? current.sum / current.indices.length : undefined;
    if (current && currentAverage !== undefined && value - currentAverage <= threshold) {
      current.indices.push(index);
      current.sum += value;
    } else {
      clusters.push({ indices: [index], sum: value });
    }
  }

  const snapped = new Array<number>(values.length);
  for (const cluster of clusters) {
    const average = cluster.sum / cluster.indices.length;
    for (const index of cluster.indices) {
      snapped[index] = average;
    }
  }
  return snapped;
}

/**
 * "Subtle align" strategy: nudges nodes that are already close to being aligned
 * onto a shared line, independently on the x and y axes. Nodes far from any
 * neighbor are left untouched, so the overall shape of the workflow is
 * preserved -- this is a cleanup pass, not a full re-layout.
 */
export function subtleAlignNodes<T extends Node>(
  nodes: T[],
  threshold = DEFAULT_SNAP_THRESHOLD
): T[] {
  if (nodes.length === 0) {
    return nodes;
  }

  const xs = snapAxis(
    nodes.map((node) => node.position.x),
    threshold
  );
  const ys = snapAxis(
    nodes.map((node) => node.position.y),
    threshold
  );

  return nodes.map((node, index) => ({
    ...node,
    position: { x: xs[index] ?? node.position.x, y: ys[index] ?? node.position.y },
  }));
}

const DEFAULT_COMPACT_SPACING: [number, number] = [48, 64];

/**
 * "Compact layout" strategy: re-flows the workflow into a tight hierarchy
 * using the same d3-hierarchy layout CodedAgentFlow uses for its
 * Mermaid-parsed graphs, with denser default spacing than that use case.
 *
 * Defaults to left-to-right because workflow nodes route edges by handle
 * side (input on the left, output on the right, see `routing: 'handle'` on
 * `CanvasEdge`) -- a top-down layout would still connect right-side outputs
 * to left-side inputs below them, forcing every edge into an unnecessary
 * zigzag. `LR` keeps a parent's output roughly level with its child's input.
 */
export async function compactAlignNodes<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  spacing: [number, number] = DEFAULT_COMPACT_SPACING,
  direction: 'TD' | 'LR' | 'RL' | 'BT' = 'LR'
): Promise<N[]> {
  const { nodes: laidOut } = await d3HierarchyLayout(nodes, edges, {
    direction,
    spacing,
  });
  return laidOut as N[];
}
