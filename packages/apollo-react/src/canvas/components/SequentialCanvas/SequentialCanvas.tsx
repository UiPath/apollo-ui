import type {
  Edge,
  EdgeChange,
  EdgeTypes,
  Node,
  NodeChange,
  NodeTypes,
  XYPosition,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SOURCE_HANDLE_ID, PREVIEW_NODE_ID } from '../../constants';
import { useOptionalNodeTypeRegistry } from '../../core';
import { usePreviewNode } from '../../hooks/usePreviewNode';
import { isPreviewEdge } from '../../utils/createPreviewNode';
import { getIcon } from '../../utils/icon-registry';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import {
  indexNodesByParent,
  SEQ_LANE_PLACEHOLDER_PREFIX,
} from '../../utils/sequential/graph-helpers';
import { resolveSequenceMetrics } from '../../utils/sequential/layoutSequence';
import { removeStep } from '../../utils/sequential/mutations';
import { createSequencePredicates } from '../../utils/sequential/predicates';
import type {
  InsertionSlot,
  LayoutSequenceOptions,
  SequenceProjection,
} from '../../utils/sequential/sequential.types';
import { AddNodeManager } from '../AddNodePanel/AddNodeManager';
import { AddNodePreview } from '../AddNodePanel/AddNodePreview';
import { BaseCanvas } from '../BaseCanvas/BaseCanvas';
import { useStableNodeIdSet } from '../BaseCanvas/ReadOnlyNodesContext';
import { BaseNode } from '../BaseNode/BaseNode';
import type { BaseNodeBarAttachment } from '../BaseNode/BaseNodeBar';
import { InitialsBadge } from '../shared/InitialsBadge';
import { SequentialConnectorEdge } from './edges/SequentialConnectorEdge';
import { getSequentialIgnoredNodeTypes } from './edges/sequentialInsert';
import { useSequentialInsert } from './edges/useSequentialInsert';
import {
  SEQUENTIAL_SYNTHETIC_NODE_TYPES,
  SequentialInsertPreviewNode,
  SequentialStepNode,
} from './nodes';
import { resolveFlowEdgeTypes } from './resolveFlowEdgeTypes';
import { resolveFlowNodeComponent } from './resolveFlowNodeComponent';
import { SequentialAccessibleList } from './SequentialAccessibleList';
import {
  type SequentialAttachmentsByStepId,
  SequentialAttachmentsProvider,
} from './SequentialAttachmentsContext';
import type { SequentialCanvasProps } from './SequentialCanvas.types';
import { SequentialCollapsedRowsProvider } from './SequentialCollapsedRowsContext';
import { SequentialGutter } from './SequentialGutter';
import { SequentialInsertGapProvider } from './SequentialInsertGapContext';
import { SequentialInsertLayer } from './SequentialInsertLayer';
import { SequentialInsertStateProvider } from './SequentialInsertStateContext';
import { SequentialLaneAddProvider } from './SequentialLaneAddContext';
import { SequentialMoveActionsProvider } from './SequentialMoveActionsContext';
import { useOptionalSequentialView } from './SequentialViewContext';
import {
  forwardSequentialEdgeChanges,
  forwardSequentialNodeChanges,
  graphChangeSetToEdgeChanges,
  graphChangeSetToNodeChanges,
  nodeChangeId,
} from './sequentialChangeFilters';
import {
  SEQ_CONNECTOR_EDGE_TYPE,
  SEQ_FULL_RENDER_MAX_NODES,
  SEQ_PLACEHOLDER_ROW_ID,
} from './sequentialGraph.constants';
import {
  getSequentialMoveSlot,
  resolveTailInsertionSlot,
  type SequentialMoveDirection,
} from './sequentialMoveActions';
import { useCanvasViewViewport } from './useCanvasViewViewport';
import { SEQ_SYNTHETIC_ROW_IDS, useSequentialGraph } from './useSequentialGraph';
import { toggleCollapsedStepIds, useSequentialKeyboard } from './useSequentialKeyboard';
import { useSequentialMoveActionsValue } from './useSequentialMoveActionsValue';

const EDGE_TYPES: EdgeTypes = {
  [SEQ_CONNECTOR_EDGE_TYPE]: SequentialConnectorEdge as EdgeTypes[string],
  // The Add Node preview stamps its transient edges `type: 'default'`; route them through
  // the same connector so the preview traces the real path instead of xyflow's bezier.
  default: SequentialConnectorEdge as EdgeTypes[string],
};

const EMPTY_POSITIONS: ReadonlyMap<string, XYPosition> = new Map();

/** What a bar shows for an attached resource; `iconKey` only detects a changed icon. */
export interface ResourceDescription {
  label: string;
  icon?: React.ReactNode;
  iconKey?: string;
}

export interface CollectStepAttachmentsOptions<N extends Node, E extends Edge> {
  isSequenceNode: (node: N) => boolean;
  /** The projection's edge predicate; attachments are exactly the edges it rejects. */
  isSequenceEdge: (edge: E) => boolean;
  describeResource: (node: N) => ResourceDescription;
  /** Reuses an existing id index instead of building one. */
  nodesById?: ReadonlyMap<string, N>;
}

export interface StepAttachments {
  byStepId: SequentialAttachmentsByStepId;
  /** Content key per step, so an unchanged list is reused by identity next time. */
  keyByStepId: ReadonlyMap<string, string>;
}

export const EMPTY_STEP_ATTACHMENTS: StepAttachments = {
  byStepId: new Map(),
  keyByStepId: new Map(),
};

/**
 * Groups non-sequence (artifact) edges by the step they hang off: the non-sequence endpoint
 * is the resource, the other is the step. An artifact edge between two steps or two
 * resources is not an attachment. A step's array is reused from `previous` when unchanged,
 * so bars reading it through context do not re-render.
 */
export function collectStepAttachments<N extends Node, E extends Edge>(
  nodes: readonly N[],
  edges: readonly E[],
  options: CollectStepAttachmentsOptions<N, E>,
  previous?: StepAttachments
): StepAttachments {
  const byId = options.nodesById ?? new Map(nodes.map((node) => [node.id, node]));
  const grouped = new Map<string, { attachments: BaseNodeBarAttachment[]; key: string[] }>();
  for (const edge of edges) {
    if (options.isSequenceEdge(edge)) continue;
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    const sourceIsStep = options.isSequenceNode(source);
    if (sourceIsStep === options.isSequenceNode(target)) continue;
    const step = sourceIsStep ? source : target;
    const resource = sourceIsStep ? target : source;
    const handleId = (sourceIsStep ? edge.sourceHandle : edge.targetHandle) ?? undefined;
    const { label, icon, iconKey } = options.describeResource(resource);
    const entry = grouped.get(step.id) ?? { attachments: [], key: [] };
    entry.attachments.push({ id: resource.id, label, icon, handleId });
    entry.key.push(`${resource.id}\u0000${label}\u0000${handleId ?? ''}\u0000${iconKey ?? ''}`);
    grouped.set(step.id, entry);
  }

  const byStepId = new Map<string, BaseNodeBarAttachment[]>();
  const keyByStepId = new Map<string, string>();
  let unchanged = previous !== undefined && previous.keyByStepId.size === grouped.size;
  for (const [stepId, entry] of grouped) {
    const key = entry.key.join('\u0001');
    const priorKey = previous?.keyByStepId.get(stepId);
    const prior = previous?.byStepId.get(stepId);
    const reuse = prior !== undefined && priorKey === key;
    if (!reuse) unchanged = false;
    byStepId.set(stepId, reuse ? prior : entry.attachments);
    keyByStepId.set(stepId, key);
  }
  // Same steps with the same lists: keep the previous result so the context value holding
  // it stays identity-stable across data-only edits.
  if (unchanged && previous) return previous;
  return { byStepId, keyByStepId };
}

/**
 * Splits a node's visible source handles into the continuation (spine) output and the
 * branch lanes, in manifest order. Continuation precedence: the registry's explicit
 * default (`isDefaultForType`), then a well-known `output` / `success` id, then the sole
 * candidate. A default that is not itself a candidate is ignored, otherwise every real
 * handle would become a lane. Callers must not pass `getDefaultHandle`'s positional
 * fallback: control-flow manifests flag no default, so it would promote the first lane
 * ("True") to the spine.
 */
export function resolveBranchHandleIds(
  candidates: readonly { id: string }[],
  registryDefaultSourceHandleId: string | undefined
): string[] {
  const continuationId =
    candidates.find((handle) => handle.id === registryDefaultSourceHandleId)?.id ??
    candidates.find((handle) => handle.id === DEFAULT_SOURCE_HANDLE_ID || handle.id === 'success')
      ?.id ??
    (candidates.length === 1 ? candidates[0]?.id : undefined);
  return candidates.filter((handle) => handle.id !== continuationId).map((handle) => handle.id);
}

/**
 * Vertical (n8n-style) projection of the flow graph, rendered on the same mounted
 * BaseCanvas as the canonical flow and selected by the `view` prop. Mutations leave through
 * the standard onNodesChange / onEdgesChange with synthetic rows and view-only geometry
 * filtered out; canonical positions are never written back. Supplies its own
 * ReactFlowProvider so it is a self-contained drop-in.
 */
export function SequentialCanvas<N extends Node = Node, E extends Edge = Edge>(
  props: SequentialCanvasProps<N, E>
) {
  return (
    <ReactFlowProvider>
      <SequentialInsertStateProvider>
        <SequentialCanvasInsertController {...props} />
      </SequentialInsertStateProvider>
    </ReactFlowProvider>
  );
}

/**
 * Owns the insertion-gap state above every insertion hook: SequentialCanvasInner creates
 * the terminal/lane/leaf handlers while connector handlers render below BaseCanvas, and
 * both must publish into the same sink.
 */
function SequentialCanvasInsertController<N extends Node, E extends Edge>(
  props: SequentialCanvasProps<N, E>
) {
  const [activeInsertSlot, setActiveInsertSlot] = useState<InsertionSlot | undefined>(undefined);
  const { previewNode } = usePreviewNode();
  const wasPreviewOpenRef = useRef(false);

  const isPreviewOpen = previewNode !== null;
  useEffect(() => {
    if (isPreviewOpen) {
      wasPreviewOpenRef.current = true;
    } else if (wasPreviewOpenRef.current) {
      wasPreviewOpenRef.current = false;
      setActiveInsertSlot(undefined);
    }
  }, [isPreviewOpen]);

  return (
    <SequentialInsertGapProvider value={setActiveInsertSlot}>
      <SequentialCanvasInner
        {...props}
        activeInsertSlot={activeInsertSlot}
        setActiveInsertSlot={setActiveInsertSlot}
      />
    </SequentialInsertGapProvider>
  );
}

function SequentialCanvasInner<N extends Node, E extends Edge>({
  nodes,
  edges,
  view = 'sequential',
  sequenceLayoutOptions,
  isSequenceNode,
  flowNodeTypes,
  flowEdgeTypes,
  onNodesChange,
  onEdgesChange,
  collapsedStepIds,
  onCollapsedStepIdsChange,
  onPrimaryAction,
  onAddTrigger,
  addNodeManagerProps,
  canvasRef,
  mode = 'view',
  isDarkMode,
  locale,
  fitViewOptions,
  onToolbarAction,
  breakpoints,
  readOnlyNodeIds,
  children,
  activeInsertSlot,
  setActiveInsertSlot,
}: SequentialCanvasProps<N, E> & {
  activeInsertSlot?: InsertionSlot;
  setActiveInsertSlot: Dispatch<SetStateAction<InsertionSlot | undefined>>;
}) {
  const reactFlow = useReactFlow<N, E>();
  const { startInsert, onBeforeNodeAdded } = useSequentialInsert();
  const seqView = useOptionalSequentialView();
  const registry = useOptionalNodeTypeRegistry();
  const isDesignMode = mode === 'design';
  const inSequentialView = view === 'sequential';
  const canEditSequence = isDesignMode && inSequentialView;
  // Stabilized by content: an inline options object from the host would otherwise re-run
  // the layout (and rebuild every connector edge) on each host render.
  const hasLayoutOptions = sequenceLayoutOptions !== undefined;
  const {
    barWidth: optBarWidth,
    barHeight: optBarHeight,
    rowGap: optRowGap,
    indent: optIndent,
  } = sequenceLayoutOptions ?? {};
  const layoutOptions = useMemo<LayoutSequenceOptions | undefined>(
    () =>
      hasLayoutOptions
        ? { barWidth: optBarWidth, barHeight: optBarHeight, rowGap: optRowGap, indent: optIndent }
        : undefined,
    [hasLayoutOptions, optBarWidth, optBarHeight, optRowGap, optIndent]
  );
  const metrics = useMemo(() => resolveSequenceMetrics(layoutOptions), [layoutOptions]);
  // BaseCanvas gates its own interactions on `readOnlyNodeIds`; the sequential delete and
  // move paths emit changes directly, so they re-check the set here. Content-stable, so a
  // host passing a fresh array per render does not churn the move-actions context.
  const readOnlySet = useStableNodeIdSet(readOnlyNodeIds);
  const { nodesById: canonicalById, childrenByParent } = useMemo(
    () => indexNodesByParent(nodes),
    [nodes]
  );

  const getDefaultSourceHandleId = useCallback(
    (nodeType: string) => registry?.getDefaultHandle(nodeType, 'source')?.id,
    [registry]
  );

  // Registry-aware defaults shared with prepareCanvasViewTransition; the host's
  // `isSequenceNode` replaces the sequence predicate entirely.
  const sequencePredicates = useMemo(
    () => createSequencePredicates(registry ? (type) => registry.getManifest(type) : undefined),
    [registry]
  );
  const { isStartNode, isContainerNode: isProjectedContainerNode } = sequencePredicates;
  const isProjectedSequenceNode = isSequenceNode ?? sequencePredicates.isSequenceNode;

  // Keyed on the node object: unchanged nodes keep identity across a rename, so only the
  // edited node re-resolves.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new registry must start a fresh cache.
  const handlesCache = useMemo(
    () => new WeakMap<object, ReturnType<typeof resolveHandles>>(),
    [registry]
  );
  const resolvedHandlesByNodeId = useMemo(() => {
    const result = new Map<string, ReturnType<typeof resolveHandles>>();
    for (const node of nodes) {
      const cached = handlesCache.get(node);
      if (cached) {
        result.set(node.id, cached);
        continue;
      }
      const manifest = node.type ? registry?.getManifest(node.type) : undefined;
      if (!manifest) continue;
      const resolved = resolveHandles(manifest.handleConfiguration, {
        ...(node.data as Record<string, unknown>),
        nodeId: node.id,
      });
      handlesCache.set(node, resolved);
      result.set(node.id, resolved);
    }
    return result;
  }, [nodes, registry, handlesCache]);

  const findResolvedHandle = useCallback(
    (nodeId: string, handleId: string | null | undefined, type: 'source' | 'target') => {
      const nodeType = canonicalById.get(nodeId)?.type;
      const effectiveHandleId =
        handleId ?? (nodeType ? registry?.getDefaultHandle(nodeType, type)?.id : undefined);
      const groups = resolvedHandlesByNodeId.get(nodeId);
      if (!groups) return undefined;
      for (const group of groups) {
        for (const handle of group.handles) {
          if (handle.type === type && handle.id === effectiveHandleId) return handle;
        }
      }
      return undefined;
    },
    [resolvedHandlesByNodeId, canonicalById, registry]
  );

  const isSequenceEdge = useCallback(
    (edge: E) =>
      findResolvedHandle(edge.source, edge.sourceHandle, 'source')?.handleType !== 'artifact' &&
      findResolvedHandle(edge.target, edge.targetHandle, 'target')?.handleType !== 'artifact',
    [findResolvedHandle]
  );

  // Keyed on the node object: a resource's description changes only with its data.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new registry must start a fresh cache.
  const describeCache = useMemo(() => new WeakMap<object, ResourceDescription>(), [registry]);
  const describeResource = useCallback(
    (node: N): ResourceDescription => {
      const cached = describeCache.get(node);
      if (cached) return cached;
      const manifest = node.type ? registry?.getManifest(node.type) : undefined;
      const display = resolveDisplay(manifest?.display, {
        ...(node.data as Record<string, unknown>),
        nodeId: node.id,
      });
      const Icon = display.icon ? getIcon(display.icon) : undefined;
      const described: ResourceDescription = {
        label: display.label,
        iconKey: display.icon,
        icon: Icon ? <Icon /> : <InitialsBadge name={display.label} size="var(--icon-size)" />,
      };
      describeCache.set(node, described);
      return described;
    },
    [registry, describeCache]
  );

  const attachmentsRef = useRef<StepAttachments>(EMPTY_STEP_ATTACHMENTS);
  const attachmentsByStepId = useMemo<SequentialAttachmentsByStepId>(() => {
    if (!inSequentialView) return EMPTY_STEP_ATTACHMENTS.byStepId;
    const next = collectStepAttachments(
      nodes,
      edges,
      {
        isSequenceNode: isProjectedSequenceNode,
        isSequenceEdge,
        describeResource,
        nodesById: canonicalById,
      },
      attachmentsRef.current
    );
    attachmentsRef.current = next;
    return next.byStepId;
  }, [
    inSequentialView,
    nodes,
    edges,
    canonicalById,
    isProjectedSequenceNode,
    isSequenceEdge,
    describeResource,
  ]);

  const resolveBranchLabel = useCallback(
    (nodeId: string, handleId: string) =>
      findResolvedHandle(nodeId, handleId, 'source')?.label ?? handleId,
    [findResolvedHandle]
  );

  // A parent node's branch-lane handles, so empty lanes render as placeholders before any
  // child edge exists. Only an explicitly flagged registry default counts as the spine.
  const getBranchHandles = useCallback(
    (node: N) => {
      const candidates = (resolvedHandlesByNodeId.get(node.id) ?? [])
        .flatMap((group) => group.handles)
        .filter(
          (handle) => handle.type === 'source' && handle.handleType !== 'artifact' && handle.visible
        );
      const defaultHandle = node.type ? registry?.getDefaultHandle(node.type, 'source') : undefined;
      const laneIds = resolveBranchHandleIds(
        candidates,
        defaultHandle?.isDefaultForType ? defaultHandle.id : undefined
      );
      return laneIds.map((id) => ({ id, label: resolveBranchLabel(node.id, id) }));
    },
    [resolvedHandlesByNodeId, resolveBranchLabel, registry]
  );

  const collapsedSet = useStableNodeIdSet(collapsedStepIds);

  // Terminal "Add step" placeholder appends after the last top-level row. The slot is read
  // from a ref so the callback identity stays stable (it feeds the placeholder's data).
  const tailSlotRef = useRef<InsertionSlot | undefined>(undefined);
  const onPlaceholderAdd = useCallback(() => {
    if (!canEditSequence) return;
    const slot = tailSlotRef.current;
    if (!slot?.source) return;
    const placeholder = reactFlow.getNode(SEQ_PLACEHOLDER_ROW_ID);
    startInsert({
      slot,
      source: slot.source.nodeId,
      sourceHandleId: slot.source.handleId ?? DEFAULT_SOURCE_HANDLE_ID,
      target: '',
      targetHandleId: undefined,
      sourcePosition: Position.Bottom,
      position: placeholder?.position ?? { x: 0, y: 0 },
    });
  }, [canEditSequence, reactFlow, startInsert]);

  // An empty branch lane's "+ Add step": insert the lane's first node via the carried slot
  // (source = parent, sourceHandle = the branch handle, containerId set).
  const canonicalByIdRef = useRef(canonicalById);
  canonicalByIdRef.current = canonicalById;
  const onLaneAdd = useCallback(
    (slot: InsertionSlot) => {
      if (!canEditSequence || !slot.source) return;
      const sourceNode = canonicalByIdRef.current.get(slot.source.nodeId);
      const resolvedSource = {
        ...slot.source,
        handleId:
          slot.source.handleId ??
          (sourceNode?.type ? getDefaultSourceHandleId(sourceNode.type) : undefined) ??
          DEFAULT_SOURCE_HANDLE_ID,
      };
      const resolvedSlot: InsertionSlot = { ...slot, source: resolvedSource };
      const placeholder = reactFlow
        .getNodes()
        .find(
          (node) =>
            (node.data as { insertionSlotId?: string } | undefined)?.insertionSlotId === slot.id
        );
      startInsert({
        slot: resolvedSlot,
        source: resolvedSource.nodeId,
        sourceHandleId: undefined,
        target: '',
        targetHandleId: undefined,
        sourcePosition: Position.Bottom,
        position: placeholder?.position ?? { x: 0, y: 0 },
      });
    },
    [canEditSequence, getDefaultSourceHandleId, reactFlow, startInsert]
  );

  const {
    nodes: seqNodesRaw,
    edges: seqEdges,
    projection,
    layout,
  } = useSequentialGraph<N, E>({
    nodes,
    edges,
    view,
    collapsedStepIds: collapsedSet,
    onAddTrigger: canEditSequence ? onAddTrigger : undefined,
    onPlaceholderAdd: canEditSequence ? onPlaceholderAdd : undefined,
    isSequenceEdge,
    isSequenceNode: isProjectedSequenceNode,
    isStartNode,
    isContainerNode: isProjectedContainerNode,
    resolveBranchLabel,
    getBranchHandles,
    canAddToLane: canEditSequence,
    insertSlot: inSequentialView ? activeInsertSlot : undefined,
    layoutOptions,
    nodesById: canonicalById,
  });

  // Lane placeholders carry only their slot id (so the derivation can reuse their node
  // objects); the slot itself is resolved here against the current projection.
  const projectionRef = useRef<SequenceProjection | null>(null);
  projectionRef.current = projection;
  const onLaneAddById = useCallback(
    (slotId: string) => {
      const slot = projectionRef.current?.rows.find(
        (row) => row.lanePlaceholder?.id === slotId
      )?.lanePlaceholder;
      if (slot) onLaneAdd(slot);
    },
    [onLaneAdd]
  );

  const tailSlot = useMemo<InsertionSlot | undefined>(
    () => resolveTailInsertionSlot(projection, nodes, getDefaultSourceHandleId, isStartNode),
    [projection, nodes, getDefaultSourceHandleId, isStartNode]
  );
  // Render-phase ref write, idempotent (derived from this render's inputs only). An effect
  // would leave the tail placeholder's slot undefined until after first paint.
  tailSlotRef.current = tailSlot;

  // The Add Node pipeline adds its preview node/edges via `instance.setNodes` / `setEdges`.
  // In controlled mode xyflow routes those through onNodesChange / onEdgesChange as `add`
  // changes, so the handlers below capture the preview into local state and it is merged
  // here; the change filters keep it out of canonical state. Its position is overridden
  // with the slot the layout opened so the ghost bar sits in the gap.
  const [insertPreviewNode, setInsertPreviewNode] = useState<N | null>(null);
  const [insertPreviewEdges, setInsertPreviewEdges] = useState<E[]>([]);
  const seqNodes = useMemo(() => {
    // A lane placeholder being inserted into loses its layout position (swapped for the
    // preview row), so drop it.
    const base = seqNodesRaw.filter(
      (node) => !node.id.startsWith(SEQ_LANE_PLACEHOLDER_PREFIX) || !!layout?.positions.has(node.id)
    );
    if (!inSequentialView || !insertPreviewNode) return base;
    const slotPosition = layout?.positions.get(PREVIEW_NODE_ID);
    const positionedPreview: N = {
      ...insertPreviewNode,
      ...(slotPosition && { position: slotPosition }),
      width: layoutOptions?.barWidth ?? insertPreviewNode.width,
      height: layoutOptions?.barHeight ?? insertPreviewNode.height,
    };
    return [...base, positionedPreview];
  }, [inSequentialView, seqNodesRaw, insertPreviewNode, layout, layoutOptions]);
  // While a slot is active the hook has already routed preview connectors; rendering the raw
  // showPreviewGraph edges too would duplicate the path with click-time geometry.
  const seqEdgesWithPreview = useMemo(
    () =>
      inSequentialView && !activeInsertSlot && insertPreviewEdges.length > 0
        ? [...seqEdges, ...insertPreviewEdges]
        : seqEdges,
    [inSequentialView, activeInsertSlot, seqEdges, insertPreviewEdges]
  );
  useEffect(() => {
    if (view !== 'flow') return;
    // Functional updates that return the current value bail out instead of re-rendering.
    setInsertPreviewNode((current) => (current === null ? current : null));
    setInsertPreviewEdges((current) => (current.length === 0 ? current : []));
    setActiveInsertSlot((current) => (current === undefined ? current : undefined));
  }, [view, setActiveInsertSlot]);

  // Keyed on the set of types present so both maps are reference-stable across data and
  // position changes.
  const nodeTypeKey = useMemo(
    () => [...new Set(nodes.map((node) => node.type ?? 'default'))].sort().join('|'),
    [nodes]
  );
  const presentTypes = useMemo(() => nodeTypeKey.split('|').filter(Boolean), [nodeTypeKey]);
  // xyflow drops a node whose type is unregistered, and the Add Node pipeline adds a
  // `preview`-typed node, so both maps register one; the host's own `preview` still wins.
  const sequentialNodeTypes = useMemo<NodeTypes>(() => {
    const types: NodeTypes = { ...SEQUENTIAL_SYNTHETIC_NODE_TYPES };
    for (const key of presentTypes) types[key] ??= SequentialStepNode;
    types.default ??= SequentialStepNode;
    // A bar-shaped ghost: the flow-view square reads as an empty slab at the bar's aspect ratio.
    types.preview ??= SequentialInsertPreviewNode;
    return types;
  }, [presentTypes]);
  const resolvedFlowNodeTypes = useMemo<NodeTypes>(() => {
    const types: NodeTypes = { ...flowNodeTypes };
    if (!flowNodeTypes) {
      for (const key of presentTypes) {
        types[key] = resolveFlowNodeComponent(registry?.getManifest(key));
      }
      types.default ??= BaseNode;
    }
    types.preview ??= AddNodePreview;
    return types;
  }, [flowNodeTypes, presentTypes, registry]);
  const nodeTypes = inSequentialView ? sequentialNodeTypes : resolvedFlowNodeTypes;
  const resolvedFlowEdgeTypes = useMemo(() => resolveFlowEdgeTypes(flowEdgeTypes), [flowEdgeTypes]);
  const edgeTypes = inSequentialView ? EDGE_TYPES : resolvedFlowEdgeTypes;

  const syntheticNodeIds = useMemo(() => {
    const ids = new Set(SEQ_SYNTHETIC_ROW_IDS);
    for (const row of projection?.rows ?? []) {
      if (row.lanePlaceholder) ids.add(row.nodeId);
    }
    return ids;
  }, [projection]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<N>[]) => {
      if (view === 'flow') {
        onNodesChange?.(changes);
        return;
      }
      // Apply preview-node changes with xyflow's own reducer into local state (see the
      // preview note above); this runs even when the host wired no onNodesChange.
      const previewChanges = changes.filter((change) => nodeChangeId(change) === PREVIEW_NODE_ID);
      if (previewChanges.length > 0) {
        setInsertPreviewNode((current) => {
          const next = applyNodeChanges(previewChanges, current ? [current] : []);
          return (next[0] as N | undefined) ?? null;
        });
      }

      if (!onNodesChange) return;
      // Clicking a synthetic row selects it and deselects the current step in one batch. The
      // synthetic select is filtered out, so forwarding the deselect alone would clear the
      // host's selection for a click that was an action. (Rows stay `selectable` because
      // xyflow only gives pointer events to selectable or draggable nodes.)
      const selectsSyntheticRow = changes.some(
        (change) => change.type === 'select' && change.selected && syntheticNodeIds.has(change.id)
      );
      const effective = selectsSyntheticRow
        ? changes.filter((change) => !(change.type === 'select' && !change.selected))
        : changes;
      const forwarded = forwardSequentialNodeChanges(effective, syntheticNodeIds, canonicalById);
      if (forwarded.length > 0) onNodesChange(forwarded);
    },
    [view, onNodesChange, syntheticNodeIds, canonicalById]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<E>[]) => {
      if (view === 'flow') {
        onEdgesChange?.(changes);
        return;
      }
      setInsertPreviewEdges((current) => {
        const relevant = changes.filter((change) =>
          change.type === 'add'
            ? isPreviewEdge(change.item)
            : current.some((edge) => edge.id === change.id)
        );
        return relevant.length > 0 ? (applyEdgeChanges(relevant, current) as E[]) : current;
      });

      if (!onEdgesChange) return;
      const forwarded = forwardSequentialEdgeChanges(changes, edges);
      if (forwarded.length > 0) onEdgesChange(forwarded);
    },
    [view, onEdgesChange, edges]
  );

  const isContainerNode = useCallback(
    (nodeId: string) => {
      if (childrenByParent.has(nodeId)) return true;
      const node = canonicalById.get(nodeId);
      return !!node && isProjectedContainerNode(node);
    },
    [canonicalById, childrenByParent, isProjectedContainerNode]
  );

  // Returns whether the delete was handled here. When it is not (view/readonly/flow mode,
  // no projection, no change callback, or a locked node) `handleToolbarAction` falls through
  // to the host's onToolbarAction instead of swallowing the action.
  //
  // The graph and the host callbacks are read through a ref at call time: `handleToolbarAction`
  // feeds BaseCanvas's toolbar store context, which every bar reads, so its identity must
  // follow neither `nodes` nor a host's inline change handlers.
  const deleteInputsRef = useRef({
    projection,
    nodes,
    edges,
    isSequenceEdge,
    readOnlySet,
    onNodesChange,
    onEdgesChange,
  });
  deleteInputsRef.current = {
    projection,
    nodes,
    edges,
    isSequenceEdge,
    readOnlySet,
    onNodesChange,
    onEdgesChange,
  };
  const hasChangeHandler = onNodesChange !== undefined || onEdgesChange !== undefined;
  const deleteStep = useCallback(
    (nodeId: string) => {
      const {
        projection,
        nodes,
        edges,
        isSequenceEdge,
        readOnlySet,
        onNodesChange,
        onEdgesChange,
      } = deleteInputsRef.current;
      if (!canEditSequence || !projection) return false;
      if (!hasChangeHandler) return false;
      if (readOnlySet.has(nodeId)) return false;
      // Only sequence edges are healed across the removed step; artifact edges go with it.
      const changeSet = removeStep(projection, nodeId, {
        nodes,
        edges,
        isSequenceEdge: (edge: Edge) => isSequenceEdge(edge as E),
      });
      onNodesChange?.(graphChangeSetToNodeChanges<N>(changeSet));
      onEdgesChange?.(graphChangeSetToEdgeChanges<E>(changeSet));
      return true;
    },
    [canEditSequence, hasChangeHandler]
  );

  const handleToolbarAction = useCallback<
    NonNullable<SequentialCanvasProps<N, E>['onToolbarAction']>
  >(
    (event) => {
      if (event.actionId === 'delete' && deleteStep(event.nodeId)) return;
      onToolbarAction?.(event);
    },
    [deleteStep, onToolbarAction]
  );

  // Move binding shared by the kebab items and Alt+Arrow. Rebuilt only on a structural
  // change: every bar reads it through context, so a churning value would re-render them all.
  const moveActionsValue = useSequentialMoveActionsValue<N, E>({
    projection,
    nodes,
    edges,
    canonicalById,
    isContainerNode,
    getDefaultSourceHandleId,
    readOnlyNodeIds: readOnlySet,
    onNodesChange,
    onEdgesChange,
  });

  // The lock is enforced inside the shared binding; the check here only skips resolving a
  // slot that would be refused.
  const handleMoveNode = useCallback(
    (nodeId: string, direction: SequentialMoveDirection) => {
      if (!isDesignMode || readOnlySet.has(nodeId)) return;
      const slot = getSequentialMoveSlot(moveActionsValue.getMoveOptions(nodeId), direction);
      if (slot) moveActionsValue.commitMove(nodeId, slot);
    },
    [isDesignMode, readOnlySet, moveActionsValue]
  );

  // The one row order both the gutter and ArrowUp/Down walk.
  const visibleNumberedRows = useMemo(
    () => projection?.rows.filter((row) => row.visible && row.stepNumber !== undefined) ?? [],
    [projection]
  );

  // Selection lives on the canonical `nodes` (clones pass `selected` through by reference).
  const selectedNodeId = useMemo(() => nodes.find((node) => node.selected)?.id, [nodes]);

  const isInteractive = mode !== 'readonly';

  // Selects through the same `select` NodeChanges a click produces. Gated on `isInteractive`
  // to mirror BaseCanvas's selection gating, so readonly canvases cannot select by keyboard.
  const handleSelectRow = useCallback(
    (nodeId: string) => {
      if (!isInteractive) return;
      const changes: NodeChange<N>[] = [];
      for (const node of nodes) {
        if (node.id === nodeId) {
          if (!node.selected) changes.push({ id: node.id, type: 'select', selected: true });
        } else if (node.selected) {
          changes.push({ id: node.id, type: 'select', selected: false });
        }
      }
      if (changes.length > 0) handleNodesChange(changes);
    },
    [isInteractive, nodes, handleNodesChange]
  );

  // Collapse is view-local UI, not a canonical mutation, so it stays available in every mode.
  const handleToggleCollapse = useCallback(
    (nodeId: string, collapsed: boolean) => {
      onCollapsedStepIdsChange?.(toggleCollapsedStepIds(collapsedSet, nodeId, collapsed));
    },
    [collapsedSet, onCollapsedStepIdsChange]
  );

  const { onKeyDown: onSequentialKeyDown } = useSequentialKeyboard({
    rows: visibleNumberedRows,
    selectedNodeId,
    collapsedStepIds: collapsedSet,
    onSelectNode: handleSelectRow,
    onCollapsedStepIdsChange,
    onMoveNode: handleMoveNode,
    onDeleteNode: deleteStep,
    onPrimaryAction,
    isDesignMode,
  });
  // In flow view the rows are empty but Enter would still fire onPrimaryAction for the
  // host's selected node, so the whole handler is a no-op there.
  const onKeyDown = useCallback<NonNullable<typeof onSequentialKeyDown>>(
    (event) => {
      if (view !== 'sequential') return;
      onSequentialKeyDown(event);
    },
    [view, onSequentialKeyDown]
  );

  // The sequential hook runs first (re-id, parent into the slot's container, restore the
  // split edge's endpoints); the host's hook then sees that shape and has the last word.
  const composedOnBeforeNodeAdded = useCallback(
    (newNode: Node, newEdges: Edge[]) => {
      const sequential = onBeforeNodeAdded(newNode, newEdges);
      return (
        addNodeManagerProps?.onBeforeNodeAdded?.(sequential.newNode, sequential.newEdges) ??
        sequential
      );
    },
    [addNodeManagerProps?.onBeforeNodeAdded, onBeforeNodeAdded]
  );
  const ignoredNodeTypes = useMemo(
    () => getSequentialIgnoredNodeTypes(addNodeManagerProps?.ignoredNodeTypes),
    [addNodeManagerProps?.ignoredNodeTypes]
  );
  const {
    onBeforeNodeAdded: _hostOnBeforeNodeAdded,
    ignoredNodeTypes: _hostIgnoredNodeTypes,
    ...remainingAddNodeManagerProps
  } = addNodeManagerProps ?? {};

  // Per-view viewport save/restore, mirrored into SequentialViewProvider when one is present.
  const { onMove: handleMove, defaultViewport } = useCanvasViewViewport({
    view,
    reactFlow,
    externalStore: seqView,
    fitViewOptions,
    fitOnMount: inSequentialView,
  });

  // Every row stays in the DOM for reading-order a11y up to SEQ_FULL_RENDER_MAX_NODES; past
  // it xyflow virtualization is re-enabled so a mount burst cannot exceed React's
  // nested-update limit. Counted over numbered steps so synthetic rows and a transient
  // preview cannot flip the mode mid-interaction.
  const virtualizeForScale =
    inSequentialView && visibleNumberedRows.length > SEQ_FULL_RENDER_MAX_NODES;

  return (
    // Keyboard nav is attached to this wrapper rather than `document` so multiple canvases
    // on one page never steal each other's key events.
    <SequentialCollapsedRowsProvider collapsedStepIds={collapsedSet}>
      <SequentialAttachmentsProvider attachmentsByStepId={attachmentsByStepId}>
        <SequentialLaneAddProvider onLaneAdd={canEditSequence ? onLaneAddById : undefined}>
          <SequentialMoveActionsProvider value={moveActionsValue}>
            <div className="relative h-full w-full" onKeyDown={onKeyDown}>
              <BaseCanvas<N, E>
                ref={canvasRef}
                nodes={seqNodes}
                edges={seqEdgesWithPreview}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                mode={mode}
                isDarkMode={isDarkMode}
                locale={locale}
                fitViewOptions={fitViewOptions}
                onToolbarAction={handleToolbarAction}
                breakpoints={breakpoints}
                onlyRenderVisibleElements={virtualizeForScale}
                aria-hidden={virtualizeForScale || undefined}
                // Must move in lockstep with `aria-hidden`: xyflow's focusable defaults render
                // `tabIndex={0}` on every wrapper, an `aria-hidden-focus` violation inside a hidden
                // subtree. Known gap: controls that portal into the canvas (bar toolbars, insert
                // buttons, the Add Node panel) stay focusable and are pointer-only at this scale.
                nodesFocusable={!virtualizeForScale}
                edgesFocusable={!virtualizeForScale}
                readOnlyNodeIds={readOnlyNodeIds}
                // Sequential bars are not user-connectable in v1.
                nodesConnectable={view === 'flow'}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onMove={handleMove}
                defaultViewport={defaultViewport}
              >
                {children}
                {inSequentialView && (
                  <>
                    {isDesignMode && (
                      <AddNodeManager
                        {...remainingAddNodeManagerProps}
                        onBeforeNodeAdded={composedOnBeforeNodeAdded}
                        ignoredNodeTypes={ignoredNodeTypes}
                      />
                    )}
                    {!virtualizeForScale && (
                      <>
                        <SequentialGutter
                          rows={visibleNumberedRows}
                          positions={layout?.positions ?? EMPTY_POSITIONS}
                          barHeight={metrics.barHeight}
                          collapsedStepIds={collapsedSet}
                          onToggleCollapse={handleToggleCollapse}
                        />
                        <SequentialInsertLayer
                          edges={seqEdgesWithPreview}
                          nodes={seqNodes}
                          barWidth={metrics.barWidth}
                          barHeight={metrics.barHeight}
                          isDesignMode={isDesignMode}
                          startInsert={startInsert}
                        />
                      </>
                    )}
                  </>
                )}
              </BaseCanvas>
              {virtualizeForScale && projection && (
                <SequentialAccessibleList
                  rows={visibleNumberedRows}
                  nodes={seqNodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={handleSelectRow}
                  onToggleCollapse={handleToggleCollapse}
                />
              )}
            </div>
          </SequentialMoveActionsProvider>
        </SequentialLaneAddProvider>
      </SequentialAttachmentsProvider>
    </SequentialCollapsedRowsProvider>
  );
}
