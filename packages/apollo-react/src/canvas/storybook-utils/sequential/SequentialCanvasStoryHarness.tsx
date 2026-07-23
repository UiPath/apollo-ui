import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { applyEdgeChanges, applyNodeChanges } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { prepareCanvasViewTransition } from '../../components/SequentialCanvas/prepareCanvasViewTransition';
import { SequentialCanvas } from '../../components/SequentialCanvas/SequentialCanvas';
import { ViewSwitcher } from '../../components/SequentialCanvas/ViewSwitcher';
import { NodeRegistryProvider, useOptionalNodeTypeRegistry } from '../../core';
import type { NodeManifest } from '../../schema';
import { isContainerNodeManifest } from '../../utils';
import type {
  CanvasView,
  LayoutSequenceOptions,
  SequentialCompatibilityReport,
} from '../../utils/sequential';
import { defaultWorkflowManifest } from '../manifests';

/**
 * Story-only helper for the Sequential Canvas view stories. It renders
 * a controlled sequential graph with realistic manifest-resolved node
 * visuals. It can optionally expose the real flow/sequential transition over the
 * same controlled canonical graph.
 *
 * `extraManifests` lets one story register additional node types (e.g. the
 * wireframe fixture's "HTTP Request" / "Send Message to User", which have no
 * other Storybook manifest) without touching the shared
 * defaultWorkflowManifest every other canvas story relies on.
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
  const isContainerNode = useCallback(
    (node: Node) =>
      isContainerNodeManifest(node.type ? registry?.getManifest(node.type) : undefined),
    [registry]
  );
  const [view, setView] = useState<CanvasView>(initialView);
  const [compatibility, setCompatibility] = useState<SequentialCompatibilityReport | undefined>(
    () =>
      initialView === 'sequential'
        ? prepareCanvasViewTransition('sequential', initialNodes, initialEdges, {
            sequential: { isContainerNode },
          }).sequentialCompatibility
        : undefined
  );
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  // Collapse is view-local UI (D6), not canonical state, so it lives here
  // rather than alongside nodes/edges. Wiring it through makes the gutter's
  // chevrons and ArrowLeft/Right actually collapse/expand in stories,
  // instead of rendering inert affordances.
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
        flowLayout: { isContainerNode },
        sequential: { isContainerNode },
      });
      nodesRef.current = transition.nodes;
      setNodes(transition.nodes);
      setCompatibility(transition.sequentialCompatibility);
      setView(nextView);
    },
    [isContainerNode]
  );
  const effectiveMode =
    view === 'sequential' && compatibility && !compatibility.editable ? 'readonly' : mode;

  return (
    <div className="relative h-full w-full" data-testid="sequential-story-harness">
      {showViewSwitcher && (
        <div className="absolute top-4 right-4 z-10 shadow-sm">
          <ViewSwitcher value={view} onChange={onViewChange} />
        </div>
      )}
      {view === 'sequential' && compatibility && compatibility.level !== 'exact' && (
        <output className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
          Sequential view is read-only: {compatibility.issues.map((issue) => issue.code).join(', ')}
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
