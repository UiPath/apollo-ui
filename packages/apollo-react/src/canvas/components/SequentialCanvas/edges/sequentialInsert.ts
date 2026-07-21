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
import { SEQ_CONTINUATION_EDGE_KEY } from '../../../utils/sequential/graph-helpers';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';

/**
 * Node `type` values excluded from the Add Node collision passes
 * (shiftForEdgeInsertion / resolveCollisions, utils/NodeUtils.ts) so they never
 * reposition the layout-owned vertical stack (D5).
 *
 * IMPORTANT: this covers ONLY the synthetic rows. Real step clones KEEP their
 * manifest node type, so `ignoredNodeTypes` cannot enumerate them — the
 * robust guarantee that layout owns clone positions lives in the change
 * filtering, which drops every position/dimension change for clones before
 * forwarding onNodesChange to the consumer (seam 2). Listing the synthetic types
 * here is defense in depth so the collision pass can't nudge the start bar or
 * terminal placeholder either.
 *
 * The names are re-exported from constants.ts, the single source of truth shared
 * with the node components (nodes/index.ts).
 */
export const SEQUENTIAL_IGNORED_NODE_TYPES: string[] = [
  SEQ_START_NODE_TYPE,
  SEQ_PLACEHOLDER_NODE_TYPE,
];

/** Returns a fresh ignored-types array, optionally merged with host-specific extras. */
export function getSequentialIgnoredNodeTypes(extra: readonly string[] = []): string[] {
  return [...SEQUENTIAL_IGNORED_NODE_TYPES, ...extra];
}

/** Marker written on nodes inserted while in sequential view (D4). */
export const SEQ_INSERTED_FLAG = 'seqInserted';

/**
 * Marker stashed on a forwarded edge's `data` carrying the exact canonical edge
 * id that an insert split, so `forwardSequentialEdgeChanges` can drop that edge
 * precisely instead of inferring it. Stripped before the edge reaches the host.
 */
export const SEQ_SPLIT_EDGE_ID_KEY = '__sequentialSplitEdgeId';

/** Arguments the ⊕ button gives the insert wiring. */
export interface SequentialInsertArgs {
  /** The slot carried by the clicked connector. */
  slot: InsertionSlot;
  /** Fallback source endpoint (the connector's own source), used when the slot omits one. */
  source: string;
  /**
   * The connector's own rendered source handle (always one of
   * the sequential bar's view-only handles). No longer consulted for handle-id
   * resolution (see {@link buildSequentialPreviewOptions} and
   * {@link resolvePendingSequentialInsert}) — propagating it into canonical
   * state is exactly the bug those functions guard against. Kept on the arg
   * shape for call-site stability.
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
   * The id of the connector edge AS RENDERED (the `id` xyflow gives
   * {@link SequentialConnectorEdge}), used to find and stash the split
   * connector for cancel-restore. Undefined for slots with no backing edge
   * (a tail append, or an empty branch/container body).
   */
  connectorEdgeId?: string;
}

/**
 * Builds the {@link CreatePreviewGraphOptions} for a sequential insertion,
 * riding the existing Add Node preview pipeline verbatim (D5). Splits into a
 * pure builder so the option shape is unit-testable without a live canvas.
 *
 * The preview node is sized to a bar (SEQ_BAR_WIDTH x SEQ_BAR_HEIGHT) so the
 * stack visibly opens a slot. These options retain canonical manifest handles
 * as the preview is created. When the sequential projection rebuilds those
 * edges, `buildSequentialEdges` renders them on the guaranteed bar handles and
 * carries the canonical existing-endpoint handle separately for Add Node
 * filtering/materialization. This keeps preview geometry reliable without
 * losing connection semantics. The exact slot endpoints are also captured by
 * {@link resolvePendingSequentialInsert} and restored by
 * {@link sequentialOnBeforeNodeAdded}.
 *
 * The split connector (found by its OWN rendered id, `connectorEdgeId` — the
 * store in sequential view holds derived connector edges, never canonical
 * ids) is stashed on `data.originalEdge` so AddNodeManager can hide it while
 * the panel is open and restore it if the panel is cancelled.
 */
export function buildSequentialPreviewOptions(
  reactFlowInstance: ReactFlowInstance,
  args: SequentialInsertArgs
): CreatePreviewGraphOptions {
  const { slot, source, target, sourcePosition, position, connectorEdgeId } = args;

  const originalEdge = connectorEdgeId
    ? reactFlowInstance.getEdges().find((edge) => edge.id === connectorEdgeId)
    : undefined;

  // Any target-only slot has no canonical source node. Drive the same preview
  // pipeline from its canonical target handle; sourceHandleType='target' makes
  // the preview the upstream source. The Workflow-start connector is one user
  // of this general slot shape, without making the synthetic start bar part of
  // canonical state or registry constraint checks.
  const targetEndpoint = slot.target;
  const isTargetOnlyInsert = slot.source === undefined && targetEndpoint !== undefined;
  const previewSourceNodeId = isTargetOnlyInsert
    ? targetEndpoint.nodeId
    : (slot.source?.nodeId ?? source);
  const previewSourceHandleId = isTargetOnlyInsert
    ? (targetEndpoint.handleId ?? DEFAULT_TARGET_HANDLE_ID)
    : (slot.source?.handleId ?? DEFAULT_SOURCE_HANDLE_ID);

  // The target is optional: a tail append (the terminal placeholder) has a source
  // but no downstream node. When neither the slot nor the fallback supplies a
  // target node id, omit `target` entirely so the pipeline builds a source-only
  // preview instead of wiring an edge to an empty id.
  const targetNodeId = isTargetOnlyInsert ? undefined : (slot.target?.nodeId ?? target);

  return {
    reactFlowInstance,
    source: {
      nodeId: previewSourceNodeId,
      // Preserve the canonical handle in the semantic preview graph. The
      // derived sequential edge remaps its visual anchor to the bar handle and
      // carries this id as previewConnectionHandleId for registry filtering.
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
    // containerId is intentionally NOT forwarded here: createPreviewGraph would
    // reparent the preview onto the container's RENDERED clone with
    // extent:'parent', but that clone is a flattened 896x72 bar (sequential
    // view has no flow-view container body), so the preview would clamp to
    // exactly overlap the container's row instead of showing in the lane. The
    // canonical containment the slot describes is applied to the MATERIALIZED
    // node instead — see resolvePendingSequentialInsert / sequentialOnBeforeNodeAdded.
  };
}

/** Canonical containment/handle data resolved from a slot at insert time (D5). */
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
 * Captures the slot's canonical handle/containment data at the moment
 * `startInsert` opens the panel, for {@link sequentialOnBeforeNodeAdded} to
 * apply once the user picks a node (D5). Handle ids fall back to `undefined`
 * (default-handle semantics), never to the connector's own bar handle — the
 * bar handle is a view-rendering detail (see buildSequentialPreviewOptions)
 * that must never reach canonical state.
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

/**
 * Adapter for `AddNodeManager.onBeforeNodeAdded` (D4/D5). It:
 *  1. keeps the preview's position as a harmless placement hint — layout owns
 *     positions in sequential view and the projection recomputes them on the
 *     next structural change (D12), so any value here is transient; reusing
 *     the preview's position (instead of zeroing it) just avoids piling the
 *     node onto the head of the stack before the collision pass runs;
 *  2. stamps `data.seqInserted = true` so `synthesizePositionsForFlow` can
 *     place the node when the user toggles back to flow view (D4). Does NOT
 *     stamp `draggable: false` — the sequential clone derivation already forces
 *     that unconditionally for every row (useSequentialGraph), so doing it here
 *     too would only leak into canonical state and permanently disable dragging
 *     once the user toggles back to flow view;
 *  3. re-ids the node with `crypto.randomUUID()` and rewrites the new edges to
 *     reference the new id (the pipeline seeds a `type-Date.now()` id, which can
 *     collide within the same millisecond);
 *  4. applies the slot's canonical containment (`parentId`/`extent`) and
 *     restores the two existing-node endpoints to the slot's exact canonical
 *     handles. The inserted node's endpoints are deliberately left alone:
 *     AddNodeManager resolves those from the inserted node's own manifest.
 *     `pending` is captured by `useSequentialInsert` from the slot at the
 *     moment the panel opened (see resolvePendingSequentialInsert);
 *  5. marks the inserted-node-to-existing-target edge as the sequence
 *     continuation. This keeps the old downstream sequence at the insertion
 *     scope instead of treating it as a branch/body child of the new node.
 */
export function sequentialOnBeforeNodeAdded(
  newNode: Node,
  newEdges: Edge[],
  pending?: PendingSequentialInsert
): { newNode: Node; newEdges: Edge[] } {
  const seqId = crypto.randomUUID();
  const previousId = newNode.id;

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
    // Preview edges use concrete handles so registry filtering works, while
    // the split canonical edge may have relied on implicit defaults. Restore
    // only the EXISTING nodes' exact endpoint semantics before forwarding;
    // the inserted node's handles already came from its own manifest.
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
      id: `edge_${nextSource}-${nextSourceHandle}-${nextTarget}-${nextTargetHandle}`,
    };
  });

  return { newNode: finalNode, newEdges: finalEdges };
}
