import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo, useRef } from 'react';
import { useSafeLingui } from '../../../i18n';
import {
  DEFAULT_SOURCE_HANDLE_ID,
  DEFAULT_TARGET_HANDLE_ID,
  PREVIEW_NODE_ID,
  SEQ_PLACEHOLDER_NODE_TYPE,
  SEQ_START_NODE_TYPE,
} from '../../constants';
import type { NodeTypeRegistry } from '../../core';
import { useOptionalNodeTypeRegistry } from '../../core';
import type { InstanceDisplayConfig } from '../../schema/node-instance';
import { PREVIEW_EDGE_STYLE } from '../../utils/createPreviewNode';
import { resolveDisplay } from '../../utils/manifest-resolver';
import { shallowEqualExcept } from '../../utils/nodePropsEqual';
import { sequenceFingerprint } from '../../utils/sequential/fingerprint';
import {
  edgeDataLabel,
  filterGraphByNodes,
  sourceHandleOf,
} from '../../utils/sequential/graph-helpers';
import { layoutSequence, resolveSequenceMetrics } from '../../utils/sequential/layoutSequence';
import { projectionWithPreviewRow } from '../../utils/sequential/previewRow';
import { projectSequence } from '../../utils/sequential/projectSequence';
import type {
  CanvasView,
  InsertionSlot,
  LayoutSequenceOptions,
  SequenceConnector,
  SequenceLayout,
  SequenceProjection,
} from '../../utils/sequential/sequential.types';
import { EMPTY_SET } from '../BaseCanvas/set-utils';
import { EMPTY_WAYPOINTS } from '../Edges/shared/constants';
import type {
  SequentialConnectorData,
  SequentialInsertAnchor,
} from './edges/SequentialConnectorEdge.types';
import { SEQUENTIAL_BAR_HANDLE_IDS } from './nodes';
import type { SequentialPlaceholderNodeData } from './nodes/SequentialPlaceholderNode';
import type { SequentialStartNodeData } from './nodes/SequentialStartNode';
import {
  SEQ_CONNECTOR_EDGE_TYPE,
  SEQ_PLACEHOLDER_EDGE_ID,
  SEQ_PLACEHOLDER_ROW_ID,
  SEQ_START_EDGE_ID,
  SEQ_START_ROW_ID,
} from './sequentialGraph.constants';

type TranslateFn = ReturnType<typeof useSafeLingui>['_'];

/** The connector draws its own dashes, so the preview style drops the Add Node dash pattern. */
const { strokeDasharray: _dash, ...SEQ_PREVIEW_EDGE_STYLE } = PREVIEW_EDGE_STYLE ?? {};

const POSITION_AND_DATA_KEYS: ReadonlySet<string> = new Set(['position', 'data']);

/**
 * Memo guard: a stable string over predicate *results*, so the projection recomputes when
 * results (not predicate identity) change. An absent predicate yields `whenAbsent` per item.
 */
function predicateFingerprint<T extends { id: string }>(
  items: readonly T[],
  predicate: ((item: T) => boolean) | undefined,
  whenAbsent: 0 | 1
): string {
  return items
    .map((item) => `${item.id}:${predicate ? (predicate(item) ? 1 : 0) : whenAbsent}`)
    .join('|');
}

/** The ids of the two synthetic rows, for filtering them out of change callbacks. */
export const SEQ_SYNTHETIC_ROW_IDS: ReadonlySet<string> = new Set([
  SEQ_START_ROW_ID,
  SEQ_PLACEHOLDER_ROW_ID,
]);

export interface UseSequentialGraphArgs<N extends Node, E extends Edge> {
  nodes: N[];
  edges: E[];
  /** Only the 'sequential' view derives; 'flow' passes the canonical graph through. */
  view: CanvasView;
  collapsedStepIds?: ReadonlySet<string>;
  /** Wired onto the synthetic start bar's "Add trigger" button. */
  onAddTrigger?: () => void;
  /** Wired onto the terminal placeholder's click (opens Add Node for the tail slot). */
  onPlaceholderAdd?: () => void;
  /** Registry-driven predicate excluding artifact/resource edges (see projectSequence). */
  isSequenceEdge?: (edge: E) => boolean;
  /** Excludes presentation-only nodes while retaining them in the canonical graph. */
  isSequenceNode?: (node: N) => boolean;
  /** Registry-driven trigger predicate; matching nodes collapse into the synthetic start row. */
  isStartNode?: (node: N) => boolean;
  /** Registry-driven predicate preserving empty manifest containers. */
  isContainerNode?: (node: N) => boolean;
  resolveBranchLabel?: (nodeId: string, handleId: string) => string;
  /** Registry-driven branch-lane handles for a parent node (see projectSequence). */
  getBranchHandles?: (node: N) => { id: string; label: string }[];
  /**
   * Makes lane placeholders clickable. The click itself is delivered through
   * SequentialLaneAddContext by slot id, so placeholder data holds no closure.
   */
  canAddToLane?: boolean;
  /**
   * The slot whose Add Node panel is open. Only the layout memo depends on it (a preview row
   * is spliced in at the slot); the projection memo stays fingerprint-keyed.
   */
  insertSlot?: InsertionSlot;
  /** Geometry overrides applied consistently to rows, connectors, gutter, and preview layout. */
  layoutOptions?: LayoutSequenceOptions;
  /** The caller's id index for `nodes`, when it already has one. */
  nodesById?: ReadonlyMap<string, N>;
}

export interface SequentialGraph<N extends Node, E extends Edge> {
  nodes: N[];
  edges: E[];
  projection: SequenceProjection | null;
  /** The geometry pass behind `nodes` positions, so SequentialGutter can align without reading DOM. */
  layout: SequenceLayout | null;
}

type ProjectionArgs<N extends Node, E extends Edge> = Pick<
  UseSequentialGraphArgs<N, E>,
  | 'nodes'
  | 'edges'
  | 'isSequenceNode'
  | 'isSequenceEdge'
  | 'isStartNode'
  | 'isContainerNode'
  | 'resolveBranchLabel'
  | 'getBranchHandles'
>;

/**
 * Which nodes/edges enter the projection, and with which options. Shared by
 * {@link deriveSequentialGraph} (tests) and {@link useSequentialGraph} (production) so the
 * two cannot drift. A plain function, not a hook: its call site is a fingerprint-keyed memo.
 */
function projectSequenceForView<N extends Node, E extends Edge>(
  args: ProjectionArgs<N, E>,
  collapsed: ReadonlySet<string>
): SequenceProjection {
  const { nodes, edges } = args.isSequenceNode
    ? filterGraphByNodes(args.nodes, args.edges, args.isSequenceNode)
    : args;
  return projectSequence(nodes, edges, {
    collapsedStepIds: collapsed,
    isSequenceEdge: args.isSequenceEdge as ((edge: Edge) => boolean) | undefined,
    isStartNode: args.isStartNode as ((node: Node) => boolean) | undefined,
    isContainerNode: args.isContainerNode as ((node: Node) => boolean) | undefined,
    resolveBranchLabel: args.resolveBranchLabel,
    getBranchHandles: args.getBranchHandles as
      | ((node: Node) => { id: string; label: string }[])
      | undefined,
  });
}

interface SyntheticCallbacks {
  onAddTrigger?: () => void;
  onPlaceholderAdd?: () => void;
  canAddToLane?: boolean;
}

/** The derived node array for a projection; the hook and the pure derivation both build from here. */
function assembleSequentialNodes<N extends Node>(
  projection: SequenceProjection,
  layout: SequenceLayout,
  nodesById: ReadonlyMap<string, N>,
  callbacks: SyntheticCallbacks,
  layoutOptions?: LayoutSequenceOptions
): Node[] {
  return buildSequentialNodes(projection, layout, nodesById, callbacks, layoutOptions);
}

function indexById<N extends Node>(nodes: readonly N[]): ReadonlyMap<string, N> {
  return new Map(nodes.map((node) => [node.id, node] as const));
}

/**
 * Pure derivation of the sequential node/edge arrays from the canonical graph: each row is
 * a clone that keeps its real `type`, takes its position from `layoutSequence`, is flattened
 * (`parentId` cleared) and non-draggable, with `data` and `selected` passed by reference;
 * synthetic start/placeholder bars and connector edges are added. Tests call this without
 * mounting xyflow. {@link useSequentialGraph} additionally stamps `ariaLabel` and reuses node
 * objects across renders.
 */
export function deriveSequentialGraph<N extends Node, E extends Edge>(
  args: UseSequentialGraphArgs<N, E>
): SequentialGraph<N, E> {
  const collapsed = args.collapsedStepIds ?? EMPTY_SET;
  const projection = projectSequenceForView(args, collapsed);
  const renderedProjection = args.insertSlot
    ? projectionWithPreviewRow(projection, args.insertSlot)
    : projection;
  const layout = layoutSequence(renderedProjection, args.layoutOptions);
  const nodes = assembleSequentialNodes(
    projection,
    layout,
    args.nodesById ?? indexById(args.nodes),
    args,
    args.layoutOptions
  );
  const edges = buildSequentialEdges(renderedProjection, layout);
  return { nodes: nodes as unknown as N[], edges: edges as unknown as E[], projection, layout };
}

function buildSequentialNodes<N extends Node>(
  projection: SequenceProjection,
  layout: SequenceLayout,
  nodesById: ReadonlyMap<string, N>,
  callbacks: SyntheticCallbacks,
  layoutOptions?: LayoutSequenceOptions
): Node[] {
  const { barWidth, barHeight, rowGap, pitch } = resolveSequenceMetrics(layoutOptions);
  const clones: Node[] = [];
  const orphanClones: Node[] = [];
  let firstTopY: number | undefined;
  let firstOrphanY: number | undefined;
  // Lowest visible non-orphan row at any depth, so the terminal placeholder sits below the
  // whole stack.
  let maxVisibleY: number | undefined;

  for (const row of projection.rows) {
    // Empty branch-lane placeholder: a synthetic bar with no canonical node.
    if (row.lanePlaceholder) {
      clones.push({
        id: row.nodeId,
        type: SEQ_PLACEHOLDER_NODE_TYPE,
        position: layout.positions.get(row.nodeId) ?? { x: 0, y: 0 },
        width: barWidth,
        // An append plus is an overlay in the row gap; an empty lane/body is a full dashed row.
        height: row.placeholderKind === 'append' ? rowGap : barHeight,
        draggable: false,
        // ReactFlow sets pointer-events:none on wrappers that are neither selectable nor
        // draggable; keep the row hit-testable while its Add-step button is active.
        selectable: callbacks.canAddToLane === true,
        hidden: !row.visible,
        data: {
          insertionSlotId: row.lanePlaceholder.id,
          variant: row.placeholderKind === 'append' ? 'plus' : 'row',
        } satisfies SequentialPlaceholderNodeData,
      });
      continue;
    }
    const canonical = nodesById.get(row.nodeId);
    if (!canonical) continue;
    const position = layout.positions.get(row.nodeId) ?? { x: 0, y: 0 };
    const clone: Node = {
      ...canonical,
      position,
      width: barWidth,
      // Declare the layout-owned height so it matches BaseNode's `computedHeight`; otherwise
      // the controlled array and BaseNode's height write-back fight through
      // `updateNodeInternals` and blow React's nested-update limit near 150 nodes.
      height: barHeight,
      draggable: false,
      hidden: !row.visible,
      // Layout positions are absolute; a residual parentId would double-offset the clone.
      parentId: undefined,
      extent: undefined,
      expandParent: undefined,
      className: row.orphan
        ? [canonical.className, 'opacity-60'].filter(Boolean).join(' ')
        : canonical.className,
    };
    if (row.orphan) {
      orphanClones.push(clone);
      if (row.visible && firstOrphanY === undefined) firstOrphanY = position.y;
      continue;
    }
    clones.push(clone);
    if (row.depth === 0 && firstTopY === undefined) firstTopY = position.y;
    if (row.visible) {
      maxVisibleY = maxVisibleY === undefined ? position.y : Math.max(maxVisibleY, position.y);
    }
  }

  // A preview row can be the new lowest row on a tail append.
  const previewY = layout.positions.get(PREVIEW_NODE_ID)?.y;
  if (previewY !== undefined) {
    maxVisibleY = maxVisibleY === undefined ? previewY : Math.max(maxVisibleY, previewY);
  }

  // One pitch above the earliest rendered top-level row, including a head-insertion preview;
  // otherwise the start bar would drop into the preview's slot and stack on it.
  const earliestTopY = Math.min(firstTopY ?? Number.POSITIVE_INFINITY, previewY ?? Infinity);
  const startY = (Number.isFinite(earliestTopY) ? earliestTopY : 0) - pitch;
  // Below the entire visible stack so it never lands inside a trailing container's body. A
  // non-empty flow's tail is a plus overlay in the gap; an empty flow shows the full dashed row.
  const tailIsPlus = firstTopY !== undefined;
  const placeholderY =
    firstOrphanY !== undefined
      ? firstOrphanY - pitch
      : (maxVisibleY ?? -pitch) + (tailIsPlus ? barHeight : pitch);

  const startNode: Node = {
    id: SEQ_START_ROW_ID,
    type: SEQ_START_NODE_TYPE,
    position: { x: 0, y: startY },
    width: barWidth,
    height: barHeight,
    draggable: false,
    selectable: callbacks.onAddTrigger !== undefined,
    data: { onAddTrigger: callbacks.onAddTrigger } satisfies SequentialStartNodeData,
  };

  const placeholderNode: Node = {
    id: SEQ_PLACEHOLDER_ROW_ID,
    type: SEQ_PLACEHOLDER_NODE_TYPE,
    position: { x: 0, y: placeholderY },
    width: barWidth,
    height: tailIsPlus ? rowGap : barHeight,
    draggable: false,
    selectable: callbacks.onPlaceholderAdd !== undefined,
    data: {
      onAdd: callbacks.onPlaceholderAdd,
      variant: tailIsPlus ? 'plus' : 'row',
    } satisfies SequentialPlaceholderNodeData,
  };

  return [startNode, ...clones, placeholderNode, ...orphanClones];
}

function buildSequentialEdges(projection: SequenceProjection, layout: SequenceLayout): Edge[] {
  // No arrowhead into an append placeholder: it is an add affordance, not a step.
  const appendPlaceholderIds = new Set(
    projection.rows.filter((row) => row.placeholderKind === 'append').map((row) => row.nodeId)
  );
  // No insert on a connector touching a row hidden by a collapsed ancestor.
  const hiddenRowIds = new Set(
    projection.rows.filter((row) => !row.visible).map((row) => row.nodeId)
  );
  // Read off the projection so the announced number is the gutter's stable pre-order number.
  const stepNumberByRowId = new Map<string, number>();
  for (const row of projection.rows) {
    if (row.stepNumber !== undefined) stepNumberByRowId.set(row.nodeId, row.stepNumber);
  }
  const insertAnchorFor = (connector: SequenceConnector): SequentialInsertAnchor | undefined => {
    const sourceStep = stepNumberByRowId.get(connector.sourceRowId);
    if (sourceStep !== undefined) {
      // A lane head is named by lane + owner, since several steps can own a lane of the same name.
      return connector.kind === 'branch-entry' && connector.label
        ? { kind: 'branch', stepNumber: sourceStep, branchLabel: connector.label }
        : { kind: 'after', stepNumber: sourceStep };
    }
    // Unnumbered source (the synthetic start bar): anchor on the target instead.
    const targetStep = stepNumberByRowId.get(connector.targetRowId);
    return targetStep === undefined ? undefined : { kind: 'before', stepNumber: targetStep };
  };

  const edges: Edge[] = projection.connectors.map((connector) => {
    const sourceIsPreview = connector.sourceRowId === PREVIEW_NODE_ID;
    const targetIsPreview = connector.targetRowId === PREVIEW_NODE_ID;
    const isPreviewConnector = sourceIsPreview || targetIsPreview;
    const previewConnectionHandleId = !isPreviewConnector
      ? undefined
      : sourceIsPreview
        ? (connector.slot?.target?.handleId ?? DEFAULT_TARGET_HANDLE_ID)
        : (connector.slot?.source?.handleId ?? DEFAULT_SOURCE_HANDLE_ID);
    // Preview connectors keep the slot for handle resolution but must not offer another
    // insert while the Add Node panel is already open.
    const renderedSlot =
      isPreviewConnector ||
      hiddenRowIds.has(connector.targetRowId) ||
      hiddenRowIds.has(connector.sourceRowId)
        ? undefined
        : connector.slot;
    const data: SequentialConnectorData = {
      kind: connector.kind,
      label: connector.label,
      waypoints: layout.connectorWaypoints.get(connector.id) ?? EMPTY_WAYPOINTS,
      slot: renderedSlot,
      insertAnchor: renderedSlot ? insertAnchorFor(connector) : undefined,
      preview: isPreviewConnector || undefined,
      previewConnectionHandleId,
      hideArrowHead: connector.kind === 'goto' || appendPlaceholderIds.has(connector.targetRowId),
    };
    return {
      id: connector.id,
      source: connector.sourceRowId,
      target: connector.targetRowId,
      sourceHandle: sourceIsPreview ? DEFAULT_SOURCE_HANDLE_ID : SEQUENTIAL_BAR_HANDLE_IDS.source,
      // Branch/container-entry connectors enter mid-left; every other kind drops into the top.
      targetHandle:
        connector.kind === 'branch-entry'
          ? SEQUENTIAL_BAR_HANDLE_IDS.branchTarget
          : targetIsPreview
            ? DEFAULT_TARGET_HANDLE_ID
            : SEQUENTIAL_BAR_HANDLE_IDS.target,
      type: SEQ_CONNECTOR_EDGE_TYPE,
      data,
      ...(isPreviewConnector ? { style: SEQ_PREVIEW_EDGE_STYLE } : {}),
    };
  });

  // Synthetic joins: start -> first top row, last top row -> placeholder.
  const topRows = projection.rows.filter((row) => row.depth === 0 && !row.orphan);
  const firstTop = topRows[0];
  const lastVisibleTop = [...topRows].reverse().find((row) => row.visible);

  const previewIsFirst = firstTop?.nodeId === PREVIEW_NODE_ID;
  const headSlot: InsertionSlot | undefined =
    firstTop && !previewIsFirst
      ? { id: `slot:head:${firstTop.nodeId}`, target: { nodeId: firstTop.nodeId } }
      : undefined;
  edges.push({
    id: SEQ_START_EDGE_ID,
    source: SEQ_START_ROW_ID,
    target: firstTop?.nodeId ?? SEQ_PLACEHOLDER_ROW_ID,
    sourceHandle: SEQUENTIAL_BAR_HANDLE_IDS.source,
    targetHandle: previewIsFirst ? DEFAULT_TARGET_HANDLE_ID : SEQUENTIAL_BAR_HANDLE_IDS.target,
    type: SEQ_CONNECTOR_EDGE_TYPE,
    data: previewIsFirst
      ? {
          kind: 'step',
          waypoints: EMPTY_WAYPOINTS,
          hideArrowHead: false,
          preview: true,
          ignorePreviewConnection: true,
        }
      : {
          kind: 'step',
          waypoints: EMPTY_WAYPOINTS,
          hideArrowHead: firstTop === undefined,
          slot: headSlot,
          // The start bar is unnumbered, so this gap is named by the step it precedes.
          insertAnchor:
            headSlot && firstTop?.stepNumber !== undefined
              ? { kind: 'before', stepNumber: firstTop.stepNumber }
              : undefined,
        },
    ...(previewIsFirst ? { style: SEQ_PREVIEW_EDGE_STYLE } : {}),
  });

  if (lastVisibleTop) {
    const previewIsLast = lastVisibleTop.nodeId === PREVIEW_NODE_ID;
    edges.push({
      id: SEQ_PLACEHOLDER_EDGE_ID,
      source: lastVisibleTop.nodeId,
      target: SEQ_PLACEHOLDER_ROW_ID,
      sourceHandle: previewIsLast ? DEFAULT_SOURCE_HANDLE_ID : SEQUENTIAL_BAR_HANDLE_IDS.source,
      targetHandle: SEQUENTIAL_BAR_HANDLE_IDS.target,
      type: SEQ_CONNECTOR_EDGE_TYPE,
      data: {
        kind: 'step',
        waypoints: EMPTY_WAYPOINTS,
        hideArrowHead: true,
        ...(previewIsLast ? { preview: true, ignorePreviewConnection: true } : {}),
      },
      ...(previewIsLast ? { style: SEQ_PREVIEW_EDGE_STYLE } : {}),
    });
  }

  return edges;
}

/**
 * Stamps each numbered row's clone with `node.ariaLabel` ("Step {n} of {total}: {label}").
 * `total` counts every numbered row regardless of visibility so it does not shift under
 * collapse. The label resolves through the registry like BaseNode's printed label, with a
 * readable fallback for registry-less hosts. Hook-only: needs registry + lingui from context.
 */
function stampStepAriaLabels(
  nodes: Node[],
  projection: SequenceProjection,
  registry: NodeTypeRegistry | null,
  translate: TranslateFn
): Node[] {
  const stepNumberByRowId = new Map<string, number>();
  let total = 0;
  for (const row of projection.rows) {
    if (row.stepNumber === undefined) continue;
    stepNumberByRowId.set(row.nodeId, row.stepNumber);
    total += 1;
  }
  if (total === 0) return nodes;

  return nodes.map((node) => {
    const stepNumber = stepNumberByRowId.get(node.id);
    if (stepNumber === undefined) return node;

    const manifest = registry?.getManifest(node.type ?? '');
    const display = resolveDisplay(manifest?.display, {
      display: (node.data as { display?: InstanceDisplayConfig } | undefined)?.display,
    });

    const ariaLabel = translate({
      id: 'sequential-canvas.step.aria-label',
      message: 'Step {stepNumber} of {total}: {label}',
      values: { stepNumber, total, label: display.label },
    });

    return { ...node, ariaLabel };
  });
}

/**
 * Reuses the prior object for every derived row whose rendered inputs did not change, so a
 * selection update lets xyflow keep its internal entries instead of reconciling the graph.
 */
function reuseUnchangedSequentialNodes(previous: Node[], next: Node[]): Node[] {
  const previousById = new Map(previous.map((node) => [node.id, node]));
  return next.map((node) => {
    const prior = previousById.get(node.id);
    if (!prior) return node;

    // Synthetic rows rebuild their `data` object every pass, so compare it by content.
    const hasGeneratedData =
      node.type === SEQ_START_NODE_TYPE || node.type === SEQ_PLACEHOLDER_NODE_TYPE;
    const dataEqual =
      Object.is(prior.data, node.data) ||
      (hasGeneratedData && shallowEqualExcept(prior.data, node.data));

    return prior.position.x === node.position.x &&
      prior.position.y === node.position.y &&
      dataEqual &&
      shallowEqualExcept(prior, node, POSITION_AND_DATA_KEYS)
      ? prior
      : node;
  });
}

/**
 * Hook form of {@link deriveSequentialGraph} with structural-fingerprint memoization:
 * projection and layout recompute only when the fingerprint changes, so a rename keystroke
 * reuses them. Connector edges are reference-stable across data-only changes.
 */
export function useSequentialGraph<N extends Node, E extends Edge>(
  args: UseSequentialGraphArgs<N, E>
): SequentialGraph<N, E> {
  const {
    nodes,
    edges,
    view,
    collapsedStepIds,
    onAddTrigger,
    onPlaceholderAdd,
    isSequenceEdge,
    isSequenceNode,
    isStartNode,
    isContainerNode,
    resolveBranchLabel,
    getBranchHandles,
    canAddToLane,
    insertSlot,
    layoutOptions,
    nodesById,
  } = args;

  const { _ } = useSafeLingui();
  const registry = useOptionalNodeTypeRegistry();
  const previousSeqNodesRef = useRef<Node[]>([]);

  // A stable wrapper, so an inline host callback does not churn the start node's data.
  const onAddTriggerRef = useRef(onAddTrigger);
  onAddTriggerRef.current = onAddTrigger;
  const hasAddTrigger = onAddTrigger !== undefined;
  const stableOnAddTrigger = useMemo(
    () => (hasAddTrigger ? () => onAddTriggerRef.current?.() : undefined),
    [hasAddTrigger]
  );
  const canonicalById = useMemo(() => nodesById ?? indexById(nodes), [nodesById, nodes]);

  const collapsed = collapsedStepIds ?? EMPTY_SET;
  const inSequentialView = view === 'sequential';

  // Everything the projection reads, as one string: graph shape, resolved lane labels, and
  // the result of every predicate (keyed on results, not identities, so a re-created
  // predicate on a rename keystroke does not re-project). Skipped entirely in flow view.
  const fingerprint = useMemo(() => {
    if (!inSequentialView) return '';
    const labels = edges
      .map(
        (edge) =>
          // NUL separates id from label so neither can forge a collision. Keep it as the
          // `\u0000` escape: a raw NUL byte makes grep treat this file as binary.
          `${edge.id}\u0000${resolveBranchLabel?.(edge.source, sourceHandleOf(edge)) ?? edgeDataLabel(edge) ?? ''}`
      )
      .sort()
      .join('|');
    const lanes = getBranchHandles
      ? nodes
          .map(
            (node) =>
              `${node.id}:${getBranchHandles(node)
                .map((h) => `${h.id}=${h.label}`)
                .join(',')}`
          )
          .join('|')
      : '';
    return [
      sequenceFingerprint(nodes, edges, collapsed),
      labels,
      predicateFingerprint(edges, isSequenceEdge, 1),
      predicateFingerprint(nodes, isSequenceNode, 1),
      predicateFingerprint(nodes, isStartNode, 0),
      predicateFingerprint(nodes, isContainerNode, 0),
      lanes,
    ].join('\u0002');
  }, [
    inSequentialView,
    nodes,
    edges,
    collapsed,
    resolveBranchLabel,
    getBranchHandles,
    isSequenceEdge,
    isSequenceNode,
    isStartNode,
    isContainerNode,
  ]);

  // A data-only edit (rename keystroke) yields the same fingerprint and reuses the projection.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the structural fingerprint by design.
  const projection = useMemo(() => {
    if (!inSequentialView) return null;
    return projectSequenceForView(args, collapsed);
  }, [fingerprint, inSequentialView]);

  // Layout is kept separate from the projection memo so the insert-preview gap can re-run it
  // without re-projecting.
  const renderedProjection = useMemo(() => {
    if (!projection) return null;
    return insertSlot ? projectionWithPreviewRow(projection, insertSlot) : projection;
  }, [projection, insertSlot]);

  const layout = useMemo(
    () => (renderedProjection ? layoutSequence(renderedProjection, layoutOptions) : null),
    [renderedProjection, layoutOptions]
  );

  const seqNodes = useMemo(() => {
    if (!projection || !layout) return null;
    const built = assembleSequentialNodes(
      projection,
      layout,
      canonicalById,
      { onAddTrigger: stableOnAddTrigger, onPlaceholderAdd, canAddToLane },
      layoutOptions
    );
    const stamped = stampStepAriaLabels(built, projection, registry, _);
    // Render-phase ref write that folds over history: a StrictMode double-invoke can seed
    // `previous` from an uncommitted render. Safe, since reuse only substitutes `prior` when
    // equal, so staleness costs reference stability, never a wrong value. Must stay in render.
    const stable = reuseUnchangedSequentialNodes(previousSeqNodesRef.current, stamped);
    previousSeqNodesRef.current = stable;
    return stable;
  }, [
    projection,
    layout,
    canonicalById,
    stableOnAddTrigger,
    onPlaceholderAdd,
    canAddToLane,
    layoutOptions,
    registry,
    _,
  ]);

  // Connector edges depend only on the rendered projection and layout, so a data-only change
  // keeps their array identity.
  const seqEdges = useMemo(
    () => (renderedProjection && layout ? buildSequentialEdges(renderedProjection, layout) : null),
    [renderedProjection, layout]
  );

  if (!inSequentialView || !projection || !seqNodes || !seqEdges) {
    return { nodes, edges, projection: null, layout: null };
  }

  return {
    nodes: seqNodes as unknown as N[],
    edges: seqEdges as unknown as E[],
    projection,
    layout,
  };
}
