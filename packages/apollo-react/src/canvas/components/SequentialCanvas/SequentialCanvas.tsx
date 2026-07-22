import type {
  Edge,
  EdgeChange,
  EdgeTypes,
  Node,
  NodeChange,
  NodeTypes,
  OnMove,
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
import {
  DEFAULT_SOURCE_HANDLE_ID,
  DEFAULT_TRIGGER_NODE_TYPE,
  PREVIEW_NODE_ID,
} from '../../constants';
import { useOptionalNodeTypeRegistry } from '../../core';
import { usePreviewNode } from '../../hooks/usePreviewNode';
import { isContainerNodeManifest } from '../../utils';
import { isPreviewEdge } from '../../utils/createPreviewNode';
import { resolveHandles } from '../../utils/manifest-resolver';
import { SEQ_LANE_PLACEHOLDER_PREFIX } from '../../utils/sequential/graph-helpers';
import { removeStep } from '../../utils/sequential/mutations';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';
import { AddNodeManager } from '../AddNodePanel/AddNodeManager';
import { BaseCanvas } from '../BaseCanvas/BaseCanvas';
import { BaseNode } from '../BaseNode/BaseNode';
import { SequentialConnectorEdge } from './edges/SequentialConnectorEdge';
import { SEQUENTIAL_IGNORED_NODE_TYPES } from './edges/sequentialInsert';
import { useSequentialInsert } from './edges/useSequentialInsert';
import {
  SEQUENTIAL_SYNTHETIC_NODE_TYPES,
  SequentialInsertPreviewNode,
  SequentialStepNode,
} from './nodes';
import { SequentialAccessibleList } from './SequentialAccessibleList';
import type { SequentialCanvasProps } from './SequentialCanvas.types';
import { SequentialCollapsedRowsProvider } from './SequentialCollapsedRowsContext';
import { SequentialGutter } from './SequentialGutter';
import { SequentialInsertGapProvider } from './SequentialInsertGapContext';
import { SequentialInsertStateProvider } from './SequentialInsertStateContext';
import { SequentialMoveActionsProvider } from './SequentialMoveActionsContext';
import { useOptionalSequentialView } from './SequentialViewContext';
import {
  forwardSequentialEdgeChanges,
  forwardSequentialNodeChanges,
  graphChangeSetToEdgeChanges,
  graphChangeSetToNodeChanges,
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
import { SEQ_SYNTHETIC_ROW_IDS, useSequentialGraph } from './useSequentialGraph';
import { toggleCollapsedStepIds, useSequentialKeyboard } from './useSequentialKeyboard';
import { useSequentialMoveActionsValue } from './useSequentialMoveActionsValue';

const EDGE_TYPES: EdgeTypes = {
  [SEQ_CONNECTOR_EDGE_TYPE]: SequentialConnectorEdge as EdgeTypes[string],
  // The Add Node preview pipeline stamps its transient edges `type: 'default'`.
  // Render those through the same connector so the preview traces the real
  // orthogonal rounded path (with an arrowhead) instead of xyflow's built-in
  // bezier fallback, which is the only 'default' edge that occurs in this view.
  default: SequentialConnectorEdge as EdgeTypes[string],
};

const EMPTY_POSITIONS: ReadonlyMap<string, XYPosition> = new Map();

/**
 * The Sequential Canvas view: an n8n/Zapier-style vertical projection of the
 * same flow graph, rendered through the existing BaseCanvas (D1-D14). It renders
 * either the canonical flow graph or its sequential projection on the same
 * mounted BaseCanvas, selected by the orthogonal `view` prop (see ToggleHarness
 * / SequentialViewProvider). Mutations flow out through the standard
 * onNodesChange / onEdgesChange callbacks, with synthetic rows and view-only
 * geometry filtered out (seam 2); canonical positions are never written back
 * (D4).
 *
 * It supplies its own ReactFlowProvider (BaseCanvas requires one above it,
 * BaseCanvas.tsx:116-122) so it is a self-contained drop-in, matching the
 * MiniCanvasNavigator idiom rather than requiring the host to wrap it.
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
 * Owns insertion-gap state above every insertion hook in the canvas. Keeping
 * the provider here is essential: terminal/lane/leaf handlers are created by
 * SequentialCanvasInner itself, while connector handlers are rendered below
 * BaseCanvas. Both must publish into the same state sink before the preview is
 * opened.
 */
function SequentialCanvasInsertController<N extends Node, E extends Edge>(
  props: SequentialCanvasProps<N, E>
) {
  const [activeInsertSlot, setActiveInsertSlot] = useState<InsertionSlot | undefined>(undefined);
  const { previewNode } = usePreviewNode();
  const wasPreviewOpenRef = useRef(false);

  useEffect(() => {
    if (previewNode) {
      wasPreviewOpenRef.current = true;
    } else if (wasPreviewOpenRef.current) {
      wasPreviewOpenRef.current = false;
      setActiveInsertSlot(undefined);
    }
  }, [previewNode]);

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
  // Canonical id->node map, reused everywhere a node lookup is needed (handle
  // resolution, change forwarding, move commits). `childParentIds` is the set of
  // ids that are some node's `parentId`, i.e. structural containers, so
  // `isContainerNode` is an O(1) lookup instead of an O(n) scan per call.
  const canonicalById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const childParentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const node of nodes) {
      if (node.parentId) ids.add(node.parentId);
    }
    return ids;
  }, [nodes]);

  const resolvedHandlesByNodeId = useMemo(() => {
    const result = new Map<string, ReturnType<typeof resolveHandles>>();
    for (const node of nodes) {
      const manifest = node.type ? registry?.getManifest(node.type) : undefined;
      if (!manifest) continue;
      result.set(
        node.id,
        resolveHandles(manifest.handleConfiguration, {
          ...(node.data as Record<string, unknown>),
          nodeId: node.id,
        })
      );
    }
    return result;
  }, [nodes, registry]);

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

  const isStartNode = useCallback(
    (node: N) =>
      node.type === DEFAULT_TRIGGER_NODE_TYPE ||
      (node.type ? registry?.getManifest(node.type)?.category === 'trigger' : false),
    [registry]
  );

  const isProjectedContainerNode = useCallback(
    (node: N) => isContainerNodeManifest(node.type ? registry?.getManifest(node.type) : undefined),
    [registry]
  );

  const resolveBranchLabel = useCallback(
    (nodeId: string, handleId: string) =>
      findResolvedHandle(nodeId, handleId, 'source')?.label ?? handleId,
    [findResolvedHandle]
  );

  // A parent node's resolved branch-lane handles (If → true/false, while → body,
  // try/catch → try/catch/finally), so the projection can render every lane —
  // empty ones as "+ Add step" placeholders — before any child edge exists. The
  // continuation output is excluded when it uses a well-known `output` or
  // `success` handle, or when it is the node's only source. `isDefaultForType`
  // is intentionally not used as a branch discriminator: it describes default
  // connection selection, not control-flow semantics.
  const getBranchHandles = useCallback(
    (node: N) => {
      const candidates = (resolvedHandlesByNodeId.get(node.id) ?? [])
        .flatMap((group) => group.handles)
        .filter(
          (handle) => handle.type === 'source' && handle.handleType !== 'artifact' && handle.visible
        );
      const continuationId =
        candidates.find((handle) => handle.id === 'output' || handle.id === 'success')?.id ??
        (candidates.length === 1 ? candidates[0]?.id : undefined);
      return candidates
        .filter((handle) => handle.id !== continuationId)
        .map((handle) => ({ id: handle.id, label: resolveBranchLabel(node.id, handle.id) }));
    },
    [resolvedHandlesByNodeId, resolveBranchLabel]
  );

  const collapsedSet = useMemo(() => new Set(collapsedStepIds ?? []), [collapsedStepIds]);

  // The slot whose Add Node panel is currently open, if any. Written by every
  // useSequentialInsert() call site via SequentialInsertGapProvider, and cleared
  // the moment the preview node closes -- covering BOTH cancel (the gap just
  // closes) and commit (a real structural change relayouts right behind it; a
  // same-frame flicker is acceptable). While set, useSequentialGraph re-runs ONLY
  // its cheap layout pass with a preview row spliced in at the slot (the
  // projection memo stays fingerprint-keyed, D12), so the gap opens exactly one
  // row, the preview bar seats in its slot, and every connector re-routes from
  // the shifted geometry.
  // Terminal "Add step" placeholder: append after the last top-level row. Read
  // from a ref so the callback identity stays stable (it feeds the synthetic
  // placeholder's data, which must not churn every render).
  const tailSlotRef = useRef<InsertionSlot | undefined>(undefined);
  const onPlaceholderAdd = useCallback(() => {
    if (!isDesignMode || view !== 'sequential') return;
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
  }, [isDesignMode, view, reactFlow, startInsert]);

  // An empty branch lane's "+ Add step" placeholder: append the first node into
  // that lane via the carried slot (source = parent, sourceHandle = the branch
  // handle, containerId set so it parents correctly). The preview then re-seats
  // in the lane via the layout swap (projectionWithPreviewRow).
  const onLaneAdd = useCallback(
    (slot: InsertionSlot) => {
      if (!isDesignMode || view !== 'sequential' || !slot.source) return;
      const sourceNode = canonicalById.get(slot.source.nodeId);
      const resolvedSource = {
        ...slot.source,
        handleId:
          slot.source.handleId ??
          (sourceNode?.type
            ? registry?.getDefaultHandle(sourceNode.type, 'source')?.id
            : undefined) ??
          DEFAULT_SOURCE_HANDLE_ID,
      };
      const resolvedSlot: InsertionSlot = {
        ...slot,
        source: resolvedSource,
      };
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
    [isDesignMode, view, canonicalById, registry, reactFlow, startInsert]
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
    onAddTrigger: isDesignMode && view === 'sequential' ? onAddTrigger : undefined,
    onPlaceholderAdd: isDesignMode && view === 'sequential' ? onPlaceholderAdd : undefined,
    isSequenceEdge,
    isStartNode,
    isContainerNode: isProjectedContainerNode,
    resolveBranchLabel,
    getBranchHandles,
    onLaneAdd: isDesignMode && view === 'sequential' ? onLaneAdd : undefined,
    insertSlot: view === 'sequential' ? activeInsertSlot : undefined,
    layoutOptions: sequenceLayoutOptions,
  });

  const tailSlot = useMemo<InsertionSlot | undefined>(() => {
    return resolveTailInsertionSlot(
      projection,
      nodes,
      (nodeType) => registry?.getDefaultHandle(nodeType, 'source')?.id,
      isStartNode
    );
  }, [projection, nodes, registry, isStartNode]);
  tailSlotRef.current = tailSlot;

  // The Add Node pipeline (showPreviewGraph) adds its `preview` node + preview
  // edges via `instance.setNodes` / `instance.setEdges`. This canvas is
  // CONTROLLED (nodes/edges come from the derived arrays), and in that mode
  // xyflow routes them through onNodesChange / onEdgesChange as `add` changes
  // rather than writing the store; the handlers below capture the preview into
  // this local state and we merge it into the controlled arrays here (it never
  // reaches canonical state -- the change filters drop PREVIEW_NODE_ID /
  // isPreviewEdge). The preview node's position is overridden with the slot the
  // layout opened (layout.positions[PREVIEW_NODE_ID]), so the ghost bar sits
  // centered in the gap instead of at the click-time midpoint.
  const [insertPreviewNode, setInsertPreviewNode] = useState<N | null>(null);
  const [insertPreviewEdges, setInsertPreviewEdges] = useState<E[]>([]);
  const seqNodes = useMemo(() => {
    // A lane placeholder loses its layout position when its lane is being
    // inserted into (projectionWithPreviewRow swaps it for the preview row), so
    // drop the now-orphaned placeholder; every other lane placeholder still has a
    // position and renders normally.
    const base = seqNodesRaw.filter(
      (node) => !node.id.startsWith(SEQ_LANE_PLACEHOLDER_PREFIX) || !!layout?.positions.has(node.id)
    );
    if (view !== 'sequential' || !insertPreviewNode) return base;
    const slotPosition = layout?.positions.get(PREVIEW_NODE_ID);
    const positionedPreview = slotPosition
      ? {
          ...insertPreviewNode,
          position: slotPosition,
          width: sequenceLayoutOptions?.barWidth ?? insertPreviewNode.width,
          height: sequenceLayoutOptions?.barHeight ?? insertPreviewNode.height,
        }
      : {
          ...insertPreviewNode,
          width: sequenceLayoutOptions?.barWidth ?? insertPreviewNode.width,
          height: sequenceLayoutOptions?.barHeight ?? insertPreviewNode.height,
        };
    return [...base, positionedPreview];
  }, [
    view,
    seqNodesRaw,
    insertPreviewNode,
    layout,
    sequenceLayoutOptions?.barWidth,
    sequenceLayoutOptions?.barHeight,
  ]);
  const seqEdgesWithPreview = useMemo(
    () =>
      // While a slot is active, useSequentialGraph has already replaced the
      // affected connector with routed preview connectors. The raw edges from
      // showPreviewGraph remain useful to AddNodeManager's store bookkeeping,
      // but rendering them too would duplicate the path and use click-time
      // geometry that jumps when the real node is committed.
      view === 'sequential' && activeInsertSlot
        ? seqEdges
        : view === 'sequential' && insertPreviewEdges.length > 0
          ? [...seqEdges, ...insertPreviewEdges]
          : seqEdges,
    [view, activeInsertSlot, seqEdges, insertPreviewEdges]
  );
  useEffect(() => {
    if (view !== 'flow') return;
    setInsertPreviewNode(null);
    setInsertPreviewEdges([]);
    setActiveInsertSlot(undefined);
  }, [view, setActiveInsertSlot]);

  // Every real manifest type maps to the bar step node; synthetic rows use their
  // own components. Memoized on the set of types present so it is reference-stable
  // across data/position changes.
  const nodeTypeKey = useMemo(
    () => [...new Set(nodes.map((node) => node.type ?? 'default'))].sort().join('|'),
    [nodes]
  );
  const sequentialNodeTypes = useMemo<NodeTypes>(() => {
    const types: NodeTypes = { ...SEQUENTIAL_SYNTHETIC_NODE_TYPES };
    for (const key of nodeTypeKey.split('|')) {
      if (key && !types[key]) types[key] = SequentialStepNode;
    }
    types.default ??= SequentialStepNode;
    // The Add Node pipeline (showPreviewGraph) drops a `preview`-typed node into
    // the store while the panel is open; without this it cannot render (D2). The
    // sequential view uses a bar-shaped ghost (icon left + "New step") instead of
    // the flow-view square AddNodePreview, which reads as an empty slab at the
    // bar's 16:1 aspect ratio.
    types.preview ??= SequentialInsertPreviewNode;
    return types;
  }, [nodeTypeKey]);
  const resolvedFlowNodeTypes = useMemo<NodeTypes>(() => {
    if (flowNodeTypes) return flowNodeTypes;
    const types: NodeTypes = {};
    for (const key of nodeTypeKey.split('|')) {
      if (key) types[key] = BaseNode;
    }
    types.default ??= BaseNode;
    return types;
  }, [flowNodeTypes, nodeTypeKey]);
  const nodeTypes = view === 'sequential' ? sequentialNodeTypes : resolvedFlowNodeTypes;
  const edgeTypes = view === 'sequential' ? EDGE_TYPES : flowEdgeTypes;

  // Change forwarding (seam 2): position/dimension changes and synthetic rows are
  // dropped; renames merge onto canonical; inserts + their healed edges pass
  // through and the split canonical edge is removed.
  const canonicalEdgeIds = useMemo(() => new Set(edges.map((edge) => edge.id)), [edges]);
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
      // Capture preview-node changes into local state (see the insertPreview
      // note above): apply them with xyflow's own reducer so add / remove /
      // replace / select / dimensions all behave correctly, then merge the
      // result into the controlled array. This runs regardless of whether the
      // host wired onNodesChange, since the preview is a view-only affordance.
      const previewChanges = changes.filter(
        (change) => (change.type === 'add' ? change.item.id : change.id) === PREVIEW_NODE_ID
      );
      if (previewChanges.length > 0) {
        setInsertPreviewNode((current) => {
          const next = applyNodeChanges(previewChanges, current ? [current] : []);
          return (next[0] as N | undefined) ?? null;
        });
      }

      if (!onNodesChange) return;
      const forwarded = forwardSequentialNodeChanges(changes, syntheticNodeIds, canonicalById);
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
      // Capture preview-edge changes the same way: an `add` is a preview edge
      // when isPreviewEdge matches; a remove/select/replace targets a preview
      // edge when it references one we are already holding.
      setInsertPreviewEdges((current) => {
        const relevant = changes.filter((change) =>
          change.type === 'add'
            ? isPreviewEdge(change.item)
            : current.some((edge) => edge.id === change.id)
        );
        return relevant.length > 0 ? (applyEdgeChanges(relevant, current) as E[]) : current;
      });

      if (!onEdgesChange) return;
      const forwarded = forwardSequentialEdgeChanges(changes, canonicalEdgeIds, edges);
      if (forwarded.length > 0) onEdgesChange(forwarded);
    },
    [view, onEdgesChange, canonicalEdgeIds, edges]
  );

  // Explorer-like tree move operations: kebab items (BaseNode's new `extraMenuItems`, see
  // useSequentialMoveMenuItems) and Alt+Arrow keyboard both read/commit
  // through this SAME binding, so the two affordances can never disagree.
  const isContainerNode = useCallback(
    (nodeId: string) => {
      if (childParentIds.has(nodeId)) return true;
      const node = canonicalById.get(nodeId);
      return !!node && isProjectedContainerNode(node);
    },
    [canonicalById, childParentIds, isProjectedContainerNode]
  );

  const getDefaultSourceHandleId = useCallback(
    (nodeType: string) => registry?.getDefaultHandle(nodeType, 'source')?.id,
    [registry]
  );

  const deleteStep = useCallback(
    (nodeId: string) => {
      if (!isDesignMode || view !== 'sequential' || !projection) return;
      const changeSet = removeStep(projection, nodeId, { nodes, edges });
      onNodesChange?.(graphChangeSetToNodeChanges<N>(changeSet));
      onEdgesChange?.(graphChangeSetToEdgeChanges<E>(changeSet));
    },
    [isDesignMode, view, projection, nodes, edges, onNodesChange, onEdgesChange]
  );

  const handleToolbarAction = useCallback<
    NonNullable<SequentialCanvasProps<N, E>['onToolbarAction']>
  >(
    (event) => {
      if (view === 'sequential' && event.actionId === 'delete') {
        deleteStep(event.nodeId);
        return;
      }
      onToolbarAction?.(event);
    },
    [view, deleteStep, onToolbarAction]
  );

  // Reference-chip navigation (D9 density fallback) shares this same binding
  // (team guidance: thread it "via the same context as the move actions").
  // Mirrors BaseCanvas's own centerNode (BaseCanvas.hooks.ts) directly against
  // the raw ReactFlow instance already held above, since that instance -- not
  // the imperative BaseCanvasRef, which is only for external consumers -- is
  // what this component itself has in scope.
  const centerViewportOnNode = useCallback(
    (nodeId: string) => {
      const node = reactFlow.getInternalNode(nodeId);
      if (!node) return;
      const width = node.measured?.width ?? node.width;
      const height = node.measured?.height ?? node.height;
      if (!width || !height) return;
      reactFlow.setCenter(node.position.x + width / 2, node.position.y + height / 2, {
        zoom: reactFlow.getViewport().zoom,
        duration: 300,
      });
    },
    [reactFlow]
  );

  // Move-actions binding shared by the kebab items and Alt+Arrow keyboard.
  // Rebuilt only on a structural projection change, so its identity is stable
  // across a selection or data-only change; every consuming SequentialStepNode
  // reads it through context, so a churning value would re-render every bar on
  // each click. The commit path reads the latest graph at call time. See
  // useSequentialMoveActionsValue.
  const moveActionsValue = useSequentialMoveActionsValue<N, E>({
    projection,
    nodes,
    edges,
    canonicalById,
    isContainerNode,
    getDefaultSourceHandleId,
    onNodesChange,
    onEdgesChange,
    centerOnNode: centerViewportOnNode,
  });

  // Alt+Arrow keyboard move: same guards as the kebab (design mode
  // only) and the same commit path (commitMove), so kebab and keyboard can
  // never disagree.
  const handleMoveNode = useCallback(
    (nodeId: string, direction: SequentialMoveDirection) => {
      if (!isDesignMode) return;
      const slot = getSequentialMoveSlot(moveActionsValue.getMoveOptions(nodeId), direction);
      if (slot) moveActionsValue.commitMove(nodeId, slot);
    },
    [isDesignMode, moveActionsValue]
  );

  // Gutter + keyboard (D8): the visible, numbered row order is the single
  // source of truth both the gutter's layout and ArrowUp/Down navigation walk,
  // so DOM order / gutter order / keyboard order can never disagree.
  const visibleNumberedRows = useMemo(
    () => projection?.rows.filter((row) => row.visible && row.stepNumber !== undefined) ?? [],
    [projection]
  );

  // Sequential bars are not user-connectable, but selection still flows through
  // the canonical `nodes` array (the sequential clones pass `selected` through
  // by reference, see useSequentialGraph) -- read it back the same way so
  // keyboard nav agrees with whatever a mouse click last selected.
  const selectedNodeId = useMemo(() => nodes.find((node) => node.selected)?.id, [nodes]);

  const isInteractive = mode !== 'readonly';

  // Moves single selection to a row's node id through the SAME onNodesChange
  // path a mouse click already uses (`select` NodeChanges), so keyboard and
  // pointer selection are indistinguishable to the consumer's canonical state.
  // Gated on `isInteractive` to mirror BaseCanvas's own selection gating
  // (BaseCanvas.tsx onNodeClick/elementsSelectable), so readonly canvases don't
  // let the keyboard select what a click cannot.
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

  // Collapse is view-local UI (D6), not a canonical mutation, so it stays
  // available regardless of mode (a readonly/monitoring canvas can still
  // fold sections). Shared by both the gutter's chevron click and the
  // keyboard's ArrowLeft/Right so the two affordances can never disagree.
  const handleToggleCollapse = useCallback(
    (nodeId: string, collapsed: boolean) => {
      onCollapsedStepIdsChange?.(toggleCollapsedStepIds(collapsedSet, nodeId, collapsed));
    },
    [collapsedSet, onCollapsedStepIdsChange]
  );

  const { onKeyDown } = useSequentialKeyboard({
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

  const composedOnBeforeNodeAdded = useCallback(
    (newNode: Node, newEdges: Edge[]) => {
      const hostResult = addNodeManagerProps?.onBeforeNodeAdded?.(newNode, newEdges) ?? {
        newNode,
        newEdges,
      };
      return onBeforeNodeAdded(hostResult.newNode, hostResult.newEdges);
    },
    [addNodeManagerProps?.onBeforeNodeAdded, onBeforeNodeAdded]
  );
  const ignoredNodeTypes = useMemo(
    () => [
      ...new Set([
        ...SEQUENTIAL_IGNORED_NODE_TYPES,
        ...(addNodeManagerProps?.ignoredNodeTypes ?? []),
      ]),
    ],
    [addNodeManagerProps?.ignoredNodeTypes]
  );
  const {
    onBeforeNodeAdded: _hostOnBeforeNodeAdded,
    ignoredNodeTypes: _hostIgnoredNodeTypes,
    ...remainingAddNodeManagerProps
  } = addNodeManagerProps ?? {};

  // Per-view viewport save/restore (D11): track the sequential viewport into the
  // optional context and restore it on mount, following the HierarchicalCanvas
  // save/restore precedent applied to the view axis.
  const handleMove = useCallback<OnMove>(
    (_event, viewport) => seqView?.saveViewport(view, viewport),
    [seqView, view]
  );
  const defaultViewport = seqView?.getViewport(view);

  const previousViewRef = useRef(view);
  useEffect(() => {
    if (previousViewRef.current === view) return;
    previousViewRef.current = view;
    const saved = seqView?.getViewport(view);
    if (saved) {
      void reactFlow.setViewport(saved, { duration: 300 });
    } else {
      void reactFlow.fitView({ ...fitViewOptions, duration: 300 });
    }
  }, [view, seqView, reactFlow, fitViewOptions]);

  // fitView on first entry (D3): BaseCanvas only runs its post-mount fitView
  // when an `initialAutoLayout` is provided; without one the viewport stays at
  // the raw {0,0,1} origin and the gutter, the Workflow start bar, and any
  // tall graph's trailing rows render off-screen. Sequential positions are
  // already deterministic (layoutSequence), so no real layout work is needed:
  // a stable no-op is enough to trigger the fit and fade-in. Skip it only when
  // this instance mounted with a saved viewport to restore (returning to a
  // previously-panned sequential view), so the fit does not clobber the
  // restored position. Captured once at mount so a later saveViewport does not
  // flip the behavior mid-session.
  const hadSavedViewportAtMount = useRef(defaultViewport !== undefined);
  const noopInitialLayout = useCallback(() => {}, []);
  const initialAutoLayout =
    view === 'sequential' && !hadSavedViewportAtMount.current ? noopInitialLayout : undefined;

  // Render every row into the DOM for reading-order a11y (D8), but only up to a
  // ceiling: past it, re-enable xyflow's viewport virtualization so a mount
  // burst of many hundred fixed bars can't drive xyflow's ResizeObserver /
  // updateNodeInternals cycle past React's nested-update limit. See
  // SEQ_FULL_RENDER_MAX_NODES for the tradeoff.
  const virtualizeForScale = view === 'sequential' && seqNodes.length > SEQ_FULL_RENDER_MAX_NODES;

  return (
    // Keyboard nav (D8) is attached to this wrapper div rather than `document`
    // (see useSequentialKeyboard's doc): it only reacts once focus/bubbling
    // genuinely lands inside this canvas, so multiple canvases on one page
    // never steal each other's key events.
    //
    // SequentialCollapsedRowsProvider wraps the whole subtree so every
    // SequentialStepNode xyflow mounts underneath BaseCanvas can read the
    // collapsed row-id set and render the "stacked" treatment without the
    // collapse toggle ever touching node.data (D12).
    <SequentialCollapsedRowsProvider collapsedStepIds={collapsedSet}>
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
            // Accessibility: keep every row in the DOM so reading order == row
            // order (D8), except past SEQ_FULL_RENDER_MAX_NODES where
            // virtualization is re-enabled for stability at scale.
            onlyRenderVisibleElements={virtualizeForScale}
            aria-hidden={virtualizeForScale || undefined}
            // Sequential bars are not user-connectable in v1.
            nodesConnectable={view === 'flow'}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onMove={handleMove}
            defaultViewport={defaultViewport}
            initialAutoLayout={initialAutoLayout}
            // Sequential layout is deterministic (layoutSequence) and the
            // initial fit is one-shot: never re-fit when a node is inserted or
            // removed, so an edit never quietly zooms the canvas out (D3).
            refitOnNodeSetChange={view !== 'sequential'}
          >
            {children}
            {view === 'sequential' && (
              <>
                {isDesignMode && (
                  <AddNodeManager
                    {...remainingAddNodeManagerProps}
                    onBeforeNodeAdded={composedOnBeforeNodeAdded}
                    ignoredNodeTypes={ignoredNodeTypes}
                  />
                )}
                <SequentialGutter
                  rows={visibleNumberedRows}
                  positions={layout?.positions ?? EMPTY_POSITIONS}
                  barHeight={sequenceLayoutOptions?.barHeight}
                  collapsedStepIds={collapsedSet}
                  onToggleCollapse={handleToggleCollapse}
                />
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
    </SequentialCollapsedRowsProvider>
  );
}
