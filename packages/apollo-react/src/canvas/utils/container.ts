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
 * Leading padding shifts children into the safe area before size is computed;
 * trailing padding reserves room after the children.
 */
export interface ContainerFitGeometry {
  minWidth: number;
  minHeight: number;
  padding?: {
    left?: number;
    right?: number;
    top?: number;
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

export interface ContainerSafeAreaBuffer {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ContainerSafeAreaOptions {
  buffer?: Partial<ContainerSafeAreaBuffer>;
}

export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Records a single container resize caused by fitting children. */
export interface ContainerSizeChange {
  containerId: string;
  previousSize: NodeDimensions;
  nextSize: NodeDimensions;
  /**
   * Signed canvas-space delta `newPosition - oldPosition` applied to the
   * container's own `position`. Non-zero when leading-edge growth shifted
   * the container's top-left outward so children stay put in canvas.
   * Consumers reconstructing the pre-shift rect compute it as
   * `oldPosition = currentPosition - positionDelta`.
   */
  positionDelta?: { x: number; y: number };
}

/** Side-specific minimum sizes that prevent manual container resizing from clipping children. */
export interface ContainerResizeMinimums {
  left: number;
  right: number;
  top: number;
  bottom: number;
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
  allowedContainerId?: string;
  replacedEdge?: Edge;
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
  /**
   * Parent ID for the chain's scope. Sibling nodes share this parentId.
   * Undefined for top-level (root) scope, or set to a container's id when
   * walking children of that container.
   */
  parentId: string | undefined;
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
const DEFAULT_CONTAINER_SAFE_AREA_BUFFER: ContainerSafeAreaBuffer = {
  left:
    CONTAINER_BODY_PADDING_PX + CONTAINER_INNER_HANDLE_RAIL_WIDTH_PX + CONTAINER_CHILD_SAFE_GAP_PX,
  right:
    CONTAINER_BODY_PADDING_PX + CONTAINER_INNER_HANDLE_RAIL_WIDTH_PX + CONTAINER_CHILD_SAFE_GAP_PX,
  top: CONTAINER_BODY_PADDING_PX,
  bottom: CONTAINER_BODY_PADDING_PX,
};
const CONTAINER_BOUNDARY_SAFE_AREA_BUFFER: ContainerSafeAreaBuffer = {
  left: CONTAINER_BODY_PADDING_PX,
  right: CONTAINER_BODY_PADDING_PX,
  top: GRID_SPACING,
  bottom: CONTAINER_BODY_PADDING_PX,
};

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
  fallback: NodeDimensions = { width: DEFAULT_CONTAINER_WIDTH, height: DEFAULT_CONTAINER_HEIGHT },
  options: ContainerSafeAreaOptions = {}
): ContainerSafeArea {
  const size = getNodeDimensions(containerNode, fallback);
  const buffer = {
    ...DEFAULT_CONTAINER_SAFE_AREA_BUFFER,
    ...options.buffer,
  };
  const padding = {
    left: snapUpToGrid(CONTAINER_FRAME_INSET_PX + buffer.left),
    right: snapUpToGrid(CONTAINER_FRAME_INSET_PX + buffer.right),
    top: snapUpToGrid(DEFAULT_CONTAINER_HEADER_HEIGHT_PX + CONTAINER_FRAME_INSET_PX + buffer.top),
    bottom: snapUpToGrid(CONTAINER_FRAME_INSET_PX + buffer.bottom),
  };

  return {
    x: padding.left,
    y: padding.top,
    width: Math.max(0, size.width - padding.left - padding.right),
    height: Math.max(0, size.height - padding.top - padding.bottom),
    padding,
  };
}

/** Returns whether a local child rect is fully inside the container boundary safe area. */
export function isRectInsideContainerSafeArea(
  rect: RectLike,
  containerNode: Pick<Node, 'width' | 'height' | 'measured' | 'style'>
): boolean {
  const safeArea = getContainerSafeArea(containerNode, undefined, {
    buffer: CONTAINER_BOUNDARY_SAFE_AREA_BUFFER,
  });

  return (
    rect.x >= safeArea.x &&
    rect.y >= safeArea.y &&
    rect.x + rect.width <= safeArea.x + safeArea.width &&
    rect.y + rect.height <= safeArea.y + safeArea.height
  );
}

/**
 * Default fit rules for loop/container nodes. `minWidth`/`minHeight` are the
 * intrinsic default footprint (what a fresh empty container renders at), so
 * auto-fit and tidy don't shrink past the empty-state size. The absolute
 * resize floor (`DEFAULT_CONTAINER_MIN_*`) is enforced by `getContainerResizeMinimums`.
 */
export function getContainerFitGeometry(): ContainerFitGeometry {
  const padding = getContainerSafeArea({
    width: DEFAULT_CONTAINER_WIDTH,
    height: DEFAULT_CONTAINER_HEIGHT,
  }).padding!;

  return {
    minWidth: DEFAULT_CONTAINER_WIDTH,
    minHeight: DEFAULT_CONTAINER_HEIGHT,
    padding,
  };
}

function resolveResizeMinimum(minSize: number, currentSize: number, requiredSize: number): number {
  const requiredMinimum = Math.max(minSize, snapUpToGrid(requiredSize));
  const currentResizeFloor = Math.max(minSize, currentSize);
  return Math.min(currentResizeFloor, requiredMinimum);
}

/** Returns side-specific minimum sizes for shrinking a container around visible direct children. */
export function getContainerResizeMinimums(
  containerNode: Pick<Node, 'id' | 'width' | 'height' | 'measured' | 'style'>,
  nodes: Node[],
  {
    minWidth = DEFAULT_CONTAINER_MIN_WIDTH,
    minHeight = DEFAULT_CONTAINER_MIN_HEIGHT,
    ignoredNodeTypes = [],
  }: {
    minWidth?: number;
    minHeight?: number;
    ignoredNodeTypes?: string[];
  } = {}
): ContainerResizeMinimums {
  const currentSize = getNodeDimensions(containerNode, {
    width: DEFAULT_CONTAINER_WIDTH,
    height: DEFAULT_CONTAINER_HEIGHT,
  });
  const padding = getContainerSafeArea(containerNode, currentSize).padding ?? {};
  const ignoredTypes = new Set(ignoredNodeTypes);
  let childBounds: { left: number; right: number; top: number; bottom: number } | undefined;

  for (const childNode of nodes) {
    if (
      childNode.id === PREVIEW_NODE_ID ||
      childNode.hidden ||
      childNode.parentId !== containerNode.id ||
      ignoredTypes.has(childNode.type ?? '')
    ) {
      continue;
    }

    const childSize = getNodeDimensions(childNode);
    const nextBounds = {
      left: childNode.position.x,
      right: childNode.position.x + childSize.width,
      top: childNode.position.y,
      bottom: childNode.position.y + childSize.height,
    };

    childBounds = childBounds
      ? {
          left: Math.min(childBounds.left, nextBounds.left),
          right: Math.max(childBounds.right, nextBounds.right),
          top: Math.min(childBounds.top, nextBounds.top),
          bottom: Math.max(childBounds.bottom, nextBounds.bottom),
        }
      : nextBounds;
  }

  if (!childBounds) {
    return {
      left: minWidth,
      right: minWidth,
      top: minHeight,
      bottom: minHeight,
    };
  }

  const leftEdgeLimit = currentSize.width - childBounds.left + (padding.left ?? 0);
  const topEdgeLimit = currentSize.height - childBounds.top + (padding.top ?? 0);
  const rightEdgeLimit = childBounds.right + (padding.right ?? 0);
  const bottomEdgeLimit = childBounds.bottom + (padding.bottom ?? 0);

  return {
    left: resolveResizeMinimum(minWidth, currentSize.width, leftEdgeLimit),
    right: resolveResizeMinimum(minWidth, currentSize.width, rightEdgeLimit),
    top: resolveResizeMinimum(minHeight, currentSize.height, topEdgeLimit),
    bottom: resolveResizeMinimum(minHeight, currentSize.height, bottomEdgeLimit),
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
    const containerNode = nextNodes.find((node) => node.id === containerId);
    if (!containerNode) continue;

    const geometry = resolveContainerFitGeometry?.(containerNode);
    if (!geometry) continue;

    const currentSize = resolveNodeDimensions(containerNode);
    const padding = geometry.padding ?? {};
    let requiredWidth = geometry.minWidth;
    let requiredHeight = geometry.minHeight;
    let leadingShiftX = 0;
    let leadingShiftY = 0;
    const childrenToFit: Array<{ node: Node; size: NodeDimensions }> = [];
    const childIdsToShift = new Set<string>();

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
      childrenToFit.push({ node: childNode, size: childSize });
      childIdsToShift.add(childNode.id);

      if (padding.left !== undefined) {
        leadingShiftX = Math.max(leadingShiftX, padding.left - childNode.position.x);
      }
      if (padding.top !== undefined) {
        leadingShiftY = Math.max(leadingShiftY, padding.top - childNode.position.y);
      }
    }

    leadingShiftX = leadingShiftX > 0 ? snapUpToGrid(leadingShiftX) : 0;
    leadingShiftY = leadingShiftY > 0 ? snapUpToGrid(leadingShiftY) : 0;

    for (const { node: childNode, size: childSize } of childrenToFit) {
      requiredWidth = Math.max(
        requiredWidth,
        childNode.position.x + leadingShiftX + childSize.width + (padding.right ?? 0)
      );
      requiredHeight = Math.max(
        requiredHeight,
        childNode.position.y + leadingShiftY + childSize.height + (padding.bottom ?? 0)
      );
    }

    requiredWidth = Math.max(requiredWidth, currentSize.width + leadingShiftX);
    requiredHeight = Math.max(requiredHeight, currentSize.height + leadingShiftY);

    const nextSize = {
      width: Math.max(currentSize.width, snapUpToGrid(requiredWidth)),
      height: Math.max(currentSize.height, snapUpToGrid(requiredHeight)),
    };

    if (
      nextSize.width === currentSize.width &&
      nextSize.height === currentSize.height &&
      leadingShiftX === 0 &&
      leadingShiftY === 0
    ) {
      continue;
    }

    const shouldShiftChildren = leadingShiftX !== 0 || leadingShiftY !== 0;

    nextNodes = nextNodes.map((node) => {
      if (node.id === containerId) {
        const resized = withNodeDimensions(node, nextSize);
        if (!shouldShiftChildren) return resized;
        // Grow the container in the leading direction by also moving its own
        // top-left outward, while children's local positions shift inward by
        // the same amount. Net canvas-space movement of every child is zero —
        // visually the container's top/left edge expands and the children
        // stay put, instead of children appearing to jump down/right.
        return {
          ...resized,
          position: {
            x: (node.position?.x ?? 0) - leadingShiftX,
            y: (node.position?.y ?? 0) - leadingShiftY,
          },
        };
      }

      if (shouldShiftChildren && childIdsToShift.has(node.id)) {
        return {
          ...node,
          position: {
            x: node.position.x + leadingShiftX,
            y: node.position.y + leadingShiftY,
          },
        };
      }

      return node;
    });
    nodesById.set(containerId, nextNodes.find((node) => node.id === containerId)!);
    // Emit a change record whenever size OR position moved — `fitContainersAndPushSiblings`
    // uses `changes.length === 0` as an early-out, and `pushSiblingsAfterContainerGrowth`
    // needs `positionDelta` to reconstruct the pre-shift rect when computing oldRight/oldBottom.
    const sizeChanged =
      nextSize.width !== currentSize.width || nextSize.height !== currentSize.height;
    if (sizeChanged || shouldShiftChildren) {
      changes.push({
        containerId,
        previousSize: currentSize,
        nextSize,
        positionDelta: shouldShiftChildren ? { x: -leadingShiftX, y: -leadingShiftY } : undefined,
      });
    }
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

function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

/**
 * Centers a child horizontally inside the container's body but vertically on
 * the container's geometric mid-line, so the child sits on the same rail as
 * the inner source handle (which renders at `top: 50%` of the container).
 * Falls back to `safeArea.y` when the container is too short for the rail
 * placement to fit inside the body.
 */
function centerOnContainerRail(
  containerSize: NodeDimensions,
  safeArea: ContainerSafeArea,
  nodeSize: NodeDimensions
): XYPosition {
  const railY = snapToGrid(containerSize.height / 2 - nodeSize.height / 2);
  const maxY = safeArea.y + Math.max(0, safeArea.height - nodeSize.height);
  return {
    x: Math.max(safeArea.x, snapToGrid(safeArea.x + (safeArea.width - nodeSize.width) / 2)),
    y: clamp(railY, safeArea.y, maxY),
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
    return nodes.find((node) => node.id === sourceNode.parentId) ?? null;
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

// -----------------------------------------------------------------------------
// Sequence traversal
// -----------------------------------------------------------------------------

/**
 * Pre-buckets non-preview edges by source for O(1) chain-step lookup.
 *
 * Edges are kept when their target is a sibling in the chain's scope (matching
 * `parentId`) or, when `parentId` is a string, the parent itself — this lets
 * container-internal chains terminate cleanly when a child wires back to its
 * container's continue handle.
 */
function bucketInScopeEdgesBySource({
  edges,
  nodesById,
  parentId,
  isSequenceEdge,
}: {
  edges: Edge[];
  nodesById: Map<string, Node>;
  parentId: string | undefined;
  isSequenceEdge?: SequenceEdgePredicate;
}): Map<string, Edge[]> {
  const bySource = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (isPreviewGraphEdge(edge)) continue;
    if (isSequenceEdge && !isSequenceEdge(edge)) continue;

    const targetIsParent = parentId !== undefined && edge.target === parentId;
    const targetIsSibling = nodesById.get(edge.target)?.parentId === parentId;
    if (!targetIsParent && !targetIsSibling) continue;

    const bucket = bySource.get(edge.source);
    if (bucket) {
      bucket.push(edge);
    } else {
      bySource.set(edge.source, [edge]);
    }
  }
  return bySource;
}

/**
 * Walks one linear sibling chain downstream from `startNodeId`, following
 * single in-scope outgoing edges. Used to find the set of nodes that should
 * rigidly shift right when a wider node is inserted upstream.
 *
 * Scope is set by `parentId`:
 *   - `undefined` → top-level (root) chain.
 *   - container id → walk children of that container; an edge from a child
 *     back to the container itself counts as in-scope (so an exact-1 outgoing
 *     match on a loop-back terminates the walk cleanly).
 *
 * Stop conditions: cycles, the current node leaving `parentId` scope, dead
 * ends, in-scope branches (>1 outgoing), and (for container scope) an edge
 * that would walk into the container itself.
 *
 * Edges leaving the parent scope without targeting it are ignored entirely —
 * they are not siblings, so they do not need to shift.
 */
export function collectLinearDownstreamSiblings({
  startNodeId,
  parentId,
  nodes,
  edges,
  isSequenceEdge,
  getNextNodeId,
}: {
  startNodeId: string | undefined;
  parentId: string | undefined;
  nodes: Node[];
  edges: Edge[];
  isSequenceEdge?: SequenceEdgePredicate;
  getNextNodeId?: NextNodeResolver;
}): string[] {
  if (!startNodeId || startNodeId === parentId) return [];

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const inScopeEdgesBySource = bucketInScopeEdgesBySource({
    edges,
    nodesById,
    parentId,
    isSequenceEdge,
  });

  const collectedIds: string[] = [];
  const visitedIds = new Set<string>();
  let currentNodeId: string = startNodeId;

  while (!visitedIds.has(currentNodeId)) {
    const currentNode = nodesById.get(currentNodeId);
    if (!currentNode || currentNode.parentId !== parentId) break;

    collectedIds.push(currentNodeId);
    visitedIds.add(currentNodeId);

    let next: string | null | undefined = getNextNodeId
      ? getNextNodeId({
          nodeId: currentNodeId,
          edges,
          nodesById,
          parentId,
        })
      : undefined;
    if (next === undefined) {
      const outgoing: Edge[] = inScopeEdgesBySource.get(currentNodeId) ?? [];
      next = outgoing.length === 1 ? outgoing[0]!.target : null;
    }

    // Container-scope walks terminate when the next step would re-enter the
    // parent itself (a child wiring back to the container).
    if (!next || next === parentId) break;
    currentNodeId = next;
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
  allowedContainerId,
  replacedEdge: exactReplacedEdge,
  getContainerSafeArea,
  previewNodeSize,
  gap,
  getNodeDimensions,
}: ContainerPreviewContext &
  Pick<
    ContainerPreviewOptions,
    | 'isContainerNode'
    | 'allowedContainerId'
    | 'replacedEdge'
    | 'getContainerSafeArea'
    | 'previewNodeSize'
    | 'gap'
    | 'getNodeDimensions'
  >): PreviewGraphOverrides | null {
  if (sourceHandleType !== 'source' || !source.handleId) {
    return null;
  }

  const replacedEdge =
    exactReplacedEdge ??
    getSingleOutgoingEdge(source.nodeId, source.handleId, reactFlowInstance.getEdges());

  if (!replacedEdge) {
    return null;
  }

  const sourceNode = reactFlowInstance.getNode(replacedEdge.source);
  const targetNode = reactFlowInstance.getNode(replacedEdge.target);
  if (!sourceNode || !targetNode) {
    return null;
  }
  const nodes = reactFlowInstance.getNodes();

  const containerNode = getContainerNodeForEdge(sourceNode, targetNode, nodes);
  if (!containerNode) {
    return null;
  }
  if (allowedContainerId && containerNode.id !== allowedContainerId) {
    return null;
  }
  if (isContainerNode && !isContainerNode(containerNode)) {
    return null;
  }

  // For an edge insertion, place the preview between source and target —
  // `calculateAutoPosition`'s overlap avoidance would shove it off the chain.
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
  if (options.allowedContainerId && containerNode.id !== options.allowedContainerId) {
    return null;
  }
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

  const placement: ContainerPlacement = {
    containerId: containerNode.id,
    sourceNodeId: sourceNode.id,
    targetNodeId: continuationTarget.nodeId,
    mode: 'sequence',
  };

  // No `position`/`positionMode` → `createPreviewNode` runs `calculateAutoPosition`,
  // which anchors on the clicked handle and applies `computeSpreadOffset` for
  // multi-output sources (Decision True/False). This is the same logic used
  // for non-container previews; `reparentPreviewNodeToContainer` then converts
  // to container-local coords and `placeContainerNode` (on materialize) grows
  // the container via `fitContainersAndPushSiblings`.
  return {
    data: { [PLACEMENT_DATA_KEY]: placement },
    target: continuationTarget,
    containerId: containerNode.id,
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

  // For each container that grew, push siblings outward — right when width
  // grew, down when height grew. Both directions are evaluated in the same
  // pass so a sibling that's both right-of and below-of a doubly-growing
  // container is visited once.
  for (const change of sortContainerSizeChanges(changes, nextNodes)) {
    const containerNode = nextNodes.find((node) => node.id === change.containerId)!;
    // When leading-edge growth was applied, `containerNode.position` has already
    // moved outward by `positionDelta`. Reconstruct the pre-shift position so
    // `oldRight/oldBottom` reflect the rect siblings actually saw before this fit.
    const positionDelta = change.positionDelta ?? { x: 0, y: 0 };
    const prevPosition = {
      x: containerNode.position.x - positionDelta.x,
      y: containerNode.position.y - positionDelta.y,
    };
    const oldRight = prevPosition.x + change.previousSize.width;
    const newRight = containerNode.position.x + change.nextSize.width;
    const oldBottom = prevPosition.y + change.previousSize.height;
    const newBottom = containerNode.position.y + change.nextSize.height;
    // Use edge deltas (not size deltas) so leading-only growth — where
    // position moves outward and size grows by the same amount, leaving
    // newRight === oldRight — doesn't push right/bottom siblings unnecessarily.
    const rightDelta = newRight - oldRight;
    const bottomDelta = newBottom - oldBottom;
    if (rightDelta <= 0 && bottomDelta <= 0) continue;
    const containerLeft = Math.min(containerNode.position.x, prevPosition.x);
    const containerRight = Math.max(newRight, oldRight);
    const containerTop = Math.min(containerNode.position.y, prevPosition.y);
    const containerBottom = Math.max(newBottom, oldBottom);

    nextNodes = nextNodes.map((node) => {
      if (node.id === containerNode.id || node.parentId !== containerNode.parentId) {
        return node;
      }

      const nodeSize = getNodeDimensions(node);
      let nextX = node.position.x;
      let nextY = node.position.y;

      // Right edge advanced: only siblings that sit to the right and overlap
      // the container's vertical band can be visually covered.
      if (rightDelta > 0 && node.position.x >= oldRight) {
        const verticallyOverlaps = rangesOverlap(
          node.position.y,
          node.position.y + nodeSize.height,
          containerTop,
          containerBottom
        );
        if (verticallyOverlaps) {
          nextX = Math.max(node.position.x + rightDelta, snapUpToGrid(newRight + gap));
        }
      }

      // Bottom edge advanced: mirror logic along Y.
      if (bottomDelta > 0 && node.position.y >= oldBottom) {
        const horizontallyOverlaps = rangesOverlap(
          node.position.x,
          node.position.x + nodeSize.width,
          containerLeft,
          containerRight
        );
        if (horizontallyOverlaps) {
          nextY = Math.max(node.position.y + bottomDelta, snapUpToGrid(newBottom + gap));
        }
      }

      if (nextX === node.position.x && nextY === node.position.y) return node;
      shifted = true;
      return {
        ...node,
        position: { x: nextX, y: nextY },
      };
    });
  }

  return { nodes: nextNodes, shifted };
}

export function fitContainersAndPushSiblings({
  nodes,
  containerIds,
  getContainerFitGeometry,
  getNodeDimensions,
  ignoredNodeTypes,
  gap,
}: {
  nodes: Node[];
  containerIds: Iterable<string>;
  getContainerFitGeometry: (containerNode: Node) => ContainerFitGeometry | null | undefined;
  getNodeDimensions: (node: Node) => NodeDimensions;
  ignoredNodeTypes?: string[];
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
      ignoredNodeTypes,
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
export function getContainerPlacement(
  previewNode: Pick<Node, 'data' | 'parentId'>
): ContainerPlacement | null {
  const placement = previewNode.data?.[PLACEMENT_DATA_KEY] as ContainerPlacement | undefined;
  if (!placement) return null;

  if (previewNode.parentId && placement.containerId !== previewNode.parentId) {
    return null;
  }

  return placement;
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
  ignoredNodeTypes,
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
  ignoredNodeTypes?: string[];
  edges?: Edge[];
}): Node[] {
  const containerNode = nodes.find((node) => node.id === placement.containerId)!;

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const insertedSize = resolveNodeDimensions(insertedNode);
  const resolvedSafeArea = getSafeArea(containerNode, safeArea);
  const upstreamSource =
    placement.sourceNodeId && placement.sourceNodeId !== placement.containerId
      ? nodesById.get(placement.sourceNodeId)
      : undefined;
  // Sequence mode: trust the preview's y (so handle-aware spread is preserved
  // for Decision True/False), but ensure x sits past `source.right + gap`.
  // The preview is sized at 96px and clamped to the container's current safe
  // area, so for wide materializations (e.g. a 760px Agent) the preview's x
  // would otherwise stack the new node on top of the source. Mirrors step 1
  // of `shiftForEdgeInsertion` in the non-container path.
  const sequenceX = upstreamSource
    ? Math.max(
        insertedNode.position.x,
        snapUpToGrid(upstreamSource.position.x + resolveNodeDimensions(upstreamSource).width + gap)
      )
    : insertedNode.position.x;
  const positionedNode =
    placement.mode === 'first-child'
      ? {
          ...insertedNode,
          position: centerOnContainerRail(
            resolveNodeDimensions(containerNode),
            resolvedSafeArea,
            insertedSize
          ),
        }
      : sequenceX !== insertedNode.position.x
        ? { ...insertedNode, position: { ...insertedNode.position, x: sequenceX } }
        : insertedNode;
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
        ? collectLinearDownstreamSiblings({
            startNodeId: placement.targetNodeId,
            parentId: placement.containerId,
            nodes,
            edges,
          })
        : fallbackTargetIds)
  );
  // The upstream source must never shift, even when it appears in the
  // chain via a cycle (Loop V1 body→…→loopBack chains among children).
  if (placement.sourceNodeId) {
    idsToShift.delete(placement.sourceNodeId);
  }
  // Back-edge detection (siblings only): when source is visually at or
  // past target on the x axis, the original edge points backward in flow
  // (a loopback). Skip the shift; the preview placed the inserted node
  // past source, and the chain extends rightward naturally.
  // Container.start edges (source = container itself) live in a different
  // coord space and are always forward.
  const sourceIsContainer = placement.sourceNodeId === placement.containerId;
  const isBackEdge =
    !sourceIsContainer &&
    upstreamSource !== undefined &&
    targetNode !== undefined &&
    upstreamSource.position.x >= targetNode.position.x;
  const requiredTargetLeft = positionedNode.position.x + insertedSize.width + gap;
  const downstreamShift =
    !isBackEdge && targetNode && targetNode.position.x < requiredTargetLeft
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
    ignoredNodeTypes,
    gap,
  });
}
