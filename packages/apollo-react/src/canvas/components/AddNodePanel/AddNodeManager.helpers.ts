import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../../constants';
import type { NodeLayout } from '../../hooks/useCanvasNodeLayout';
import type { PreviewNodeConnectionInfo } from '../../hooks/usePreviewNode';
import type { NodeManifest } from '../../schema';
import { resolveCollisions } from '../../utils';
import { getExpandedSize } from '../../utils/node-size';
import {
  CONTAINER_SEQUENCE_GAP_PX,
  collectLinearDownstreamSiblings,
  fitContainersAndPushSiblings,
  getContainerPlacement,
  getContainerSafeArea,
  getNodeDimensions,
  type NodeDimensions,
  placeContainerNode,
} from '../../utils/container';
import { snapUpToGrid } from '../../utils/NodeUtils';

/**
 * Gap (px) used when shifting nodes around an Add Node insertion at the
 * top-level scope. Must exceed `2 × resolveCollisions` margin (32 each side =
 * 64 total) so the post-shift layout doesn't trigger another collision pass.
 */
const TOP_LEVEL_INSERTION_GAP_PX = GRID_SPACING * 5;

interface AddNodePlacementResult {
  nodes: Node[];
  insertedNode: Node;
}

/**
 * Returns the edge hidden by a preview node, if the preview replaced an
 * existing edge during Add Node insertion.
 */
export function getOriginalEdge(previewNode: Node | null | undefined): Edge | null {
  return (previewNode?.data?.originalEdge as Edge | undefined) ?? null;
}

function getPrimaryPreviewHandlePosition(
  previewNode: Node,
  previewConnections: PreviewNodeConnectionInfo[]
): Position | undefined {
  // Incoming placement is the most stable anchor for aligning the real node.
  // Source-only previews fall back to the first connection.
  const primaryConnection =
    previewConnections.find((connection) => !connection.addNewNodeAsSource) ??
    previewConnections[0];
  const handlePosition = primaryConnection?.addNewNodeAsSource
    ? previewNode.data?.outputHandlePosition
    : previewNode.data?.inputHandlePosition;

  return handlePosition as Position | undefined;
}

/**
 * Repositions the real node so the handle-facing side matches the preview even
 * when the real node's manifest size differs from the square preview.
 */
export function alignNodeToPreview(
  node: Node,
  previewNode: Node,
  previewConnections: PreviewNodeConnectionInfo[],
  nodeManifest: NodeManifest | undefined
): Node {
  const previewSize = getNodeDimensions(previewNode);
  const nodeSize = getNodeDimensions(node, getExpandedSize(nodeManifest?.display.shape));

  if (previewSize.width === nodeSize.width && previewSize.height === nodeSize.height) {
    return node;
  }

  const previewHandlePosition = getPrimaryPreviewHandlePosition(previewNode, previewConnections);
  const previewCenterX = previewNode.position.x + previewSize.width / 2;
  const previewCenterY = previewNode.position.y + previewSize.height / 2;

  if (previewHandlePosition === Position.Left) {
    return {
      ...node,
      position: {
        x: previewNode.position.x,
        y: previewCenterY - nodeSize.height / 2,
      },
    };
  }

  if (previewHandlePosition === Position.Right) {
    return {
      ...node,
      position: {
        x: previewNode.position.x + previewSize.width - nodeSize.width,
        y: previewCenterY - nodeSize.height / 2,
      },
    };
  }

  if (previewHandlePosition === Position.Top) {
    return {
      ...node,
      position: {
        x: previewCenterX - nodeSize.width / 2,
        y: previewNode.position.y,
      },
    };
  }

  if (previewHandlePosition === Position.Bottom) {
    return {
      ...node,
      position: {
        x: previewCenterX - nodeSize.width / 2,
        y: previewNode.position.y + previewSize.height - nodeSize.height,
      },
    };
  }

  return {
    ...node,
    position: {
      x: previewCenterX - nodeSize.width / 2,
      y: previewCenterY - nodeSize.height / 2,
    },
  };
}

function resolveScopedCollisions(
  nodes: Node[],
  insertedNode: Node,
  options: {
    ignoredNodeTypes?: string[];
    getNodeDimensions: (node: Node) => NodeDimensions;
  }
): AddNodePlacementResult {
  const siblingNodes = nodes.filter((node) => node.parentId === insertedNode.parentId);
  const resolvedSiblings = resolveCollisions(siblingNodes, options);
  const resolvedSiblingById = new Map(resolvedSiblings.map((node) => [node.id, node]));
  const resolvedNodes = nodes.map((node) => resolvedSiblingById.get(node.id) ?? node);

  return {
    nodes: resolvedNodes,
    insertedNode: resolvedSiblingById.get(insertedNode.id)!,
  };
}

/**
 * For top-level edge insertions (preview replaced an existing edge but is not
 * scoped to a container), keeps the row layout intact regardless of the
 * inserted node's shape:
 *
 *   1. Bumps the inserted node right if it would overlap the upstream source's
 *      gap zone — `alignNodeToPreview` only matches the preview's anchor and
 *      doesn't account for size differences vs the source.
 *   2. Shifts the downstream target and its linear chain right by enough to
 *      clear the inserted node's trailing edge plus a sequence gap.
 *
 * Without these adjustments, generic collision resolution picks the
 * smallest-overlap axis and can split the row vertically for wider/larger
 * shapes (rectangle, container) or push the upstream source backwards.
 */
function shiftForEdgeInsertion({
  nodes,
  edges,
  previewNode,
  insertedNode,
  getNodeDimensions,
}: {
  nodes: Node[];
  edges: Edge[];
  previewNode: Node;
  insertedNode: Node;
  getNodeDimensions: (node: Node) => NodeDimensions;
}): { nodes: Node[]; insertedNode: Node } | null {
  const originalEdge = getOriginalEdge(previewNode);
  if (!originalEdge) return null;

  const targetNode = nodes.find((node) => node.id === originalEdge.target);
  if (!targetNode || targetNode.parentId !== insertedNode.parentId) return null;

  const insertedSize = getNodeDimensions(insertedNode);

  // Step 1: clear the upstream source.
  let insertedX = insertedNode.position.x;
  const sourceNode = nodes.find((node) => node.id === originalEdge.source);
  if (sourceNode && sourceNode.parentId === insertedNode.parentId) {
    const sourceSize = getNodeDimensions(sourceNode);
    const requiredInsertedLeft =
      sourceNode.position.x + sourceSize.width + TOP_LEVEL_INSERTION_GAP_PX;
    if (insertedX < requiredInsertedLeft) {
      insertedX = snapUpToGrid(requiredInsertedLeft);
    }
  }

  // Step 2: shift the downstream chain.
  // Back-edge detection: when source is visually at or past target on the
  // x axis, the original edge points backward in flow (a loopback). The
  // inserted node already lives past source via Step 1; shifting target
  // right would push the loop's start further from the cycle and produce
  // a backward-wrapping body edge. Forward edges (source.x < target.x)
  // continue to shift normally, including in cycles where the body chain
  // is the part being inserted on (the source still stays via the
  // chainIds.delete below, but the rest of the chain shifts right).
  const isBackEdge =
    sourceNode !== undefined &&
    sourceNode.parentId === insertedNode.parentId &&
    sourceNode.position.x >= targetNode.position.x;
  const requiredTargetLeft = insertedX + insertedSize.width + TOP_LEVEL_INSERTION_GAP_PX;
  const downstreamShift =
    !isBackEdge && targetNode.position.x < requiredTargetLeft
      ? snapUpToGrid(requiredTargetLeft - targetNode.position.x)
      : 0;
  const chainIds =
    downstreamShift > 0
      ? new Set(
          collectLinearDownstreamSiblings({
            startNodeId: targetNode.id,
            parentId: insertedNode.parentId,
            nodes,
            edges,
          })
        )
      : new Set<string>();
  // The upstream source must never shift, even when it appears in the
  // chain via a cycle (Loop V1 body→…→loopBack chains). Removing it from
  // the shift set lets the rest of the linear chain expand right while
  // the loop's start stays anchored.
  chainIds.delete(originalEdge.source);

  const insertedXChanged = insertedX !== insertedNode.position.x;
  if (!insertedXChanged && chainIds.size === 0) return null;

  const updatedInsertedNode: Node = insertedXChanged
    ? { ...insertedNode, position: { x: insertedX, y: insertedNode.position.y } }
    : insertedNode;

  const updatedNodes = nodes.map((node) => {
    if (node.id === insertedNode.id) return updatedInsertedNode;
    if (chainIds.has(node.id)) {
      return {
        ...node,
        position: { x: node.position.x + downstreamShift, y: node.position.y },
      };
    }
    return node;
  });

  return { nodes: updatedNodes, insertedNode: updatedInsertedNode };
}

/**
 * Applies the final Add Node placement after a preview is accepted. Container
 * previews use their saved placement metadata; all other previews use scoped
 * collision resolution.
 */
export function placeAddedNode({
  nodes,
  edges,
  previewNode,
  insertedNode,
  layout,
  ignoredNodeTypes,
}: {
  nodes: Node[];
  edges: Edge[];
  previewNode: Node;
  insertedNode: Node;
  layout: NodeLayout;
  ignoredNodeTypes?: string[];
}): AddNodePlacementResult {
  const { getNodeDimensions, isContainerNode, getContainerFitGeometry } = layout;
  const placement = getContainerPlacement(previewNode);

  if (placement) {
    const containerNode = nodes.find((node) => node.id === placement.containerId);

    if (!containerNode) {
      return resolveScopedCollisions(nodes, insertedNode, {
        ignoredNodeTypes,
        getNodeDimensions,
      });
    }

    if (!isContainerNode(containerNode)) {
      return resolveScopedCollisions(nodes, insertedNode, {
        ignoredNodeTypes,
        getNodeDimensions,
      });
    }

    const placedNodes = placeContainerNode({
      nodes,
      insertedNode,
      placement,
      edges,
      getNodeDimensions,
      safeArea: getContainerSafeArea(containerNode),
      getContainerFitGeometry,
      ignoredNodeTypes,
    });

    // The preview is sized at `DEFAULT_NODE_SIZE` (96x96) but the materialized
    // node can be much larger — a container node is 560x320 by default — so a
    // True target placed by `calculateAutoPosition` for the 96-tall preview can
    // overlap a False target sibling once both materialize. Resolve sibling
    // collisions after fit so multi-output branches don't stack.
    const placedInsertedNode = placedNodes.find((node) => node.id === insertedNode.id)!;
    const resolved = resolveScopedCollisions(placedNodes, placedInsertedNode, {
      ignoredNodeTypes,
      getNodeDimensions,
    });
    // After siblings shift apart, the container may again need to grow.
    if (resolved.insertedNode.parentId) {
      const refitted = fitContainersAndPushSiblings({
        nodes: resolved.nodes,
        containerIds: [resolved.insertedNode.parentId],
        getContainerFitGeometry,
        getNodeDimensions,
        ignoredNodeTypes,
        gap: CONTAINER_SEQUENCE_GAP_PX,
      });
      return {
        nodes: refitted,
        insertedNode:
          refitted.find((node) => node.id === resolved.insertedNode.id) ?? resolved.insertedNode,
      };
    }
    return resolved;
  }

  const shifted = shiftForEdgeInsertion({
    nodes,
    edges,
    previewNode,
    insertedNode,
    getNodeDimensions,
  });

  const placementResult = resolveScopedCollisions(
    shifted?.nodes ?? nodes,
    shifted?.insertedNode ?? insertedNode,
    {
      ignoredNodeTypes,
      getNodeDimensions,
    }
  );

  if (!placementResult.insertedNode.parentId) {
    return placementResult;
  }

  const fittedNodes = fitContainersAndPushSiblings({
    nodes: placementResult.nodes,
    containerIds: [placementResult.insertedNode.parentId],
    getContainerFitGeometry,
    getNodeDimensions,
    ignoredNodeTypes,
    gap: CONTAINER_SEQUENCE_GAP_PX,
  });

  return {
    nodes: fittedNodes,
    insertedNode:
      fittedNodes.find((node) => node.id === placementResult.insertedNode.id) ??
      placementResult.insertedNode,
  };
}
