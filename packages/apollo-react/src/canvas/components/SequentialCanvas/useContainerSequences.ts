import type { Edge, Node, XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo, useRef } from 'react';
import { PREVIEW_NODE_ID } from '../../constants';
import { getContainerSafeArea } from '../../utils/container';
import { getAbsolutePosition } from '../../utils/NodeUtils';
import { SEQ_LANE_PLACEHOLDER_PREFIX } from '../../utils/sequential/graph-helpers';
import { resolveSequenceMetrics } from '../../utils/sequential/layoutSequence';
import {
  canSequenceContainer,
  projectContainerSequence,
} from '../../utils/sequential/projectContainerSequence';
import type { InsertionSlot, LayoutSequenceOptions } from '../../utils/sequential/sequential.types';
import { EMPTY_SET } from '../BaseCanvas/set-utils';
import { SEQUENTIAL_BAR_HANDLE_IDS } from '../BaseNode/BaseNodeBar';
import { SEQ_GUTTER_WIDTH_PX, type SequentialGutterRow } from './SequentialGutter';
import { resolveTailInsertionSlot } from './sequentialMoveActions';
import {
  assembleSequentialNodes,
  buildSequentialEdges,
  containerTailSlotId,
  reuseUnchangedSequentialNodes,
} from './useSequentialGraph';

/** Bars inside a frame are narrower than the full-canvas bar so the frame stays a readable card. */
export const CONTAINER_BAR_WIDTH = 520;

export interface UseContainerSequencesArgs<N extends Node, E extends Edge> {
  nodes: N[];
  edges: E[];
  nodesById: ReadonlyMap<string, N>;
  /** False outside flow view; the hook then passes the canonical graph through. */
  enabled: boolean;
  sequencedContainerIds: ReadonlySet<string>;
  isSequenceNode: (node: N) => boolean;
  isSequenceEdge: (edge: E) => boolean;
  isContainerNode: (node: N) => boolean;
  /** Folds a trigger inside a self-contained body into that body's start row. */
  isStartNode?: (node: N) => boolean;
  /** A self-contained (runtime) container: no inner rail, so its body opens with a start row. */
  isSelfContained?: (container: N) => boolean;
  resolveBranchLabel: (nodeId: string, handleId: string) => string;
  getBranchHandles: (node: N) => { id: string; label: string }[];
  getDefaultSourceHandleId: (nodeType: string) => string | undefined;
  collapsedStepIds?: ReadonlySet<string>;
  /** "Add trigger" on a self-contained body's start row; called with the container id. */
  onAddTrigger?: (containerId: string) => void;
  layoutOptions?: LayoutSequenceOptions;
  /** The slot whose Add Node panel is open; only the container that owns it opens a gap. */
  insertSlot?: InsertionSlot;
  canAddToLane: boolean;
}

/** One sequenced body's step-number column: visible numbered rows at absolute positions. */
export interface ContainerGutter {
  containerId: string;
  rows: readonly SequentialGutterRow[];
  positions: ReadonlyMap<string, XYPosition>;
}

export interface ContainerSequences<N extends Node, E extends Edge> {
  /** True when at least one requested container is rendered as a sequence. */
  active: boolean;
  /** Canonical graph with each sequenced body replaced by its bars and connectors. */
  nodes: N[];
  edges: E[];
  /** Canonical descendant ids rendered as bars, at any depth. */
  barNodeIds: ReadonlySet<string>;
  /** Synthetic ids (per-container start row, tail and lane placeholders). */
  placeholderIds: ReadonlySet<string>;
  /** Containers actually sequenced (requested, present, and not inside another sequenced body). */
  sequencedIds: ReadonlySet<string>;
  /** Requested containers that could not be sequenced (missing from the graph). */
  blockedIds: ReadonlySet<string>;
  /** Bars and placeholders with absolute positions, for the insert layer. */
  layerNodes: Node[];
  /** The connector edges of every sequenced body. */
  layerEdges: Edge[];
  /** Lane and tail slots by id, for placeholder clicks. */
  slotsById: ReadonlyMap<string, InsertionSlot>;
  /** Step-number columns, one per sequenced body. */
  gutters: readonly ContainerGutter[];
  /**
   * Where the Add Node preview sits while its slot is in a sequenced body: parented to that
   * frame with a frame-relative position, like the bars around it.
   */
  previewPlacement?: { parentId: string; position: XYPosition };
  barWidth: number;
  barHeight: number;
}

const INACTIVE = {
  active: false,
  barNodeIds: EMPTY_SET,
  placeholderIds: EMPTY_SET,
  sequencedIds: EMPTY_SET,
  blockedIds: EMPTY_SET,
  layerNodes: [] as Node[],
  layerEdges: [] as Edge[],
  slotsById: new Map<string, InsertionSlot>(),
  gutters: [] as ContainerGutter[],
};

/** Ancestor ids of `nodeId`, nearest first. Cycle-safe. */
function ancestorIds(nodesById: ReadonlyMap<string, Node>, nodeId: string): string[] {
  const out: string[] = [];
  const seen = new Set([nodeId]);
  let parentId = nodesById.get(nodeId)?.parentId;
  while (parentId && !seen.has(parentId)) {
    out.push(parentId);
    seen.add(parentId);
    parentId = nodesById.get(parentId)?.parentId;
  }
  return out;
}

/** True when `nodeId` sits inside a container whose body is rendered as a sequence. */
export function hasSequencedAncestor(
  nodesById: ReadonlyMap<string, Node>,
  nodeId: string,
  sequencedIds: ReadonlySet<string>
): boolean {
  return ancestorIds(nodesById, nodeId).some((id) => sequencedIds.has(id));
}

/** True when `nodeId` is `ancestorId` itself or nested anywhere inside it. */
export function isSelfOrDescendant(
  nodesById: ReadonlyMap<string, Node>,
  nodeId: string,
  ancestorId: string
): boolean {
  return nodeId === ancestorId || ancestorIds(nodesById, nodeId).includes(ancestorId);
}

/**
 * Derives, for a flow canvas, the bodies of the containers the host wants shown as
 * sequences: each body's descendants become bars parented to the frame, its sequence edges
 * become connectors, and the frame is sized to the stack plus a step-number gutter. A
 * self-contained body opens with its own start row. Everything outside those bodies is the
 * canonical graph untouched. Canonical positions are never written.
 */
export function useContainerSequences<N extends Node, E extends Edge>(
  args: UseContainerSequencesArgs<N, E>
): ContainerSequences<N, E> {
  const {
    nodes,
    edges,
    nodesById,
    enabled,
    sequencedContainerIds,
    isSequenceNode,
    isSequenceEdge,
    isContainerNode,
    isStartNode,
    isSelfContained,
    resolveBranchLabel,
    getBranchHandles,
    getDefaultSourceHandleId,
    collapsedStepIds,
    onAddTrigger,
    layoutOptions,
    insertSlot,
    canAddToLane,
  } = args;
  const previousBodiesRef = useRef(new Map<string, Node[]>());

  // One stable "Add trigger" callback per container, reading the host's latest handler, so
  // the start rows keep their identity (and the reuse pass holds) across host renders.
  const onAddTriggerRef = useRef(onAddTrigger);
  onAddTriggerRef.current = onAddTrigger;
  const boundTriggersRef = useRef(new Map<string, () => void>());
  const hasAddTrigger = onAddTrigger !== undefined;

  return useMemo<ContainerSequences<N, E>>(() => {
    const bodyLayout: LayoutSequenceOptions = {
      ...layoutOptions,
      barWidth: layoutOptions?.barWidth ?? CONTAINER_BAR_WIDTH,
    };
    const { barWidth, barHeight, pitch } = resolveSequenceMetrics(bodyLayout);
    if (!enabled || sequencedContainerIds.size === 0) {
      return { ...INACTIVE, nodes, edges, barWidth, barHeight };
    }

    // Outer containers first, so a container nested in a sequenced body is skipped: it is
    // already one of that body's rows.
    const depthOf = (id: string) => ancestorIds(nodesById, id).length;
    const requested = [...sequencedContainerIds]
      .filter((id) => nodesById.has(id))
      .sort((a, b) => depthOf(a) - depthOf(b) || a.localeCompare(b));
    const blockedIds = new Set<string>(
      [...sequencedContainerIds].filter((id) => !nodesById.has(id))
    );
    const sequencedIds = new Set<string>();
    const barNodeIds = new Set<string>();
    const placeholderIds = new Set<string>();
    const foldedIds = new Set<string>();
    const consumedEdgeIds = new Set<string>();
    const entryEdgeIds = new Set<string>();
    const containerClones = new Map<string, N>();
    const bodyNodes: Node[] = [];
    const layerNodes: Node[] = [];
    const layerEdges: Edge[] = [];
    const slotsById = new Map<string, InsertionSlot>();
    const gutters: ContainerGutter[] = [];
    const nextBodies = new Map<string, Node[]>();
    let previewPlacement: ContainerSequences<N, E>['previewPlacement'];

    for (const containerId of requested) {
      const container = nodesById.get(containerId);
      if (!container || canSequenceContainer(nodes, containerId)) {
        blockedIds.add(containerId);
        continue;
      }
      if (hasSequencedAncestor(nodesById, containerId, sequencedIds)) continue;

      const selfContained = isSelfContained?.(container) === true;
      // A slot inside a nested container (a For Each in the body) carries that container's id,
      // so match on ancestry: the body owns every slot whose container is it or sits inside it.
      const slotForBody =
        insertSlot?.containerId !== undefined &&
        isSelfOrDescendant(nodesById, insertSlot.containerId, containerId)
          ? insertSlot
          : undefined;
      const result = projectContainerSequence(nodes, edges, containerId, {
        isSequenceNode: isSequenceNode as (node: Node) => boolean,
        isSequenceEdge: isSequenceEdge as (edge: Edge) => boolean,
        isContainerNode: isContainerNode as (node: Node) => boolean,
        isStartNode: selfContained ? (isStartNode as (node: Node) => boolean) : undefined,
        resolveBranchLabel,
        getBranchHandles: getBranchHandles as (node: Node) => { id: string; label: string }[],
        collapsedStepIds,
        layoutOptions: bodyLayout,
        insertSlot: slotForBody,
      });
      if (!result) {
        blockedIds.add(containerId);
        continue;
      }
      sequencedIds.add(containerId);

      const safe = getContainerSafeArea(container).padding;
      const padding = {
        left: safe?.left ?? 0,
        top: safe?.top ?? 0,
        right: safe?.right ?? 0,
        bottom: safe?.bottom ?? 0,
      };
      // The safe area reserves an inner-handle rail on each side. A self-contained body has
      // no rail, so the step-number gutter takes the left reservation and the right one is
      // dropped; a railed body needs the gutter beside its rail. A self-contained body also
      // opens with a start row one pitch above the first step.
      const origin = {
        x: padding.left + (selfContained ? 0 : SEQ_GUTTER_WIDTH_PX),
        y: padding.top + (selfContained ? pitch : 0),
      };
      if (selfContained) padding.right = Math.max(0, padding.right - SEQ_GUTTER_WIDTH_PX);
      const containerAbs = getAbsolutePosition(container, nodesById);
      const scope = {
        parentId: containerId,
        origin,
        waypointOffset: { x: containerAbs.x + origin.x, y: containerAbs.y + origin.y },
        idSuffix: `:${containerId}`,
        includeStart: selfContained,
      };
      let onAddTriggerForBody: (() => void) | undefined;
      if (selfContained && hasAddTrigger) {
        onAddTriggerForBody = boundTriggersRef.current.get(containerId);
        if (!onAddTriggerForBody) {
          onAddTriggerForBody = () => onAddTriggerRef.current?.(containerId);
          boundTriggersRef.current.set(containerId, onAddTriggerForBody);
        }
      }
      const assembled = assembleSequentialNodes(
        result.projection,
        result.layout,
        nodesById,
        { canAddToLane, onAddTrigger: onAddTriggerForBody },
        bodyLayout,
        scope
      ).filter(
        // A lane placeholder being inserted into lost its position to the preview row.
        (node) =>
          !node.id.startsWith(SEQ_LANE_PLACEHOLDER_PREFIX) || result.layout.positions.has(node.id)
      );
      const body = reuseUnchangedSequentialNodes(
        previousBodiesRef.current.get(containerId) ?? [],
        assembled
      );
      nextBodies.set(containerId, body);

      const bodyIds = new Set<string>();
      let maxRight = 0;
      let maxBottom = 0;
      const absolute = new Map<string, XYPosition>();
      for (const node of body) {
        bodyIds.add(node.id);
        if (nodesById.has(node.id)) barNodeIds.add(node.id);
        else placeholderIds.add(node.id);
        bodyNodes.push(node);
        const abs = { x: node.position.x + containerAbs.x, y: node.position.y + containerAbs.y };
        absolute.set(node.id, abs);
        layerNodes.push({ ...node, position: abs });
        // A collapsed step's descendants stay mounted but hidden; the frame fits what shows.
        if (node.hidden) continue;
        maxRight = Math.max(maxRight, node.position.x + (node.width ?? barWidth));
        maxBottom = Math.max(maxBottom, node.position.y + (node.height ?? barHeight));
      }
      // Descendants that took part but have no row (a trigger folded into the start row).
      for (const id of result.childIds) {
        if (!bodyIds.has(id)) foldedIds.add(id);
      }
      const width = maxRight + padding.right;
      const height = maxBottom + padding.bottom;
      // `measured` must match the declared size: xyflow prefers `measured` for the props it
      // hands the node and re-adopts it from the node object on every identity change, so a
      // stale flow-mode measurement would make the frame flip sizes on each drag frame.
      containerClones.set(containerId, {
        ...container,
        width,
        height,
        measured: { width, height },
        style: { ...container.style, width, height },
      });

      gutters.push({
        containerId,
        rows: result.projection.rows.filter((row) => row.visible && row.stepNumber !== undefined),
        positions: absolute,
      });

      const connectors = buildSequentialEdges(result.projection, result.layout, scope);
      layerEdges.push(...connectors);

      for (const edge of edges) {
        const sourceIn = result.childIds.has(edge.source);
        const targetIn = result.childIds.has(edge.target);
        if (sourceIn && targetIn && isSequenceEdge(edge)) consumedEdgeIds.add(edge.id);
        else if (edge.source === containerId && targetIn) entryEdgeIds.add(edge.id);
      }

      for (const row of result.projection.rows) {
        if (row.lanePlaceholder) slotsById.set(row.lanePlaceholder.id, row.lanePlaceholder);
      }
      const tail = resolveTailInsertionSlot(result.projection, nodes, getDefaultSourceHandleId);
      if (tail) {
        slotsById.set(containerTailSlotId(containerId), {
          ...tail,
          id: containerTailSlotId(containerId),
          containerId,
        });
      }

      const previewLocal = slotForBody ? result.layout.positions.get(PREVIEW_NODE_ID) : undefined;
      if (previewLocal) {
        previewPlacement = {
          parentId: containerId,
          position: { x: origin.x + previewLocal.x, y: origin.y + previewLocal.y },
        };
      }
    }
    previousBodiesRef.current = nextBodies;

    if (sequencedIds.size === 0) {
      return { ...INACTIVE, nodes, edges, blockedIds, barWidth, barHeight };
    }

    // Containers precede their children in the canonical array; the bodies are appended so
    // every bar follows its frame.
    const outNodes: N[] = [];
    for (const node of nodes) {
      if (barNodeIds.has(node.id) || foldedIds.has(node.id)) continue;
      outNodes.push(containerClones.get(node.id) ?? node);
    }
    outNodes.push(...(bodyNodes as N[]));

    const outEdges: E[] = [];
    for (const edge of edges) {
      if (consumedEdgeIds.has(edge.id)) continue;
      if (foldedIds.has(edge.source) || foldedIds.has(edge.target)) continue;
      // The body is entered like a lane: from the frame's handle into the first bar's left.
      outEdges.push(
        entryEdgeIds.has(edge.id)
          ? { ...edge, targetHandle: SEQUENTIAL_BAR_HANDLE_IDS.branchTarget }
          : edge
      );
    }
    outEdges.push(...(layerEdges as E[]));

    return {
      active: true,
      nodes: outNodes,
      edges: outEdges,
      barNodeIds,
      placeholderIds,
      sequencedIds,
      blockedIds,
      layerNodes,
      layerEdges,
      slotsById,
      gutters,
      previewPlacement,
      barWidth,
      barHeight,
    };
  }, [
    nodes,
    edges,
    nodesById,
    enabled,
    sequencedContainerIds,
    isSequenceNode,
    isSequenceEdge,
    isContainerNode,
    isStartNode,
    isSelfContained,
    resolveBranchLabel,
    getBranchHandles,
    getDefaultSourceHandleId,
    collapsedStepIds,
    hasAddTrigger,
    layoutOptions,
    insertSlot,
    canAddToLane,
  ]);
}
