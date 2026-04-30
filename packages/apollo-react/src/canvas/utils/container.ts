import type {
  Edge,
  Node,
  ReactFlowInstance,
  XYPosition,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  DEFAULT_NODE_SIZE,
  DEFAULT_SOURCE_HANDLE_ID,
  GRID_SPACING,
  PREVIEW_NODE_ID,
} from '../constants';
import type { NodeManifest } from '../schema/node-definition';
import type { PreviewEndpoint, PreviewGraphOverrides } from './createPreviewGraph';
import {
  clamp,
  getAbsolutePosition,
  getNonOverlappingPositionForDirection,
  snapToGrid,
  snapUpToGrid,
} from './NodeUtils';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface NodeDimensions {
  width: number;
  height: number;
}

/**
 * Sizing rules used when a container needs to grow around its children.
 * Padding is trailing-only because child positions are already relative to the
 * container's top-left corner.
 */
export interface ContainerFitGeometry {
  minWidth: number;
  minHeight: number;
  padding?: {
    right?: number;
    bottom?: number;
  };
}

/**
 * Local container rectangle where child nodes may be placed without covering
 * the frame, header, or inner handle rails.
 */
export interface ContainerSafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
}

/** Records a single container resize caused by fitting children. */
export interface ContainerSizeChange {
  containerId: string;
  previousSize: NodeDimensions;
  nextSize: NodeDimensions;
}

/** Result of fitting one or more containers to their visible children. */
export interface EnsureContainersFitChildrenResult {
  nodes: Node[];
  changes: ContainerSizeChange[];
}

/**
 * Placement metadata carried by preview nodes so the final Add Node action can
 * materialize the node in the same container sequence.
 */
export interface ContainerPlacement {
  containerId: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  mode: 'first-child' | 'sequence';
}

interface PreviewPlacement {
  containerId: string;
  centerPosition: XYPosition;
}

interface ContainerPreviewContext {
  source: PreviewEndpoint;
  sourceHandleType: 'source' | 'target';
  reactFlowInstance: ReactFlowInstance;
}

interface ContainerPreviewOptions {
  isContainerNode?: (node: Node) => boolean;
  getContainerSafeArea?: (containerNode: Node) => ContainerSafeArea | undefined;
  getContainerContinuationTarget?: (context: {
    containerNode: Node;
    sourceNode: Node;
    source: PreviewEndpoint;
    reactFlowInstance: ReactFlowInstance;
  }) => PreviewEndpoint | null | undefined;
  previewNodeSize?: NodeDimensions;
  gap?: number;
  avoidSiblings?: boolean;
  getNodeDimensions?: (node: Node) => NodeDimensions;
}

type SequenceEdgePredicate = (edge: Edge) => boolean;

interface NextNodeContext {
  nodeId: string;
  edges: Edge[];
  nodesById: Map<string, Node>;
  containerId: string;
}

type NextNodeResolver = (context: NextNodeContext) => string | null | undefined;

/** Default intrinsic size for container nodes (grid-aligned). */
export const DEFAULT_CONTAINER_WIDTH = GRID_SPACING * 35; // 560px
export const DEFAULT_CONTAINER_HEIGHT = GRID_SPACING * 20; // 320px

/** Default min size for container nodes. */
export const DEFAULT_CONTAINER_MIN_WIDTH = GRID_SPACING * 25; // 400px
export const DEFAULT_CONTAINER_MIN_HEIGHT = GRID_SPACING * 14; // 224px

/** Visual frame inset used by container handles and placement safe areas. */
export const CONTAINER_FRAME_INSET_PX = 10;

const CONTAINER_BODY_PADDING_PX = GRID_SPACING * 2;
const CONTAINER_INNER_HANDLE_RAIL_WIDTH_PX = GRID_SPACING * 5;
const CONTAINER_CHILD_SAFE_GAP_PX = GRID_SPACING;
const DEFAULT_CONTAINER_HEADER_HEIGHT_PX = 40;

/** Horizontal gap maintained between nodes in a container sequence. */
export const CONTAINER_SEQUENCE_GAP_PX = GRID_SPACING * 3;

const PLACEMENT_DATA_KEY = 'placement';

// -----------------------------------------------------------------------------
// Geometry
// -----------------------------------------------------------------------------

function readNumericDimension(...values: Array<number | string | undefined>): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsedValue = Number.parseFloat(value);
      if (Number.isFinite(parsedValue)) return parsedValue;
    }
  }

  return undefined;
}

/**
 * Resolves the best available node size, preferring measured/runtime values and
 * falling back to style or a caller-provided default.
 */
export function getNodeDimensions(
  node: Pick<Node, 'width' | 'height' | 'measured' | 'style'>,
  fallback: NodeDimensions = { width: DEFAULT_NODE_SIZE, height: DEFAULT_NODE_SIZE }
): NodeDimensions {
  return {
    width:
      readNumericDimension(node.width, node.measured?.width, node.style?.width) ?? fallback.width,
    height:
      readNumericDimension(node.height, node.measured?.height, node.style?.height) ??
      fallback.height,
  };
}

/**
 * Returns the child-placement area inside a container in local coordinates.
 * The safe area accounts for header height, frame inset, body padding, and
 * inner handle rails so auto-placed children stay clear of container chrome.
 */
export function getContainerSafeArea(
  containerNode: Pick<Node, 'width' | 'height' | 'measured' | 'style'>,
  fallback: NodeDimensions = { width: DEFAULT_CONTAINER_WIDTH, height: DEFAULT_CONTAINER_HEIGHT }
): ContainerSafeArea {
  const size = getNodeDimensions(containerNode, fallback);
  const horizontalPadding = snapUpToGrid(
    CONTAINER_FRAME_INSET_PX +
      CONTAINER_BODY_PADDING_PX +
      CONTAINER_INNER_HANDLE_RAIL_WIDTH_PX +
      CONTAINER_CHILD_SAFE_GAP_PX
  );
  const verticalPadding = snapUpToGrid(CONTAINER_FRAME_INSET_PX + CONTAINER_BODY_PADDING_PX);
  const padding = {
    left: horizontalPadding,
    right: horizontalPadding,
    top: snapUpToGrid(DEFAULT_CONTAINER_HEADER_HEIGHT_PX + verticalPadding),
    bottom: verticalPadding,
  };

  return {
    x: padding.left,
    y: padding.top,
    width: Math.max(0, size.width - padding.left - padding.right),
    height: Math.max(0, size.height - padding.top - padding.bottom),
    padding,
  };
}

/** Returns the default fit rules for loop/container nodes. */
export function getContainerFitGeometry(): ContainerFitGeometry {
  const padding = getContainerSafeArea({
    width: DEFAULT_CONTAINER_WIDTH,
    height: DEFAULT_CONTAINER_HEIGHT,
  }).padding!;

  return {
    minWidth: DEFAULT_CONTAINER_MIN_WIDTH,
    minHeight: DEFAULT_CONTAINER_MIN_HEIGHT,
    padding: {
      right: padding.right,
      bottom: padding.bottom,
    },
  };
}

/** Returns whether a node manifest describes a structural container node. */
export function isContainerNodeManifest(
  manifest: Pick<NodeManifest, 'display'> | undefined
): boolean {
  return manifest?.display.shape === 'container';
}

function getAncestorContainerIds(containerId: string, nodesById: Map<string, Node>): string[] {
  const ancestors: string[] = [];
  let parentId = nodesById.get(containerId)?.parentId;

  while (parentId) {
    ancestors.push(parentId);
    parentId = nodesById.get(parentId)?.parentId;
  }

  return ancestors;
}

function getContainerDepth(containerId: string, nodesById: Map<string, Node>): number {
  let depth = 0;
  let parentId = nodesById.get(containerId)?.parentId;

  while (parentId) {
    depth += 1;
    parentId = nodesById.get(parentId)?.parentId;
  }

  return depth;
}

function withNodeDimensions(node: Node, size: NodeDimensions): Node {
  return {
    ...node,
    width: size.width,
    height: size.height,
    style: {
      ...node.style,
      width: size.width,
      height: size.height,
    },
  };
}

/**
 * Expands containers to include their visible children and returns the resize
 * changes that were applied. Containers never shrink here; this keeps automatic
 * layout from stealing space the user may have intentionally created.
 */
export function ensureContainersFitChildren(
  nodes: Node[],
  {
    containerIds,
    getContainerFitGeometry: resolveContainerFitGeometry,
    getNodeDimensions: resolveNodeDimensions = getNodeDimensions,
    ignoredNodeTypes = [],
    includeAncestors = true,
  }: {
    containerIds?: Iterable<string>;
    getContainerFitGeometry?: (containerNode: Node) => ContainerFitGeometry | null | undefined;
    getNodeDimensions?: (node: Node) => NodeDimensions;
    ignoredNodeTypes?: string[];
    includeAncestors?: boolean;
  } = {}
): EnsureContainersFitChildrenResult {
  let nextNodes = nodes;
  const changes: ContainerSizeChange[] = [];
  const ignoredTypes = new Set(ignoredNodeTypes);
  const nodesById = new Map(nextNodes.map((node) => [node.id, node]));
  const idsToFit = new Set<string>();

  if (containerIds) {
    for (const id of containerIds) {
      idsToFit.add(id);
    }
  } else {
    for (const node of nextNodes) {
      if (node.parentId) idsToFit.add(node.parentId);
    }
  }

  if (includeAncestors) {
    for (const id of Array.from(idsToFit)) {
      for (const ancestorId of getAncestorContainerIds(id, nodesById)) {
        idsToFit.add(ancestorId);
      }
    }
  }

  // Fit deepest containers first so ancestors see any child-container growth.
  const orderedContainerIds = Array.from(idsToFit).sort(
    (left, right) => getContainerDepth(right, nodesById) - getContainerDepth(left, nodesById)
  );

  for (const containerId of orderedContainerIds) {
    const containerNode = nextNodes.find((node) => node.id === containerId)!;
    const geometry = resolveContainerFitGeometry?.(containerNode);
    if (!geometry) continue;

    const currentSize = resolveNodeDimensions(containerNode);
    const padding = geometry.padding ?? {};
    let requiredWidth = geometry.minWidth;
    let requiredHeight = geometry.minHeight;

    for (const childNode of nextNodes) {
      // Transient, hidden, and ignored children should not force a persisted
      // container size.
      if (
        childNode.id === PREVIEW_NODE_ID ||
        childNode.hidden ||
        childNode.parentId !== containerId ||
        ignoredTypes.has(childNode.type ?? '')
      ) {
        continue;
      }

      const childSize = resolveNodeDimensions(childNode);
      requiredWidth = Math.max(
        requiredWidth,
        childNode.position.x + childSize.width + (padding.right ?? 0)
      );
      requiredHeight = Math.max(
        requiredHeight,
        childNode.position.y + childSize.height + (padding.bottom ?? 0)
      );
    }

    const nextSize = {
      width: Math.max(currentSize.width, snapUpToGrid(requiredWidth)),
      height: Math.max(currentSize.height, snapUpToGrid(requiredHeight)),
    };

    if (nextSize.width === currentSize.width && nextSize.height === currentSize.height) {
      continue;
    }

    nextNodes = nextNodes.map((node) =>
      node.id === containerId ? withNodeDimensions(node, nextSize) : node
    );
    nodesById.set(containerId, nextNodes.find((node) => node.id === containerId)!);
    changes.push({
      containerId,
      previousSize: currentSize,
      nextSize,
    });
  }

  return { nodes: nextNodes, changes };
}

function getSafeArea(containerNode: Node, safeArea?: ContainerSafeArea): ContainerSafeArea {
  return safeArea ?? getContainerSafeArea(containerNode);
}

function clampTopLeftToSafeArea(
  position: XYPosition,
  safeArea: ContainerSafeArea,
  nodeSize: NodeDimensions
): XYPosition {
  const maxX = safeArea.x + Math.max(0, safeArea.width - nodeSize.width);
  const maxY = safeArea.y + Math.max(0, safeArea.height - nodeSize.height);

  return {
    x: clamp(position.x, safeArea.x, maxX),
    y: clamp(position.y, safeArea.y, maxY),
  };
}

function clampTopToSafeArea(
  top: number,
  safeArea: ContainerSafeArea,
  nodeSize: NodeDimensions
): number {
  const maxY = safeArea.y + Math.max(0, safeArea.height - nodeSize.height);

  return clamp(top, safeArea.y, maxY);
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

function centerInSafeArea(safeArea: ContainerSafeArea, nodeSize: NodeDimensions): XYPosition {
  return {
    x: Math.max(safeArea.x, snapToGrid(safeArea.x + (safeArea.width - nodeSize.width) / 2)),
    y: Math.max(safeArea.y, snapToGrid(safeArea.y + (safeArea.height - nodeSize.height) / 2)),
  };
}

function getLocalNodePosition(
  node: Node | undefined,
  containerNode: Node,
  nodes: Node[]
): XYPosition | null {
  if (!node || node.id === containerNode.id) {
    return null;
  }

  if (node.parentId === containerNode.id) {
    return node.position;
  }

  const containerPosition = getAbsolutePosition(containerNode, nodes);
  const nodePosition = node.parentId ? getAbsolutePosition(node, nodes) : node.position;

  return {
    x: nodePosition.x - containerPosition.x,
    y: nodePosition.y - containerPosition.y,
  };
}

function getPlacementDirection(
  sourcePosition: XYPosition | null,
  targetPosition: XYPosition | null
): 'left' | 'right' | 'top' | 'bottom' {
  if (!sourcePosition || !targetPosition) {
    return sourcePosition ? 'right' : 'left';
  }

  return targetPosition.x >= sourcePosition.x ? 'right' : 'left';
}

function getSiblingNodes(containerId: string, nodes: Node[], insertedNodeId?: string): Node[] {
  return nodes.filter(
    (node) =>
      node.id !== PREVIEW_NODE_ID && node.id !== insertedNodeId && node.parentId === containerId
  );
}

function resolveSequenceTopLeft({
  sourceNode,
  targetNode,
  containerNode,
  nodes,
  safeArea,
  previewNodeSize,
  gap,
  getNodeDimensions,
}: {
  sourceNode?: Node;
  targetNode?: Node;
  containerNode: Node;
  nodes: Node[];
  safeArea: ContainerSafeArea;
  previewNodeSize: NodeDimensions;
  gap: number;
  getNodeDimensions: (node: Node) => NodeDimensions;
}): XYPosition {
  const sourcePosition = getLocalNodePosition(sourceNode, containerNode, nodes);
  const targetPosition = getLocalNodePosition(targetNode, containerNode, nodes);
  const sourceSize = sourceNode ? getNodeDimensions(sourceNode) : undefined;
  const targetSize = targetNode ? getNodeDimensions(targetNode) : undefined;

  if (sourcePosition && sourceSize && targetPosition) {
    const sourceRight = sourcePosition.x + sourceSize.width;
    const targetLeft = targetPosition.x;
    // Use the visual midpoint when there is enough room between the two nodes.
    // If the gap is too small, place after the source and let materialization
    // shift downstream nodes to create the final space.
    const centerX =
      targetLeft - sourceRight >= previewNodeSize.width + gap * 2
        ? sourceRight + (targetLeft - sourceRight) / 2
        : sourceRight + gap + previewNodeSize.width / 2;

    return {
      x: centerX - previewNodeSize.width / 2,
      y: sourcePosition.y + sourceSize.height / 2 - previewNodeSize.height / 2,
    };
  }

  if (sourcePosition && sourceSize) {
    return {
      x: sourcePosition.x + sourceSize.width + gap,
      y: sourcePosition.y + sourceSize.height / 2 - previewNodeSize.height / 2,
    };
  }

  if (targetPosition && targetSize) {
    return {
      x: targetPosition.x - previewNodeSize.width - gap,
      y: targetPosition.y + targetSize.height / 2 - previewNodeSize.height / 2,
    };
  }

  return {
    x: safeArea.x + safeArea.width / 2 - previewNodeSize.width / 2,
    y: safeArea.y + safeArea.height / 2 - previewNodeSize.height / 2,
  };
}

// -----------------------------------------------------------------------------
// Detection
// -----------------------------------------------------------------------------

/**
 * Detects the structural container involved in an edge.
 *
 * This intentionally only uses React Flow parent relationships. Workflow edge
 * kinds and handle names remain consumer-owned.
 */
export function getContainerNodeForEdge(
  sourceNode: Node,
  targetNode: Node,
  nodes: Node[]
): Node | null {
  if (sourceNode.parentId === targetNode.id) {
    return targetNode;
  }

  if (targetNode.parentId === sourceNode.id) {
    return sourceNode;
  }

  if (sourceNode.parentId && sourceNode.parentId === targetNode.parentId) {
    return nodes.find((node) => node.id === sourceNode.parentId)!;
  }

  return null;
}

function handleMatches(edgeHandleId: string | null | undefined, handleId: string): boolean {
  return (edgeHandleId ?? DEFAULT_SOURCE_HANDLE_ID) === handleId;
}

function getOutgoingEdges(sourceNodeId: string, sourceHandleId: string, edges: Edge[]) {
  return edges.filter(
    (edge) =>
      edge.source !== PREVIEW_NODE_ID &&
      edge.target !== PREVIEW_NODE_ID &&
      edge.source === sourceNodeId &&
      handleMatches(edge.sourceHandle, sourceHandleId)
  );
}

function getSingleOutgoingEdge(sourceNodeId: string, sourceHandleId: string, edges: Edge[]) {
  const outgoingEdges = getOutgoingEdges(sourceNodeId, sourceHandleId, edges);
  return outgoingEdges.length === 1 ? outgoingEdges[0] : null;
}

function isPreviewGraphEdge(edge: Edge): boolean {
  return edge.source === PREVIEW_NODE_ID || edge.target === PREVIEW_NODE_ID;
}

function getDefaultNextContainerSequenceNodeId({
  nodeId,
  edges,
  nodesById,
  containerId,
  isSequenceEdge,
}: NextNodeContext & {
  isSequenceEdge?: SequenceEdgePredicate;
}): string | null {
  const localOutgoingEdges = edges.filter((edge) => {
    if (isPreviewGraphEdge(edge) || edge.source !== nodeId) {
      return false;
    }

    if (isSequenceEdge && !isSequenceEdge(edge)) {
      return false;
    }

    const targetNode = nodesById.get(edge.target);
    return edge.target === containerId || targetNode?.parentId === containerId;
  });

  // Ambiguous branches are left untouched because there is no safe linear
  // sequence to shift.
  return localOutgoingEdges.length === 1 ? localOutgoingEdges[0]!.target : null;
}

// -----------------------------------------------------------------------------
// Sequence traversal
// -----------------------------------------------------------------------------

function collectDownstreamNodes({
  targetNodeId,
  containerId,
  nodes,
  edges,
  isSequenceEdge,
  getNextNodeId,
}: {
  targetNodeId: string | undefined;
  containerId: string;
  nodes: Node[];
  edges: Edge[];
  isSequenceEdge?: SequenceEdgePredicate;
  getNextNodeId?: NextNodeResolver;
}): string[] {
  if (!targetNodeId || targetNodeId === containerId) {
    return [];
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const collectedIds: string[] = [];
  const visitedIds = new Set<string>();
  let currentNodeId: string | undefined = targetNodeId;

  // Follow one local sequence chain and stop on cycles or exits from the
  // container. This keeps downstream shifts scoped to the edited sequence.
  while (currentNodeId && !visitedIds.has(currentNodeId)) {
    const currentNode = nodesById.get(currentNodeId);
    if (!currentNode || currentNode.parentId !== containerId) {
      break;
    }

    collectedIds.push(currentNodeId);
    visitedIds.add(currentNodeId);

    const nextNodeId: string | null | undefined =
      getNextNodeId?.({
        nodeId: currentNodeId,
        edges,
        nodesById,
        containerId,
      }) ??
      getDefaultNextContainerSequenceNodeId({
        nodeId: currentNodeId,
        edges,
        nodesById,
        containerId,
        isSequenceEdge,
      });

    if (!nextNodeId || nextNodeId === containerId) {
      break;
    }

    currentNodeId = nextNodeId;
  }

  return collectedIds;
}

// -----------------------------------------------------------------------------
// Preview
// -----------------------------------------------------------------------------

function resolveInsertPreview({
  source,
  sourceHandleType,
  reactFlowInstance,
  isContainerNode,
  getContainerSafeArea,
  previewNodeSize,
  gap,
  getNodeDimensions,
}: ContainerPreviewContext &
  Pick<
    ContainerPreviewOptions,
    'isContainerNode' | 'getContainerSafeArea' | 'previewNodeSize' | 'gap' | 'getNodeDimensions'
  >): PreviewGraphOverrides | null {
  if (sourceHandleType !== 'source' || !source.handleId) {
    return null;
  }

  const replacedEdge = getSingleOutgoingEdge(
    source.nodeId,
    source.handleId,
    reactFlowInstance.getEdges()
  );

  if (!replacedEdge) {
    return null;
  }

  const sourceNode = reactFlowInstance.getNode(replacedEdge.source)!;
  const targetNode = reactFlowInstance.getNode(replacedEdge.target)!;
  const nodes = reactFlowInstance.getNodes();

  const containerNode = getContainerNodeForEdge(sourceNode, targetNode, nodes);
  if (!containerNode) {
    return null;
  }
  if (isContainerNode && !isContainerNode(containerNode)) {
    return null;
  }

  const containerPlacement = getPreviewPlacement({
    sourceNode,
    targetNode,
    containerNode,
    nodes,
    safeArea: getContainerSafeArea?.(containerNode),
    previewNodeSize,
    gap,
    getNodeDimensions,
  });
  const placement: ContainerPlacement = {
    containerId: containerPlacement.containerId,
    sourceNodeId: sourceNode.id,
    targetNodeId: targetNode.id,
    mode: 'sequence',
  };

  return {
    position: containerPlacement.centerPosition,
    positionMode: 'center',
    // Store the replaced edge so the preview graph can hide exactly that edge
    // while preserving enough data for Add Node to reconnect through the node.
    data: { originalEdge: replacedEdge, [PLACEMENT_DATA_KEY]: placement },
    target: {
      nodeId: replacedEdge.target,
      handleId: replacedEdge.targetHandle,
    },
    containerId: containerPlacement.containerId,
  };
}

function resolveAppendPreview({
  source,
  sourceHandleType,
  reactFlowInstance,
  ...options
}: ContainerPreviewContext & ContainerPreviewOptions): PreviewGraphOverrides | null {
  if (sourceHandleType !== 'source' || !source.handleId) {
    return null;
  }

  const sourceNode = reactFlowInstance.getNode(source.nodeId);
  if (!sourceNode?.parentId) {
    return null;
  }

  const outgoingEdges = getOutgoingEdges(
    source.nodeId,
    source.handleId,
    reactFlowInstance.getEdges()
  );
  if (outgoingEdges.length > 0) {
    return null;
  }

  const nodes = reactFlowInstance.getNodes();
  const containerNode = nodes.find((node) => node.id === sourceNode.parentId)!;
  if (options.isContainerNode && !options.isContainerNode(containerNode)) {
    return null;
  }

  const continuationTarget = options.getContainerContinuationTarget?.({
    containerNode,
    sourceNode,
    source,
    reactFlowInstance,
  });
  if (!continuationTarget) {
    return null;
  }

  const targetNode =
    continuationTarget.nodeId === containerNode.id
      ? containerNode
      : reactFlowInstance.getNode(continuationTarget.nodeId);
  const containerPlacement = getPreviewPlacement({
    sourceNode,
    targetNode,
    containerNode,
    nodes,
    safeArea: options.getContainerSafeArea?.(containerNode),
    previewNodeSize: options.previewNodeSize,
    gap: options.gap,
    avoidSiblings: options.avoidSiblings ?? true,
    getNodeDimensions: options.getNodeDimensions,
  });
  const placement: ContainerPlacement = {
    containerId: containerPlacement.containerId,
    sourceNodeId: sourceNode.id,
    targetNodeId: continuationTarget.nodeId,
    mode: 'sequence',
  };

  return {
    position: containerPlacement.centerPosition,
    positionMode: 'center',
    data: { [PLACEMENT_DATA_KEY]: placement },
    target: continuationTarget,
    containerId: containerPlacement.containerId,
  };
}

/**
 * Builds preview-graph overrides when adding a node inside or through a
 * container sequence. The caller owns manifest-specific checks and continuation
 * handle selection through the options callbacks.
 */
export function resolveContainerPreview({
  source,
  sourceHandleType,
  reactFlowInstance,
  ...options
}: ContainerPreviewContext & ContainerPreviewOptions): PreviewGraphOverrides | null {
  // Container previews handle two cases:
  // 1. insert: replace an existing edge inside/through a container
  // 2. append: continue from a child node to the container's inner target handle
  return (
    resolveInsertPreview({
      source,
      sourceHandleType,
      reactFlowInstance,
      ...options,
    }) ??
    resolveAppendPreview({
      source,
      sourceHandleType,
      reactFlowInstance,
      ...options,
    })
  );
}

// -----------------------------------------------------------------------------
// Preview placement
// -----------------------------------------------------------------------------

/**
 * Computes an absolute center point for previewing a node in a container
 * sequence. The returned center can be passed to `showPreviewGraph` with
 * `positionMode: 'center'` and `containerId`.
 */
function getPreviewPlacement({
  sourceNode,
  targetNode,
  containerNode,
  nodes,
  containerAbsolutePosition = getAbsolutePosition(containerNode, nodes),
  safeArea,
  previewNodeSize = { width: DEFAULT_NODE_SIZE, height: DEFAULT_NODE_SIZE },
  gap = CONTAINER_SEQUENCE_GAP_PX,
  avoidSiblings = false,
  getNodeDimensions: resolveNodeDimensions = getNodeDimensions,
}: {
  sourceNode?: Node;
  targetNode?: Node;
  containerNode: Node;
  nodes: Node[];
  containerAbsolutePosition?: XYPosition;
  safeArea?: ContainerSafeArea;
  previewNodeSize?: NodeDimensions;
  gap?: number;
  avoidSiblings?: boolean;
  getNodeDimensions?: (node: Node) => NodeDimensions;
}): PreviewPlacement {
  const resolvedSafeArea = getSafeArea(containerNode, safeArea);
  const sourcePosition = getLocalNodePosition(sourceNode, containerNode, nodes);
  const targetPosition = getLocalNodePosition(targetNode, containerNode, nodes);
  const direction = getPlacementDirection(sourcePosition, targetPosition);
  const initialPosition = resolveSequenceTopLeft({
    sourceNode,
    targetNode,
    containerNode,
    nodes,
    safeArea: resolvedSafeArea,
    previewNodeSize,
    gap,
    getNodeDimensions: resolveNodeDimensions,
  });
  const collisionPosition = avoidSiblings
    ? getNonOverlappingPositionForDirection(
        getSiblingNodes(containerNode.id, nodes),
        initialPosition,
        previewNodeSize,
        direction,
        gap
      )
    : initialPosition;
  const position = clampTopLeftToSafeArea(collisionPosition, resolvedSafeArea, previewNodeSize);

  return {
    containerId: containerNode.id,
    centerPosition: {
      x: containerAbsolutePosition.x + position.x + previewNodeSize.width / 2,
      y: containerAbsolutePosition.y + position.y + previewNodeSize.height / 2,
    },
  };
}

// -----------------------------------------------------------------------------
// Materialized placement
// -----------------------------------------------------------------------------

function getNodeCenterY(position: XYPosition, nodeSize: NodeDimensions): number {
  return position.y + nodeSize.height / 2;
}

function getInsertedPosition({
  sourceNode,
  targetNode,
  insertedNode,
  containerNode,
  nodes,
  safeArea,
  insertedNodeSize,
  gap,
  getNodeDimensions,
}: {
  sourceNode?: Node;
  targetNode?: Node;
  insertedNode: Node;
  containerNode: Node;
  nodes: Node[];
  safeArea: ContainerSafeArea;
  insertedNodeSize: NodeDimensions;
  gap: number;
  getNodeDimensions: (node: Node) => NodeDimensions;
}): XYPosition {
  const sourcePosition = getLocalNodePosition(sourceNode, containerNode, nodes);
  const targetPosition = getLocalNodePosition(targetNode, containerNode, nodes);
  const sourceSize = sourceNode ? getNodeDimensions(sourceNode) : undefined;
  const targetSize = targetNode ? getNodeDimensions(targetNode) : undefined;
  const sourceIsContainer = sourceNode?.id === containerNode.id;
  const targetIsContainer = targetNode?.id === containerNode.id;

  if (sourcePosition && sourceSize && !sourceIsContainer) {
    return {
      x: Math.max(safeArea.x, snapToGrid(sourcePosition.x + sourceSize.width + gap)),
      y: clampTopToSafeArea(
        snapToGrid(getNodeCenterY(sourcePosition, sourceSize) - insertedNodeSize.height / 2),
        safeArea,
        insertedNodeSize
      ),
    };
  }

  if (targetPosition && targetSize && !targetIsContainer) {
    return {
      x: Math.max(safeArea.x, snapToGrid(targetPosition.x - insertedNodeSize.width - gap)),
      y: clampTopToSafeArea(
        snapToGrid(getNodeCenterY(targetPosition, targetSize) - insertedNodeSize.height / 2),
        safeArea,
        insertedNodeSize
      ),
    };
  }

  return {
    x: Math.max(safeArea.x, snapToGrid(insertedNode.position.x)),
    y: clampTopToSafeArea(snapToGrid(insertedNode.position.y), safeArea, insertedNodeSize),
  };
}

function getNodeDepth(node: Node | undefined, nodesById: Map<string, Node>): number {
  let depth = 0;
  let parentId = node?.parentId;

  while (parentId) {
    depth += 1;
    parentId = nodesById.get(parentId)?.parentId;
  }

  return depth;
}

function sortContainerSizeChanges(
  changes: ContainerSizeChange[],
  nodes: Node[]
): ContainerSizeChange[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  // Inner containers move first so ancestor and sibling pushes see their final
  // width before deciding how much room is required.
  return [...changes].sort((left, right) => {
    const leftNode = nodesById.get(left.containerId)!;
    const rightNode = nodesById.get(right.containerId)!;
    const depthDifference = getNodeDepth(rightNode, nodesById) - getNodeDepth(leftNode, nodesById);

    if (depthDifference !== 0) {
      return depthDifference;
    }

    if (leftNode.parentId === rightNode.parentId) {
      return leftNode.position.x - rightNode.position.x;
    }

    return 0;
  });
}

function pushSiblingsAfterContainerGrowth({
  nodes,
  changes,
  getNodeDimensions,
  gap,
}: {
  nodes: Node[];
  changes: ContainerSizeChange[];
  getNodeDimensions: (node: Node) => NodeDimensions;
  gap: number;
}): { nodes: Node[]; shifted: boolean } {
  let shifted = false;
  let nextNodes = nodes;

  for (const change of sortContainerSizeChanges(changes, nextNodes)) {
    const widthDelta = change.nextSize.width - change.previousSize.width;
    if (widthDelta <= 0) {
      continue;
    }

    const containerNode = nextNodes.find((node) => node.id === change.containerId)!;

    const oldRight = containerNode.position.x + change.previousSize.width;
    const newRight = containerNode.position.x + change.nextSize.width;
    const containerTop = containerNode.position.y;
    const containerBottom =
      containerNode.position.y + Math.max(change.previousSize.height, change.nextSize.height);

    nextNodes = nextNodes.map((node) => {
      if (node.id === containerNode.id || node.parentId !== containerNode.parentId) {
        return node;
      }

      const nodeSize = getNodeDimensions(node);
      const isRightSibling = node.position.x >= oldRight;
      // Only siblings that sit to the right and overlap the container's vertical
      // band can be visually covered by the new width.
      const verticallyOverlaps = rangesOverlap(
        node.position.y,
        node.position.y + nodeSize.height,
        containerTop,
        containerBottom
      );

      if (!isRightSibling || !verticallyOverlaps) {
        return node;
      }

      const nextX = Math.max(node.position.x + widthDelta, snapUpToGrid(newRight + gap));
      if (nextX === node.position.x) {
        return node;
      }

      shifted = true;
      return {
        ...node,
        position: {
          ...node.position,
          x: nextX,
        },
      };
    });
  }

  return { nodes: nextNodes, shifted };
}

function fitContainersAndPushSiblings({
  nodes,
  containerIds,
  getContainerFitGeometry,
  getNodeDimensions,
  gap,
}: {
  nodes: Node[];
  containerIds: Iterable<string>;
  getContainerFitGeometry: (containerNode: Node) => ContainerFitGeometry | null | undefined;
  getNodeDimensions: (node: Node) => NodeDimensions;
  gap: number;
}): Node[] {
  let nextNodes = nodes;

  // Growth can push a sibling container, which may force an ancestor to grow as
  // well. Iterate until the graph stabilizes, with a small cap for malformed
  // layouts.
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const fitResult = ensureContainersFitChildren(nextNodes, {
      containerIds,
      getContainerFitGeometry,
      getNodeDimensions,
      includeAncestors: true,
    });

    nextNodes = fitResult.nodes;
    if (fitResult.changes.length === 0) {
      return nextNodes;
    }

    const pushResult = pushSiblingsAfterContainerGrowth({
      nodes: nextNodes,
      changes: fitResult.changes,
      getNodeDimensions,
      gap,
    });

    nextNodes = pushResult.nodes;
    if (!pushResult.shifted) {
      return nextNodes;
    }
  }

  return nextNodes;
}

/**
 * Reads and validates container placement metadata from a preview node.
 * Returns null when the preview is not scoped to the recorded container.
 */
export function getContainerPlacement({
  previewNode,
  isContainerId,
}: {
  previewNode: Pick<Node, 'data' | 'parentId'>;
  isContainerId?: (containerId: string) => boolean;
}): ContainerPlacement | null {
  const placement = previewNode.data?.[PLACEMENT_DATA_KEY] as ContainerPlacement | undefined;
  if (!placement) {
    return null;
  }

  if (previewNode.parentId && placement.containerId !== previewNode.parentId) {
    return null;
  }

  return isContainerId && !isContainerId(placement.containerId) ? null : placement;
}

/**
 * Materializes an inserted node from container placement metadata, shifts the
 * downstream sequence when necessary, then expands affected containers and
 * pushes overlapping siblings out of the way.
 */
export function placeContainerNode({
  nodes,
  insertedNode,
  placement,
  safeArea,
  getContainerFitGeometry: resolveContainerFitGeometry = getContainerFitGeometry,
  getNodeDimensions: resolveNodeDimensions = getNodeDimensions,
  gap = CONTAINER_SEQUENCE_GAP_PX,
  downstreamNodeIds,
  edges,
}: {
  nodes: Node[];
  insertedNode: Node;
  placement: ContainerPlacement;
  safeArea?: ContainerSafeArea;
  getContainerFitGeometry?: (containerNode: Node) => ContainerFitGeometry | null | undefined;
  getNodeDimensions?: (node: Node) => NodeDimensions;
  gap?: number;
  downstreamNodeIds?: Iterable<string>;
  edges?: Edge[];
}): Node[] {
  const containerNode = nodes.find((node) => node.id === placement.containerId)!;

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const insertedSize = resolveNodeDimensions(insertedNode);
  const resolvedSafeArea = getSafeArea(containerNode, safeArea);
  const positionedNode =
    placement.mode === 'first-child'
      ? {
          ...insertedNode,
          position: centerInSafeArea(resolvedSafeArea, insertedSize),
        }
      : {
          ...insertedNode,
          position: getInsertedPosition({
            sourceNode: placement.sourceNodeId ? nodesById.get(placement.sourceNodeId) : undefined,
            targetNode: placement.targetNodeId ? nodesById.get(placement.targetNodeId) : undefined,
            insertedNode,
            containerNode,
            nodes,
            safeArea: resolvedSafeArea,
            insertedNodeSize: insertedSize,
            gap,
            getNodeDimensions: resolveNodeDimensions,
          }),
        };
  const targetNode =
    placement.targetNodeId && placement.targetNodeId !== placement.containerId
      ? nodesById.get(placement.targetNodeId)
      : undefined;
  const fallbackTargetIds =
    placement.targetNodeId && placement.targetNodeId !== placement.containerId
      ? [placement.targetNodeId]
      : [];
  const idsToShift = new Set(
    downstreamNodeIds ??
      (edges
        ? collectDownstreamNodes({
            targetNodeId: placement.targetNodeId,
            containerId: placement.containerId,
            nodes,
            edges,
          })
        : fallbackTargetIds)
  );
  const requiredTargetLeft = positionedNode.position.x + insertedSize.width + gap;
  const downstreamShift =
    targetNode && targetNode.position.x < requiredTargetLeft
      ? snapUpToGrid(requiredTargetLeft - targetNode.position.x)
      : 0;
  const positionedNodes = nodes.map((node) => {
    if (node.id === insertedNode.id) return positionedNode;
    if (downstreamShift > 0 && idsToShift.has(node.id)) {
      return {
        ...node,
        position: {
          ...node.position,
          x: node.position.x + downstreamShift,
        },
      };
    }

    return node;
  });

  return fitContainersAndPushSiblings({
    nodes: positionedNodes,
    containerIds: [placement.containerId],
    getContainerFitGeometry: resolveContainerFitGeometry,
    getNodeDimensions: resolveNodeDimensions,
    gap,
  });
}
