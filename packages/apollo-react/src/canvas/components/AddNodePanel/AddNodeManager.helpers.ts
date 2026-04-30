import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../../constants';
import type { NodeTypeRegistry } from '../../core';
import type { PreviewNodeConnectionInfo } from '../../hooks/usePreviewNode';
import type { NodeManifest } from '../../schema';
import { resolveCollisions } from '../../utils';
import { getExpandedSize } from '../../utils/collapse';
import {
  getContainerFitGeometry,
  getContainerPlacement,
  getContainerSafeArea,
  getNodeDimensions,
  isContainerNodeManifest,
  type NodeDimensions,
  placeContainerNode,
} from '../../utils/container';
import { isPreviewEdge } from '../../utils/createPreviewNode';
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

function getManifestForNode(
  registry: NodeTypeRegistry | null,
  node: Node
): NodeManifest | undefined {
  return node.type ? registry?.getManifest(node.type) : undefined;
}

function getManifestAwareNodeDimensions(registry: NodeTypeRegistry | null, node: Node) {
  const manifest = getManifestForNode(registry, node);

  return getNodeDimensions(node, getExpandedSize(manifest?.display.shape));
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
    getNodeSize: (node: Node) => NodeDimensions;
  }
): AddNodePlacementResult {
  const siblingNodes = nodes.filter((node) => node.parentId === insertedNode.parentId);
  const resolvedSiblings = resolveCollisions(siblingNodes, {
    ignoredNodeTypes: options.ignoredNodeTypes,
    getNodeSize: options.getNodeSize,
  });
  const resolvedSiblingById = new Map(resolvedSiblings.map((node) => [node.id, node]));
  const resolvedNodes = nodes.map((node) => resolvedSiblingById.get(node.id) ?? node);

  return {
    nodes: resolvedNodes,
    insertedNode: resolvedSiblingById.get(insertedNode.id)!,
  };
}

/**
 * Walks one linear sibling chain downstream from `startNodeId`, following
 * single outgoing edges that stay within the same parent scope. Stops on
 * branches, cycles, container exits, and preview edges.
 *
 * Used to find the set of nodes that should rigidly shift right when a wider
 * node is inserted upstream.
 */
function collectLinearDownstreamChain({
  startNodeId,
  parentId,
  nodes,
  edges,
}: {
  startNodeId: string;
  parentId: string | undefined;
  nodes: Node[];
  edges: Edge[];
}): string[] {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const collected: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = startNodeId;

  while (currentId && !visited.has(currentId)) {
    const current = nodesById.get(currentId);
    if (!current || current.parentId !== parentId) break;

    collected.push(currentId);
    visited.add(currentId);

    const outgoing = edges.filter(
      (edge) =>
        !isPreviewEdge(edge) &&
        edge.source === currentId &&
        nodesById.get(edge.target)?.parentId === parentId
    );
    // Branches and dead-ends both stop the linear shift; ambiguous cases get
    // handed off to generic collision resolution.
    currentId = outgoing.length === 1 ? outgoing[0]!.target : null;
  }

  return collected;
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
  getNodeSize,
}: {
  nodes: Node[];
  edges: Edge[];
  previewNode: Node;
  insertedNode: Node;
  getNodeSize: (node: Node) => NodeDimensions;
}): { nodes: Node[]; insertedNode: Node } | null {
  const originalEdge = getOriginalEdge(previewNode);
  if (!originalEdge) return null;

  const targetNode = nodes.find((node) => node.id === originalEdge.target);
  if (!targetNode || targetNode.parentId !== insertedNode.parentId) return null;

  const insertedSize = getNodeSize(insertedNode);

  // Step 1: clear the upstream source.
  let insertedX = insertedNode.position.x;
  const sourceNode = nodes.find((node) => node.id === originalEdge.source);
  if (sourceNode && sourceNode.parentId === insertedNode.parentId) {
    const sourceSize = getNodeSize(sourceNode);
    const requiredInsertedLeft =
      sourceNode.position.x + sourceSize.width + TOP_LEVEL_INSERTION_GAP_PX;
    if (insertedX < requiredInsertedLeft) {
      insertedX = snapUpToGrid(requiredInsertedLeft);
    }
  }

  // Step 2: shift the downstream chain.
  const requiredTargetLeft = insertedX + insertedSize.width + TOP_LEVEL_INSERTION_GAP_PX;
  const downstreamShift =
    targetNode.position.x < requiredTargetLeft
      ? snapUpToGrid(requiredTargetLeft - targetNode.position.x)
      : 0;
  const chainIds =
    downstreamShift > 0
      ? new Set(
          collectLinearDownstreamChain({
            startNodeId: targetNode.id,
            parentId: insertedNode.parentId,
            nodes,
            edges,
          })
        )
      : new Set<string>();

  const insertedXChanged = insertedX !== insertedNode.position.x;
  if (!insertedXChanged && downstreamShift === 0) return null;

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
  registry,
  ignoredNodeTypes,
}: {
  nodes: Node[];
  edges: Edge[];
  previewNode: Node;
  insertedNode: Node;
  registry: NodeTypeRegistry | null;
  ignoredNodeTypes?: string[];
}): AddNodePlacementResult {
  const getDimensions = (node: Node) => getManifestAwareNodeDimensions(registry, node);
  const placement = getContainerPlacement({ previewNode });

  if (placement) {
    const containerNode = nodes.find((node) => node.id === placement.containerId);

    if (!containerNode) {
      return resolveScopedCollisions(nodes, insertedNode, {
        ignoredNodeTypes,
        getNodeSize: getDimensions,
      });
    }

    const containerManifest = getManifestForNode(registry, containerNode);

    if (!isContainerNodeManifest(containerManifest)) {
      return resolveScopedCollisions(nodes, insertedNode, {
        ignoredNodeTypes,
        getNodeSize: getDimensions,
      });
    }

    const resolvedNodes = placeContainerNode({
      nodes,
      insertedNode,
      placement,
      edges,
      getNodeDimensions: getDimensions,
      safeArea: getContainerSafeArea(containerNode),
      getContainerFitGeometry: (node) =>
        isContainerNodeManifest(getManifestForNode(registry, node))
          ? getContainerFitGeometry()
          : null,
    });

    return {
      nodes: resolvedNodes,
      insertedNode: resolvedNodes.find((node) => node.id === insertedNode.id)!,
    };
  }

  const shifted = shiftForEdgeInsertion({
    nodes,
    edges,
    previewNode,
    insertedNode,
    getNodeSize: getDimensions,
  });

  return resolveScopedCollisions(shifted?.nodes ?? nodes, shifted?.insertedNode ?? insertedNode, {
    ignoredNodeTypes,
    getNodeSize: getDimensions,
  });
}
