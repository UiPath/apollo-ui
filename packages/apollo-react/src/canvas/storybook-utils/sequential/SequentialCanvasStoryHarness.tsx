import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { applyEdgeChanges, applyNodeChanges } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { SequentialCanvas } from '../../components/SequentialCanvas/SequentialCanvas';
import { NodeRegistryProvider } from '../../core';
import type { NodeManifest } from '../../schema';
import type { LayoutSequenceOptions } from '../../utils/sequential/sequential.types';
import { defaultWorkflowManifest } from '../manifests';

/**
 * Story-only helper for the Sequential Canvas view stories. It renders
 * a controlled sequential graph with realistic manifest-resolved node
 * visuals. View switching remains covered by ToggleHarness, but is deliberately
 * not exposed in the feature story until the product toggle is ready.
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
  /** Wired to the "Workflow start" bar's "Add trigger" button (SequentialStartNode). */
  onAddTrigger?: () => void;
}

export function SequentialCanvasStoryHarness({
  initialNodes,
  initialEdges,
  extraManifests,
  mode = 'design',
  sequenceLayoutOptions,
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
  onAddTrigger,
}: Required<Pick<SequentialCanvasStoryHarnessProps, 'initialNodes' | 'initialEdges' | 'mode'>> &
  Pick<SequentialCanvasStoryHarnessProps, 'onAddTrigger' | 'sequenceLayoutOptions'>) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  // Collapse is view-local UI (D6), not canonical state, so it lives here
  // rather than alongside nodes/edges. Wiring it through makes the gutter's
  // chevrons and ArrowLeft/Right actually collapse/expand in stories,
  // instead of rendering inert affordances.
  const [collapsedStepIds, setCollapsedStepIds] = useState<string[]>([]);
  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges<Node>>[0]) =>
      setNodes((current) => applyNodeChanges(changes, current)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges<Edge>>[0]) =>
      setEdges((current) => applyEdgeChanges(changes, current)),
    []
  );

  return (
    <div className="relative h-full w-full" data-testid="sequential-story-harness">
      <SequentialCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        collapsedStepIds={collapsedStepIds}
        onCollapsedStepIdsChange={setCollapsedStepIds}
        onAddTrigger={onAddTrigger}
        mode={mode}
        sequenceLayoutOptions={sequenceLayoutOptions}
      />
    </div>
  );
}
