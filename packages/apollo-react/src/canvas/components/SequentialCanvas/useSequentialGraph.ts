import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';
import {
  DEFAULT_SOURCE_HANDLE_ID,
  PREVIEW_NODE_ID,
  SEQ_BAR_HEIGHT,
  SEQ_BAR_WIDTH,
  SEQ_PLACEHOLDER_NODE_TYPE,
  SEQ_ROW_GAP,
  SEQ_START_NODE_TYPE,
} from '../../constants';
import type { NodeTypeRegistry } from '../../core';
import { useOptionalNodeTypeRegistry } from '../../core';
import type { InstanceDisplayConfig } from '../../schema/node-instance';
import { resolveDisplay } from '../../utils/manifest-resolver';
import { sequenceFingerprint } from '../../utils/sequential/fingerprint';
import { layoutSequence } from '../../utils/sequential/layoutSequence';
import { projectionWithPreviewRow } from '../../utils/sequential/previewRow';
import { projectSequence } from '../../utils/sequential/projectSequence';
import type {
  CanvasView,
  InsertionSlot,
  LayoutSequenceOptions,
  SequenceLayout,
  SequenceProjection,
} from '../../utils/sequential/sequential.types';
import { EMPTY_WAYPOINTS } from '../Edges/shared/constants';
import type { SequentialConnectorData } from './edges/SequentialConnectorEdge.types';
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

/** The translate function `useSafeLingui()._` returns; used to type the aria-label formatter. */
type TranslateFn = ReturnType<typeof useSafeLingui>['_'];

const EMPTY_COLLAPSED: ReadonlySet<string> = new Set();

/**
 * Stable string over a predicate applied to each item, used only as a memo
 * guard so the projection recomputes when predicate *results* (not identity)
 * change. When the predicate is absent, every item falls back to `whenAbsent`.
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
  /** Registry-driven trigger predicate; matching nodes collapse into the synthetic start row. */
  isStartNode?: (node: N) => boolean;
  /** Registry-driven predicate preserving empty manifest containers. */
  isContainerNode?: (node: N) => boolean;
  resolveBranchLabel?: (nodeId: string, handleId: string) => string;
  /** Registry-driven branch-lane handles for a parent node (see projectSequence). */
  getBranchHandles?: (node: N) => { id: string; label: string }[];
  /** Opens the Add Node panel for an empty branch lane's "+ Add step" placeholder. */
  onLaneAdd?: (slot: InsertionSlot) => void;
  /**
   * The slot whose Add Node panel is currently open, if any. While set, the
   * layout re-runs with a synthetic preview row spliced in at the slot, opening
   * a one-row gap and re-routing every connector from the shifted geometry. Only
   * the layout memo depends on it; the projection memo stays fingerprint-keyed
   * (D12), so this never re-projects.
   */
  insertSlot?: InsertionSlot;
  /** Geometry overrides applied consistently to rows, connectors, gutter, and preview layout. */
  layoutOptions?: LayoutSequenceOptions;
}

export interface SequentialGraph<N extends Node, E extends Edge> {
  nodes: N[];
  edges: E[];
  projection: SequenceProjection | null;
  /**
   * The geometry pass backing `nodes`' positions. Exposed so consumers like
   * `SequentialGutter` (WS5) can align the step-number gutter to the exact
   * same coordinates without re-deriving them or reading node DOM.
   */
  layout: SequenceLayout | null;
}

/**
 * Derives the sequential view's node/edge arrays from the canonical graph (D4):
 *  - each projected row becomes a clone of its canonical node that KEEPS its real
 *    `type` (so BaseNode resolves the real manifest and the bar looks identical to
 *    the card), takes its position from `layoutSequence`, is stamped
 *    `width = SEQ_BAR_WIDTH`, flattened (`parentId` cleared so the absolute layout
 *    positions are honored), made non-draggable, and hidden when a collapsed
 *    ancestor parks it. `data` and `selected` are passed through by reference so
 *    execution/validation contexts, memoization, and selection all keep working;
 *  - a synthetic "Workflow start" bar is injected above the first row and a
 *    terminal "Add step" placeholder below the last top-level row (both view-only,
 *    filtered from the change callbacks);
 *  - each projection connector becomes a reference-stable
 *    {@link SequentialConnectorData} edge, plus synthetic connectors joining the
 *    start/placeholder bars.
 *
 * This is a PURE function so the round-trip/derivation tests exercise it without
 * mounting xyflow. The hook {@link useSequentialGraph} memoizes it per D12.
 */
export function deriveSequentialGraph<N extends Node, E extends Edge>(
  args: UseSequentialGraphArgs<N, E>
): SequentialGraph<N, E> {
  const { nodes, edges } = args;
  const collapsed = args.collapsedStepIds ?? EMPTY_COLLAPSED;
  const projection = projectSequence(nodes, edges, {
    collapsedStepIds: collapsed,
    isSequenceEdge: args.isSequenceEdge as ((edge: Edge) => boolean) | undefined,
    isStartNode: args.isStartNode as ((node: Node) => boolean) | undefined,
    isContainerNode: args.isContainerNode as ((node: Node) => boolean) | undefined,
    resolveBranchLabel: args.resolveBranchLabel,
    getBranchHandles: args.getBranchHandles as
      | ((node: Node) => { id: string; label: string }[])
      | undefined,
  });
  const renderedProjection = args.insertSlot
    ? projectionWithPreviewRow(projection, args.insertSlot)
    : projection;
  const layout = layoutSequence(renderedProjection, args.layoutOptions);

  const nodesById = new Map(nodes.map((node) => [node.id, node] as const));
  const seqNodes = buildSequentialNodes(
    projection,
    layout,
    nodesById,
    {
      onAddTrigger: args.onAddTrigger,
      onPlaceholderAdd: args.onPlaceholderAdd,
      onLaneAdd: args.onLaneAdd,
    },
    args.layoutOptions
  );
  const seqEdges = buildSequentialEdges(renderedProjection, layout);

  return {
    nodes: seqNodes as unknown as N[],
    edges: seqEdges as unknown as E[],
    projection,
    layout,
  };
}

interface SyntheticCallbacks {
  onAddTrigger?: () => void;
  onPlaceholderAdd?: () => void;
  /** Wired onto each empty branch-lane placeholder's click, with its own slot. */
  onLaneAdd?: (slot: InsertionSlot) => void;
}

function buildSequentialNodes<N extends Node>(
  projection: SequenceProjection,
  layout: SequenceLayout,
  nodesById: ReadonlyMap<string, N>,
  callbacks: SyntheticCallbacks,
  layoutOptions?: LayoutSequenceOptions
): Node[] {
  const barWidth = layoutOptions?.barWidth ?? SEQ_BAR_WIDTH;
  const barHeight = layoutOptions?.barHeight ?? SEQ_BAR_HEIGHT;
  const rowGap = layoutOptions?.rowGap ?? SEQ_ROW_GAP;
  const pitch = barHeight + rowGap;
  const clones: Node[] = [];
  const orphanClones: Node[] = [];
  let firstTopY: number | undefined;
  let firstOrphanY: number | undefined;
  // Lowest visible, non-orphan row (any depth), so the terminal placeholder can
  // sit below the WHOLE stack rather than just below the last top-level row.
  let maxVisibleY: number | undefined;

  for (const row of projection.rows) {
    // Empty branch-lane placeholder: a synthetic dashed "+ Add step" bar with no
    // canonical node. Rendered via the placeholder node type, entered mid-left by
    // its branch-entry connector (Part A), and clicking it appends the first node
    // into that lane via the carried slot.
    if (row.lanePlaceholder) {
      const laneSlot = row.lanePlaceholder;
      const onLaneAdd = callbacks.onLaneAdd;
      clones.push({
        id: row.nodeId,
        type: SEQ_PLACEHOLDER_NODE_TYPE,
        position: layout.positions.get(row.nodeId) ?? { x: 0, y: 0 },
        width: barWidth,
        height: barHeight,
        draggable: false,
        // ReactFlow sets pointer-events:none on wrappers that are neither
        // selectable nor draggable and have no node-level click handler. Keep
        // the row hit-testable whenever its inner Add-step button is active;
        // that button stops propagation, so this does not select the row.
        selectable: onLaneAdd !== undefined,
        hidden: !row.visible,
        data: {
          onAdd: onLaneAdd ? () => onLaneAdd(laneSlot) : undefined,
          insertionSlotId: laneSlot.id,
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
      // Declare the layout-owned bar height up front so it matches BaseNode's
      // bar `computedHeight`. Without it the controlled `nodes`
      // array re-applies `height: undefined` on every sync, BaseNode's
      // height write-back re-sets it via `updateNode`, and the two fight
      // through `updateNodeInternals` -- a loop that self-settles at small
      // graphs but blows React's nested-update limit at ~150 nodes.
      height: barHeight,
      draggable: false,
      hidden: !row.visible,
      // Flatten container nesting: layout positions are absolute, so a residual
      // parentId would double-offset the clone.
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

  // A laid-out preview row (Add Node panel open) can be the new lowest row on a
  // tail append; keep the terminal placeholder below it too.
  const previewY = layout.positions.get(PREVIEW_NODE_ID)?.y;
  if (previewY !== undefined) {
    maxVisibleY = maxVisibleY === undefined ? previewY : Math.max(maxVisibleY, previewY);
  }

  // Keep the synthetic start bar one pitch above the earliest rendered
  // top-level row. During a head insertion the preview temporarily becomes
  // that earliest row; deriving startY only from the first canonical row would
  // move the start bar down into the preview's slot and stack the two nodes.
  const earliestTopY = Math.min(firstTopY ?? Number.POSITIVE_INFINITY, previewY ?? Infinity);
  const startY = (Number.isFinite(earliestTopY) ? earliestTopY : 0) - pitch;
  // Below the ENTIRE visible stack (any depth), not just the last top-level row,
  // so it never lands inside a trailing container's body and overlap a nested
  // leaf's add affordance.
  const placeholderY =
    firstOrphanY !== undefined ? firstOrphanY - pitch : (maxVisibleY ?? -pitch) + pitch;

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
    height: barHeight,
    draggable: false,
    selectable: callbacks.onPlaceholderAdd !== undefined,
    data: { onAdd: callbacks.onPlaceholderAdd } satisfies SequentialPlaceholderNodeData,
  };

  return [startNode, ...clones, placeholderNode, ...orphanClones];
}

function buildSequentialEdges(projection: SequenceProjection, layout: SequenceLayout): Edge[] {
  const edges: Edge[] = projection.connectors.map((connector) => {
    const isPreviewConnector =
      connector.sourceRowId === PREVIEW_NODE_ID || connector.targetRowId === PREVIEW_NODE_ID;
    const data: SequentialConnectorData = {
      kind: connector.kind,
      label: connector.label,
      waypoints: layout.connectorWaypoints.get(connector.id) ?? EMPTY_WAYPOINTS,
      // The preview connectors retain the semantic slot for canonical handle
      // resolution below, but must not offer another insert button while the
      // Add Node panel is already open.
      slot: isPreviewConnector ? undefined : connector.slot,
      preview: isPreviewConnector || undefined,
      hideArrowHead: connector.kind === 'goto',
    };
    return {
      id: connector.id,
      source: connector.sourceRowId,
      target: connector.targetRowId,
      sourceHandle:
        connector.sourceRowId === PREVIEW_NODE_ID
          ? 'output'
          : isPreviewConnector
            ? (connector.slot?.source?.handleId ?? SEQUENTIAL_BAR_HANDLE_IDS.source)
            : SEQUENTIAL_BAR_HANDLE_IDS.source,
      // Branch/container-entry connectors enter the child's mid-left; every
      // other kind drops into its top handle.
      targetHandle:
        connector.targetRowId === PREVIEW_NODE_ID
          ? connector.kind === 'branch-entry'
            ? SEQUENTIAL_BAR_HANDLE_IDS.branchTarget
            : 'input'
          : isPreviewConnector
            ? (connector.slot?.target?.handleId ?? SEQUENTIAL_BAR_HANDLE_IDS.target)
            : connector.kind === 'branch-entry'
              ? SEQUENTIAL_BAR_HANDLE_IDS.branchTarget
              : SEQUENTIAL_BAR_HANDLE_IDS.target,
      type: SEQ_CONNECTOR_EDGE_TYPE,
      data,
      ...(isPreviewConnector
        ? {
            style: {
              opacity: 0.8,
              stroke: 'var(--canvas-selection-indicator)',
              strokeWidth: 2,
            },
          }
        : {}),
    };
  });

  // Synthetic joins: start -> first top row, last top row -> placeholder. When
  // there are no rows the two synthetic bars connect directly.
  const topRows = projection.rows.filter((row) => row.depth === 0 && !row.orphan);
  const firstTop = topRows[0];
  const lastVisibleTop = [...topRows].reverse().find((row) => row.visible);

  const syntheticData = (hideArrowHead = true): SequentialConnectorData => ({
    kind: 'step',
    waypoints: EMPTY_WAYPOINTS,
    hideArrowHead,
  });

  const syntheticPreviewData = (hideArrowHead = true): SequentialConnectorData => ({
    ...syntheticData(hideArrowHead),
    preview: true,
    ignorePreviewConnection: true,
  });

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
    targetHandle: previewIsFirst ? 'input' : SEQUENTIAL_BAR_HANDLE_IDS.target,
    type: SEQ_CONNECTOR_EDGE_TYPE,
    data: previewIsFirst
      ? syntheticPreviewData(false)
      : { ...syntheticData(firstTop === undefined), slot: headSlot },
    ...(previewIsFirst
      ? {
          style: {
            opacity: 0.8,
            stroke: 'var(--canvas-selection-indicator)',
            strokeWidth: 2,
          },
        }
      : {}),
  });

  if (lastVisibleTop) {
    const previewIsLast = lastVisibleTop.nodeId === PREVIEW_NODE_ID;
    edges.push({
      id: SEQ_PLACEHOLDER_EDGE_ID,
      source: lastVisibleTop.nodeId,
      target: SEQ_PLACEHOLDER_ROW_ID,
      sourceHandle: previewIsLast ? 'output' : SEQUENTIAL_BAR_HANDLE_IDS.source,
      targetHandle: SEQUENTIAL_BAR_HANDLE_IDS.target,
      type: SEQ_CONNECTOR_EDGE_TYPE,
      data: previewIsLast ? syntheticPreviewData() : syntheticData(),
      ...(previewIsLast
        ? {
            style: {
              opacity: 0.8,
              stroke: 'var(--canvas-selection-indicator)',
              strokeWidth: 2,
            },
          }
        : {}),
    });
  }

  return edges;
}

/**
 * Stamps each numbered row's clone with `node.ariaLabel` (xyflow renders this
 * as `aria-label` on the node's DOM wrapper): "Step {n} of {total}: {label}"
 * (D8). `total` counts every numbered row regardless of visibility, so it
 * never shifts when a container collapses (D7's stable-numbering guarantee
 * extends to the announced total). The label is resolved through the node
 * type registry the same way `BaseNode` resolves its printed label
 * (`resolveDisplay(manifest.display, {display: node.data.display})`), so the
 * announced name matches what's on the bar; a registry-less host (or an
 * unrecognized type) still gets a readable fallback ("Unknown Node") instead
 * of a blank label. Synthetic rows (start bar, placeholder) are left
 * untouched -- they already carry their own visible, non-templated text.
 *
 * This only runs inside the {@link useSequentialGraph} hook (which has React
 * context for the registry + lingui), not {@link deriveSequentialGraph} (the
 * pure function exercised directly by tests without mounting either provider).
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
 * React hook wrapping {@link deriveSequentialGraph} with the D12 memoization:
 * projection + layout recompute only when the STRUCTURAL fingerprint changes, so
 * a rename keystroke (data-only) reuses them. The clone nodes recompute when the
 * canonical `nodes` reference changes (to reflect new `data`), always reading the
 * fingerprint-memoized layout positions; the connector edges are reference-stable
 * across data-only changes (they depend only on projection + layout), satisfying
 * the WS3 edge-data stability contract.
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
    isStartNode,
    isContainerNode,
    resolveBranchLabel,
    getBranchHandles,
    onLaneAdd,
    insertSlot,
    layoutOptions,
  } = args;

  const { _ } = useSafeLingui();
  const registry = useOptionalNodeTypeRegistry();

  const collapsed = collapsedStepIds ?? EMPTY_COLLAPSED;
  const fingerprint = useMemo(
    () => sequenceFingerprint(nodes, edges, collapsed),
    [nodes, edges, collapsed]
  );
  // These fingerprints only guard the sequential projection memo below, which
  // short-circuits to null in flow view; skip the full-graph passes there.
  const inSequentialView = view === 'sequential';
  const labelFingerprint = useMemo(
    () =>
      inSequentialView
        ? edges
            .map((edge) => {
              const handleId = edge.sourceHandle ?? DEFAULT_SOURCE_HANDLE_ID;
              const resolved = resolveBranchLabel?.(edge.source, handleId);
              const fallback = (edge.data as { label?: string | null } | undefined)?.label;
              // NUL separates id from label so neither can forge a collision.
              return `${edge.id} ${resolved ?? fallback ?? ''}`;
            })
            .sort()
            .join('|')
        : '',
    [inSequentialView, edges, resolveBranchLabel]
  );
  const edgeInclusionFingerprint = useMemo(
    () => (inSequentialView ? predicateFingerprint(edges, isSequenceEdge, 1) : ''),
    [inSequentialView, edges, isSequenceEdge]
  );
  const startNodeFingerprint = useMemo(
    () => (inSequentialView ? predicateFingerprint(nodes, isStartNode, 0) : ''),
    [inSequentialView, nodes, isStartNode]
  );
  const containerNodeFingerprint = useMemo(
    () => (inSequentialView ? predicateFingerprint(nodes, isContainerNode, 0) : ''),
    [inSequentialView, nodes, isContainerNode]
  );
  // Which nodes are parents (branch-lane handles + their labels), so the
  // projection recomputes when a node gains/loses lanes or a lane relabels.
  const branchHandlesFingerprint = useMemo(
    () =>
      inSequentialView && getBranchHandles
        ? nodes
            .map(
              (node) =>
                `${node.id}:${getBranchHandles(node)
                  .map((h) => `${h.id}=${h.label}`)
                  .join(',')}`
            )
            .join('|')
        : '',
    [inSequentialView, nodes, getBranchHandles]
  );

  // Recompute the projection only on a structural change (the fingerprint, D12)
  // or when the projection predicates change identity; a data-only edit (e.g. a
  // rename keystroke) produces the same fingerprint string and reuses the cached
  // projection. Keying on `fingerprint` instead of the raw nodes/edges arrays is
  // the whole point, so the exhaustive-deps rule is intentionally overridden.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the structural fingerprint by design (D12).
  const projection = useMemo(() => {
    if (view !== 'sequential') return null;
    return projectSequence(nodes, edges, {
      collapsedStepIds: collapsed,
      isSequenceEdge: isSequenceEdge as ((edge: Edge) => boolean) | undefined,
      isStartNode: isStartNode as ((node: Node) => boolean) | undefined,
      isContainerNode: isContainerNode as ((node: Node) => boolean) | undefined,
      resolveBranchLabel,
      getBranchHandles: getBranchHandles as
        | ((node: Node) => { id: string; label: string }[])
        | undefined,
    });
  }, [
    fingerprint,
    labelFingerprint,
    edgeInclusionFingerprint,
    startNodeFingerprint,
    containerNodeFingerprint,
    branchHandlesFingerprint,
    view,
  ]);

  // Layout is a cheap pure geometry pass, kept separate from the projection memo
  // so it can re-run for the insert-preview gap WITHOUT re-projecting: while a
  // slot's Add Node panel is open, lay out a preview-augmented projection so the
  // gap opens one row, the preview bar lands in its slot, and every connector
  // re-routes from the shifted positions.
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
    const nodesById = new Map(nodes.map((node) => [node.id, node] as const));
    const built = buildSequentialNodes(
      projection,
      layout,
      nodesById,
      {
        onAddTrigger,
        onPlaceholderAdd,
        onLaneAdd,
      },
      layoutOptions
    );
    return stampStepAriaLabels(built, projection, registry, _);
  }, [
    projection,
    layout,
    nodes,
    onAddTrigger,
    onPlaceholderAdd,
    onLaneAdd,
    layoutOptions,
    registry,
    _,
  ]);

  const seqEdges = useMemo(() => {
    if (!renderedProjection || !layout) return null;
    return buildSequentialEdges(renderedProjection, layout);
  }, [renderedProjection, layout]);

  if (view !== 'sequential' || !projection || !seqNodes || !seqEdges) {
    return { nodes, edges, projection: null, layout: null };
  }

  return {
    nodes: seqNodes as unknown as N[],
    edges: seqEdges as unknown as E[],
    projection,
    layout,
  };
}
