import type {
  Edge,
  EdgeTypes,
  Node,
  NodeChange,
  NodeMouseHandler,
  NodeTypes,
  OnMove,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NodeRegistryProvider } from '../../core';
import type { CategoryManifest, NodeManifest } from '../../schema/node-definition';
import { BaseCanvas, type BaseCanvasProps } from '../BaseCanvas';
import { applyDiffHighlight } from './applyDiffHighlight';
import type { DiffPaneContext, DiffViewport } from './CanvasDiffView.types';

const VIEWPORT_EPSILON = 1e-3;

function viewportsClose(a: DiffViewport | undefined, b: DiffViewport | undefined): boolean {
  return (
    !!a &&
    !!b &&
    Math.abs(a.x - b.x) < VIEWPORT_EPSILON &&
    Math.abs(a.y - b.y) < VIEWPORT_EPSILON &&
    Math.abs(a.zoom - b.zoom) < VIEWPORT_EPSILON
  );
}

/** Keeps React Flow's measurements across a fresh `nodes` prop so nodes don't re-measure. */
function carryMeasurements<N extends Node>(previous: N[], next: N[]): N[] {
  const previousById = new Map(previous.map((node) => [node.id, node]));
  return next.map((node) => {
    const prior = previousById.get(node.id);
    if (!prior || node.measured || !prior.measured) return node;
    return {
      ...node,
      measured: prior.measured,
      width: node.width ?? prior.width,
      height: node.height ?? prior.height,
    };
  });
}

/**
 * A local copy of `nodes` that accepts React Flow's layout writes (measurements, BaseNode's
 * height) but not selection, add or remove: the pane is read-only and selection is shared.
 */
function useLocalLayoutNodes<N extends Node>(nodes: N[]) {
  const [layoutNodes, setLayoutNodes] = useState(nodes);
  const [sourceNodes, setSourceNodes] = useState(nodes);
  if (sourceNodes !== nodes) {
    setSourceNodes(nodes);
    setLayoutNodes((previous) => carryMeasurements(previous, nodes));
  }

  const onNodesChange = useCallback((changes: NodeChange<N>[]) => {
    const layoutChanges = changes.filter(
      (change) => change.type !== 'select' && change.type !== 'remove' && change.type !== 'add'
    );
    if (layoutChanges.length > 0) {
      setLayoutNodes((current) => applyNodeChanges(layoutChanges, current));
    }
  }, []);

  return [layoutNodes, onNodesChange] as const;
}

/** `BaseCanvas` props a host may add. The pane owns the rest (nodes, mode, selection, moves, initial viewport). */
export type ApolloCanvasDiffPaneCanvasProps<N extends Node, E extends Edge> = Omit<
  BaseCanvasProps<N, E>,
  | 'nodes'
  | 'edges'
  | 'mode'
  | 'nodeTypes'
  | 'edgeTypes'
  | 'children'
  | 'onNodesChange'
  | 'fitView'
  | 'defaultViewport'
>;

/** The pane context (spread `ctx` in) plus canvas setup. Phases are not drawn separately. */
export interface ApolloCanvasDiffPaneProps<N extends Node = Node, E extends Edge = Edge>
  extends Omit<DiffPaneContext<N, E>, 'side' | 'changePhases'> {
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  /** Registers node manifests for this pane only. Omit to use an ancestor registry. */
  manifest?: { nodes: NodeManifest[]; categories: CategoryManifest[] };
  /** Extra `BaseCanvas` props (theme, locale, fit options, event handlers). */
  canvasProps?: ApolloCanvasDiffPaneCanvasProps<N, E>;
  /** Rendered inside the canvas, e.g. zoom controls. */
  children?: ReactNode;
}

function DiffPaneCanvas<N extends Node, E extends Edge>({
  nodes,
  edges,
  highlight,
  selectedNodeId,
  onSelectNode,
  viewport,
  onViewportChange,
  fitViewOnMount,
  nodeTypes,
  edgeTypes,
  canvasProps,
  children,
}: ApolloCanvasDiffPaneProps<N, E>) {
  const { getViewport, setViewport } = useReactFlow();

  const marked = useMemo(
    () => applyDiffHighlight(nodes, edges, highlight),
    [nodes, edges, highlight]
  );
  const [layoutNodes, handleNodesChange] = useLocalLayoutNodes(marked.nodes);

  const renderedNodes = useMemo(
    () =>
      layoutNodes.map((node) => {
        const selected = node.id === selectedNodeId;
        return !!node.selected === selected ? node : { ...node, selected };
      }),
    [layoutNodes, selectedNodeId]
  );

  const userOnNodeClick = canvasProps?.onNodeClick;
  const handleNodeClick = useCallback<NodeMouseHandler<N>>(
    (event, node) => {
      onSelectNode(node.id);
      userOnNodeClick?.(event, node);
    },
    [onSelectNode, userOnNodeClick]
  );

  const userOnPaneClick = canvasProps?.onPaneClick;
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      onSelectNode(undefined);
      userOnPaneClick?.(event);
    },
    [onSelectNode, userOnPaneClick]
  );

  // Viewport sync: start from the shared viewport (or fit, when told to), then report every
  // move except the echo of a shared viewport this pane just applied.
  const initial = useRef({ viewport, fitView: fitViewOnMount }).current;
  const appliedViewport = useRef<DiffViewport | undefined>(undefined);
  const userOnMove = canvasProps?.onMove;
  const handleMove = useCallback<OnMove>(
    (event, next) => {
      userOnMove?.(event, next);
      if (viewportsClose(appliedViewport.current, next)) return;
      appliedViewport.current = undefined;
      onViewportChange(next);
    },
    [onViewportChange, userOnMove]
  );

  useEffect(() => {
    if (!viewport || viewportsClose(getViewport(), viewport)) return;
    appliedViewport.current = viewport;
    void setViewport(viewport);
  }, [viewport, getViewport, setViewport]);

  return (
    <BaseCanvas<N, E>
      {...canvasProps}
      fitView={initial.fitView}
      defaultViewport={initial.viewport}
      mode="view"
      nodes={renderedNodes}
      edges={marked.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={handleNodesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      onMove={handleMove}
    >
      {children}
    </BaseCanvas>
  );
}

/**
 * The default {@link CanvasDiffView} pane for products built on `BaseCanvas`:
 * `renderPane={(ctx) => <ApolloCanvasDiffPane {...ctx} nodeTypes={nodeTypes} />}`.
 *
 * Mounts its own `ReactFlowProvider` (and a `NodeRegistryProvider` when a manifest is given),
 * marks changed elements through `data.suggestionType`, follows the shared viewport and
 * forwards selection. Products on another canvas write their own pane instead.
 */
export function ApolloCanvasDiffPane<N extends Node = Node, E extends Edge = Edge>(
  props: ApolloCanvasDiffPaneProps<N, E>
) {
  const canvas = (
    <ReactFlowProvider>
      <DiffPaneCanvas<N, E> {...props} />
    </ReactFlowProvider>
  );
  return props.manifest ? (
    <NodeRegistryProvider manifest={props.manifest}>{canvas}</NodeRegistryProvider>
  ) : (
    canvas
  );
}
