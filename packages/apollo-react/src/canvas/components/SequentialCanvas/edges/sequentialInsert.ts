import type {
  Edge,
  Node,
  ReactFlowInstance,
  XYPosition,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  DEFAULT_SOURCE_HANDLE_ID,
  DEFAULT_TARGET_HANDLE_ID,
  SEQ_BAR_HEIGHT,
  SEQ_BAR_WIDTH,
  SEQ_PLACEHOLDER_NODE_TYPE,
  SEQ_START_NODE_TYPE,
} from '../../../constants';
import type { CreatePreviewGraphOptions } from '../../../utils/createPreviewGraph';
import { buildEdgeId } from '../../../utils/props-helpers';
import { SEQ_CONTINUATION_EDGE_KEY } from '../../../utils/sequential/graph-helpers';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';

/**
 * Node `type` values excluded from the Add Node collision passes. Covers only the
 * synthetic rows: real step clones keep their manifest type, so layout ownership
 * of clone positions is enforced by the change filtering, not by this list.
 */
export const SEQUENTIAL_IGNORED_NODE_TYPES: string[] = [
  SEQ_START_NODE_TYPE,
  SEQ_PLACEHOLDER_NODE_TYPE,
];

/** Returns a fresh ignored-types array, optionally merged with host-specific extras. */
export function getSequentialIgnoredNodeTypes(extra: readonly string[] = []): string[] {
  return [...SEQUENTIAL_IGNORED_NODE_TYPES, ...extra];
}

/** Marker written on nodes inserted while in sequential view. */
export const SEQ_INSERTED_FLAG = 'seqInserted';

/** True for a node inserted from the sequential view and not yet placed by a flow layout. */
export function isSequentialInsertedNode(node: Pick<Node, 'data'>): boolean {
  return (node.data as Record<string, unknown> | undefined)?.[SEQ_INSERTED_FLAG] === true;
}

/**
 * Canonical id of the edge an insert split, stashed on the forwarded edge's `data`
 * so `forwardSequentialEdgeChanges` can drop it precisely. Stripped before the host sees it.
 */
export const SEQ_SPLIT_EDGE_ID_KEY = '__sequentialSplitEdgeId';

/** Arguments the ⊕ button gives the insert wiring. */
export interface SequentialInsertArgs {
  /** The slot carried by the clicked connector. */
  slot: InsertionSlot;
  /** Fallback source endpoint (the connector's own source), used when the slot omits one. */
  source: string;
  /**
   * The connector's own rendered bar handle. Not consulted for handle resolution
   * (a view detail that must never reach canonical state); kept for call-site stability.
   */
  sourceHandleId?: string | null;
  /** Fallback target endpoint (the connector's own target), used when the slot omits one. */
  target: string;
  /** The connector's own rendered target handle. See {@link sourceHandleId}. */
  targetHandleId?: string | null;
  /** Side of the source node the preview edge leaves from (bar bottom). */
  sourcePosition: Position;
  /** Drop point for the preview, in flow coordinates (the connector midpoint). */
  position: XYPosition;
  /**
   * The connector edge's rendered id (not the canonical one), used to stash the
   * split connector for cancel-restore. Undefined for slots with no backing edge.
   */
  connectorEdgeId?: string;
}

/**
 * Builds the {@link CreatePreviewGraphOptions} for a sequential insertion on the
 * existing Add Node preview pipeline. Canonical manifest handles are kept here;
 * the projection remaps the rendered preview edges onto the bar handles.
 */
export function buildSequentialPreviewOptions(
  reactFlowInstance: ReactFlowInstance,
  args: SequentialInsertArgs
): CreatePreviewGraphOptions {
  const { slot, source, target, sourcePosition, position, connectorEdgeId } = args;

  const originalEdge = connectorEdgeId
    ? reactFlowInstance.getEdges().find((edge) => edge.id === connectorEdgeId)
    : undefined;

  // A target-only slot (e.g. before the first step) has no canonical source; drive
  // the preview from its target handle, with sourceHandleType='target'.
  const targetEndpoint = slot.target;
  const isTargetOnlyInsert = slot.source === undefined && targetEndpoint !== undefined;
  const previewSourceNodeId = isTargetOnlyInsert
    ? targetEndpoint.nodeId
    : (slot.source?.nodeId ?? source);
  const previewSourceHandleId = isTargetOnlyInsert
    ? (targetEndpoint.handleId ?? DEFAULT_TARGET_HANDLE_ID)
    : (slot.source?.handleId ?? DEFAULT_SOURCE_HANDLE_ID);

  // A tail append has no downstream node; omit `target` so the pipeline builds a
  // source-only preview instead of wiring an edge to an empty id.
  const targetNodeId = isTargetOnlyInsert ? undefined : (slot.target?.nodeId ?? target);

  return {
    reactFlowInstance,
    source: {
      nodeId: previewSourceNodeId,
      handleId: previewSourceHandleId,
    },
    ...(targetNodeId
      ? {
          target: {
            nodeId: targetNodeId,
            handleId: slot.target?.handleId ?? DEFAULT_TARGET_HANDLE_ID,
          },
        }
      : {}),
    position,
    positionMode: 'drop',
    data: originalEdge ? { originalEdge } : {},
    sourceHandleType: isTargetOnlyInsert ? 'target' : 'source',
    handlePosition: isTargetOnlyInsert ? Position.Top : sourcePosition,
    ignoredNodeTypes: SEQUENTIAL_IGNORED_NODE_TYPES,
    previewNodeSize: { width: SEQ_BAR_WIDTH, height: SEQ_BAR_HEIGHT },
    // containerId is deliberately omitted: createPreviewGraph would clamp the preview
    // onto the container's flattened bar clone. sequentialOnBeforeNodeAdded applies it.
  };
}

/** Canonical containment/handle data resolved from a slot at insert time. */
export interface PendingSequentialInsert {
  sourceNodeId?: string;
  targetNodeId?: string;
  graphEdgeId?: string;
  /** slot.source's canonical handle id, if the split edge had an explicit one. */
  sourceHandleId?: string;
  /** slot.target's canonical handle id, if the split edge had an explicit one. */
  targetHandleId?: string;
  /** parentId for the materialized node, if the slot is scoped to a container. */
  containerId?: string;
  /** Whether the split source edge already represented an explicit continuation. */
  splitEdgeWasContinuation?: boolean;
}

/**
 * Captures the slot's canonical handle/containment data when the panel opens, for
 * {@link sequentialOnBeforeNodeAdded}. Handle ids fall back to `undefined`, never
 * to the connector's bar handle, which must not reach canonical state.
 */
export function resolvePendingSequentialInsert(slot: InsertionSlot): PendingSequentialInsert {
  return {
    sourceNodeId: slot.source?.nodeId,
    targetNodeId: slot.target?.nodeId,
    graphEdgeId: slot.graphEdgeId,
    sourceHandleId: slot.source?.handleId,
    targetHandleId: slot.target?.handleId,
    containerId: slot.containerId,
    splitEdgeWasContinuation: slot.continuation,
  };
}

/** True for the `${type}-${Date.now()}` id AddNodeManager seeds; anything else was chosen by a host. */
function isPipelineSeedId(node: Node): boolean {
  return node.type !== undefined && new RegExp(`^${escapeRegExp(node.type)}-\\d+$`).test(node.id);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adapter for `AddNodeManager.onBeforeNodeAdded`: re-ids the pipeline's seed id
 * (host-assigned ids are kept), stamps `seqInserted`, applies slot containment, and
 * restores the existing endpoints' canonical handles. Never stamps `draggable: false`:
 * useSequentialGraph already forces it per row, and here it would leak into flow view.
 */
export function sequentialOnBeforeNodeAdded(
  newNode: Node,
  newEdges: Edge[],
  pending?: PendingSequentialInsert
): { newNode: Node; newEdges: Edge[] } {
  const previousId = newNode.id;
  const seqId = isPipelineSeedId(newNode) ? crypto.randomUUID() : previousId;

  const finalNode: Node = {
    ...newNode,
    id: seqId,
    ...(pending?.containerId ? { parentId: pending.containerId, extent: 'parent' as const } : {}),
    data: { ...newNode.data, [SEQ_INSERTED_FLAG]: true },
  };

  const finalEdges = newEdges.map((edge) => {
    const nextSource = edge.source === previousId ? seqId : edge.source;
    const nextTarget = edge.target === previousId ? seqId : edge.target;
    let nextSourceHandle = edge.sourceHandle;
    let nextTargetHandle = edge.targetHandle;
    // Restore only the existing nodes' endpoints (which may rely on implicit
    // defaults); the inserted node's handles came from its own manifest.
    if (
      pending?.sourceNodeId &&
      edge.source === pending.sourceNodeId &&
      edge.target === previousId
    ) {
      nextSourceHandle = pending.sourceHandleId;
    }
    if (
      pending?.targetNodeId &&
      edge.source === previousId &&
      edge.target === pending.targetNodeId
    ) {
      nextTargetHandle = pending.targetHandleId;
    }
    const preservesSplitContinuation =
      pending?.splitEdgeWasContinuation === true &&
      edge.source === pending.sourceNodeId &&
      edge.target === previousId;
    const keepsDownstreamOutsideInsertedNode =
      pending?.targetNodeId !== undefined &&
      edge.source === previousId &&
      edge.target === pending.targetNodeId;
    const carriesContinuation = preservesSplitContinuation || keepsDownstreamOutsideInsertedNode;
    const data =
      pending?.graphEdgeId || carriesContinuation
        ? {
            ...edge.data,
            ...(pending?.graphEdgeId ? { [SEQ_SPLIT_EDGE_ID_KEY]: pending.graphEdgeId } : {}),
            ...(carriesContinuation ? { [SEQ_CONTINUATION_EDGE_KEY]: true } : {}),
          }
        : edge.data;
    if (
      nextSource === edge.source &&
      nextTarget === edge.target &&
      nextSourceHandle === edge.sourceHandle &&
      nextTargetHandle === edge.targetHandle &&
      data === edge.data
    ) {
      return edge;
    }
    return {
      ...edge,
      source: nextSource,
      target: nextTarget,
      sourceHandle: nextSourceHandle,
      targetHandle: nextTargetHandle,
      data,
      id: buildEdgeId(nextSource, nextSourceHandle, nextTarget, nextTargetHandle),
    };
  });

  return { newNode: finalNode, newEdges: finalEdges };
}
