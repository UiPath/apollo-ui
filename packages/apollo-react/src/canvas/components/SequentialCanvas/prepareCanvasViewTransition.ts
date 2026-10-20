import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import type { NodeManifest } from '../../schema/node-definition';
import { orderNodesParentsFirst } from '../../utils/NodeUtils';
import {
  type AnalyzeSequentialCompatibilityOptions,
  analyzeSequentialCompatibility,
  type CanvasView,
  createSequencePredicates,
  defaultIsSequenceNode,
  type SequentialCompatibilityReport,
} from '../../utils/sequential';
import {
  layoutWorkflowLeftToRight,
  type WorkflowLayoutOptions,
  type WorkflowLayoutResult,
} from '../../utils/workflow-layout';
import { synthesizePositionsForFlow } from './synthesizePositionsForFlow';

export interface PrepareCanvasViewTransitionOptions {
  /**
   * Manifest lookup (normally `registry.getManifest`) from which the sequence, start and
   * container predicates are derived exactly as SequentialCanvas derives them, so the
   * compatibility report describes the same node set the canvas renders. The explicit
   * predicates below still win when set.
   */
  getManifest?: (type: string) => NodeManifest | undefined;
  /**
   * Structural container predicate for both halves of the transition. Without it (or
   * `getManifest`) `layoutWorkflowLeftToRight` infers containment from "has a child", so an
   * empty container is sized as an ordinary node. The per-half options still win when set.
   */
  isContainerNode?: (node: Node) => boolean;
  /**
   * Which nodes take part in the sequential projection. Defaults to everything but sticky
   * notes; with `getManifest`, artifact-only resources are excluded too. Flow layout is
   * unaffected: resources are still laid out as nodes there.
   */
  isSequenceNode?: (node: Node) => boolean;
  /** Which nodes collapse into the synthetic start row. Sequential half only. */
  isStartNode?: (node: Node) => boolean;
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
 * Prepares a canonical graph for a view switch. Entering flow lays out positions and
 * container sizes into canonical state; entering sequential only attaches a compatibility
 * report and leaves every node untouched.
 */
export function prepareCanvasViewTransition<N extends Node = Node>(
  targetView: CanvasView,
  nodes: N[],
  edges: Edge[],
  options: PrepareCanvasViewTransitionOptions = {}
): CanvasViewTransitionResult<N> {
  const derived = options.getManifest ? createSequencePredicates(options.getManifest) : undefined;
  const isSequenceNode = options.isSequenceNode ?? derived?.isSequenceNode ?? defaultIsSequenceNode;
  const isContainerNode = options.isContainerNode ?? derived?.isContainerNode;
  if (targetView === 'sequential') {
    return {
      view: targetView,
      nodes,
      sequentialCompatibility: analyzeSequentialCompatibility(nodes, edges, {
        ...options.sequential,
        isSequenceNode: options.sequential?.isSequenceNode ?? isSequenceNode,
        isStartNode: options.sequential?.isStartNode ?? options.isStartNode ?? derived?.isStartNode,
        isContainerNode: options.sequential?.isContainerNode ?? isContainerNode,
      }),
    };
  }

  // Clear sequential-insert markers (the layout supersedes the synthesized coordinates, but
  // the cleanup restores draggability) and reorder parents-first: React Flow drops a parent
  // link whose child comes first, while the layout buckets by `parentId` and would not notice.
  const normalizedNodes = orderNodesParentsFirst(synthesizePositionsForFlow(nodes, edges) as N[]);
  const flowLayout = layoutWorkflowLeftToRight(normalizedNodes, edges, {
    ...options.flowLayout,
    // Resources stay laid out as nodes in flow view, so the registry-free default applies.
    isLayoutNode: options.flowLayout?.isLayoutNode ?? defaultIsSequenceNode,
    isContainerNode: options.flowLayout?.isContainerNode ?? isContainerNode,
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
