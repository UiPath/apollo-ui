import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  type AnalyzeSequentialCompatibilityOptions,
  analyzeSequentialCompatibility,
  type CanvasView,
  type SequentialCompatibilityReport,
} from '../../utils/sequential';
import {
  layoutWorkflowLeftToRight,
  type WorkflowLayoutOptions,
  type WorkflowLayoutResult,
} from '../../utils/workflow-layout';
import { synthesizePositionsForFlow } from './synthesizePositionsForFlow';

export interface PrepareCanvasViewTransitionOptions {
  flowLayout?: WorkflowLayoutOptions;
  sequential?: AnalyzeSequentialCompatibilityOptions;
}

export interface CanvasViewTransitionResult<N extends Node = Node> {
  view: CanvasView;
  /** Canonical nodes after applying presentation state required by the target view. */
  nodes: N[];
  /** Present when entering flow; useful for viewport fitting and diagnostics. */
  flowLayout?: WorkflowLayoutResult;
  /** Present when entering sequential; topology is analyzed but never rewritten. */
  sequentialCompatibility?: SequentialCompatibilityReport;
}

/**
 * Prepares one canonical workflow graph for a presentation switch.
 *
 * Flow is a concrete left-to-right layout, so its positions and container sizes
 * become canonical presentation state. Sequential is a derived projection: it
 * only receives a compatibility report and leaves every node object untouched.
 */
export function prepareCanvasViewTransition<N extends Node = Node>(
  targetView: CanvasView,
  nodes: N[],
  edges: Edge[],
  options: PrepareCanvasViewTransitionOptions = {}
): CanvasViewTransitionResult<N> {
  const isWorkflowNode = (node: Node) => node.type !== 'stickyNote';
  if (targetView === 'sequential') {
    return {
      view: targetView,
      nodes,
      sequentialCompatibility: analyzeSequentialCompatibility(nodes, edges, {
        ...options.sequential,
        isSequenceNode: options.sequential?.isSequenceNode ?? isWorkflowNode,
      }),
    };
  }

  // Clear sequential-insert markers before laying out the entire flow. The
  // synthesized coordinates are deliberately superseded by the deterministic
  // layout, but marker cleanup still restores normal draggable behavior.
  const normalizedNodes = synthesizePositionsForFlow(nodes, edges) as N[];
  const flowLayout = layoutWorkflowLeftToRight(normalizedNodes, edges, {
    ...options.flowLayout,
    isLayoutNode: options.flowLayout?.isLayoutNode ?? isWorkflowNode,
  });
  let changed = normalizedNodes !== nodes;
  const nextNodes = normalizedNodes.map((node) => {
    const position = flowLayout.positions.get(node.id);
    if (!position) return node;
    const size = flowLayout.resizedNodeIds.has(node.id)
      ? flowLayout.dimensions.get(node.id)
      : undefined;
    const positionChanged = node.position.x !== position.x || node.position.y !== position.y;
    const sizeChanged =
      !!size &&
      (node.width !== size.width ||
        node.height !== size.height ||
        node.style?.width !== size.width ||
        node.style?.height !== size.height);
    if (!positionChanged && !sizeChanged) return node;

    changed = true;
    return {
      ...node,
      position,
      ...(size
        ? {
            width: size.width,
            height: size.height,
            style: { ...node.style, width: size.width, height: size.height },
          }
        : {}),
    };
  });

  return {
    view: targetView,
    nodes: changed ? nextNodes : nodes,
    flowLayout,
  };
}
