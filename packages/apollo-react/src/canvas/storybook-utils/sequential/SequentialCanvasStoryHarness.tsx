import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { applyEdgeChanges, applyNodeChanges } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { prepareCanvasViewTransition } from '../../components/SequentialCanvas/prepareCanvasViewTransition';
import { SequentialCanvas } from '../../components/SequentialCanvas/SequentialCanvas';
import { ViewSwitcher } from '../../components/SequentialCanvas/ViewSwitcher';
import { NodeRegistryProvider, useOptionalNodeTypeRegistry } from '../../core';
import type { NodeManifest } from '../../schema';
import type { CanvasView, LayoutSequenceOptions } from '../../utils/sequential';
import { defaultWorkflowManifest } from '../manifests';

/**
 * Story-only controlled sequential graph with manifest-resolved visuals and an
 * optional real flow/sequential toggle. `extraManifests` registers story-local
 * node types without touching the shared defaultWorkflowManifest.
 */
export interface SequentialCanvasStoryHarnessProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  extraManifests?: NodeManifest[];
  mode?: 'design' | 'view' | 'readonly';
  sequenceLayoutOptions?: LayoutSequenceOptions;
  initialView?: CanvasView;
  showViewSwitcher?: boolean;
  /** Wired to the "Workflow start" bar's "Add trigger" button (SequentialStartNode). */
  onAddTrigger?: () => void;
}

export function SequentialCanvasStoryHarness({
  initialNodes,
  initialEdges,
  extraManifests,
  mode = 'design',
  sequenceLayoutOptions,
  initialView = 'sequential',
  showViewSwitcher = false,
  onAddTrigger,
}: SequentialCanvasStoryHarnessProps) {
  const manifest = useMemo(
    () =>
      extraManifests?.length
        ? {
            ...defaultWorkflowManifest,
            nodes: [...defaultWorkflowManifest.nodes, ...extraManifests],
          }
        : defaultWorkflowManifest,
    [extraManifests]
  );

  return (
    <NodeRegistryProvider manifest={manifest}>
      <SequentialCanvasStoryHarnessInner
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        mode={mode}
        sequenceLayoutOptions={sequenceLayoutOptions}
        initialView={initialView}
        showViewSwitcher={showViewSwitcher}
        onAddTrigger={onAddTrigger}
      />
    </NodeRegistryProvider>
  );
}

function SequentialCanvasStoryHarnessInner({
  initialNodes,
  initialEdges,
  mode,
  sequenceLayoutOptions,
  initialView,
  showViewSwitcher,
  onAddTrigger,
}: Required<
  Pick<
    SequentialCanvasStoryHarnessProps,
    'initialNodes' | 'initialEdges' | 'initialView' | 'mode' | 'showViewSwitcher'
  >
> &
  Pick<SequentialCanvasStoryHarnessProps, 'onAddTrigger' | 'sequenceLayoutOptions'>) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const registry = useOptionalNodeTypeRegistry();
  // The same manifest lookup SequentialCanvas derives its predicates from, so the report
  // describes the node set the canvas renders.
  const getManifest = useCallback(
    (type: string) => registry?.getManifest(type) ?? undefined,
    [registry]
  );
  const [view, setView] = useState<CanvasView>(initialView);
  // Derived, not stored from onViewChange, so edits inside sequential view re-analyze.
  // `prepareCanvasViewTransition('sequential')` returns `nodes` unchanged, so this is pure.
  const compatibility = useMemo(
    () =>
      view === 'sequential'
        ? prepareCanvasViewTransition('sequential', nodes, edges, { getManifest })
            .sequentialCompatibility
        : undefined,
    [view, nodes, edges, getManifest]
  );
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  // Collapse is view-local UI, not canonical state.
  const [collapsedStepIds, setCollapsedStepIds] = useState<string[]>([]);
  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges<Node>>[0]) =>
      setNodes((current) => {
        const next = applyNodeChanges(changes, current);
        nodesRef.current = next;
        return next;
      }),
    []
  );
  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges<Edge>>[0]) =>
      setEdges((current) => applyEdgeChanges(changes, current)),
    []
  );
  const onViewChange = useCallback(
    (nextView: CanvasView) => {
      const transition = prepareCanvasViewTransition(nextView, nodesRef.current, edgesRef.current, {
        getManifest,
      });
      nodesRef.current = transition.nodes;
      setNodes(transition.nodes);
      setView(nextView);
    },
    [getManifest]
  );
  // The component never locks itself; the host does. Multi-root and orphan graphs
  // stay editable so the user can repair them from the view that surfaces the problem.
  const effectiveMode =
    view === 'sequential' && compatibility && !compatibility.editable ? 'readonly' : mode;
  const issueCodes = compatibility?.issues.map((issue) => issue.code).join(', ');

  return (
    <div className="relative h-full w-full" data-testid="sequential-story-harness">
      {showViewSwitcher && (
        <div className="absolute top-4 right-4 z-10 shadow-sm">
          <ViewSwitcher value={view} onChange={onViewChange} />
        </div>
      )}
      {view === 'sequential' && compatibility && compatibility.level !== 'exact' && (
        <output
          className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-md border bg-background px-3 py-2 text-xs shadow-sm"
          data-testid="sequential-compatibility-banner"
        >
          {compatibility.editable
            ? `Sequential view is showing a degraded projection: ${issueCodes}. Editing is still enabled.`
            : `Sequential view is read-only: ${issueCodes}`}
        </output>
      )}
      <SequentialCanvas
        view={view}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        collapsedStepIds={collapsedStepIds}
        onCollapsedStepIdsChange={setCollapsedStepIds}
        onAddTrigger={onAddTrigger}
        mode={effectiveMode}
        sequenceLayoutOptions={sequenceLayoutOptions}
      />
    </div>
  );
}
