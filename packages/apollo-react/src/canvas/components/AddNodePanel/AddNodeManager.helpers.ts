import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
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
    const containerNode = nodes.find((node) => node.id === placement.containerId)!;
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

  return resolveScopedCollisions(nodes, insertedNode, {
    ignoredNodeTypes,
    getNodeSize: getDimensions,
  });
}
