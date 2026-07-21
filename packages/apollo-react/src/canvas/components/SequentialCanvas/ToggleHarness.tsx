import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { applyEdgeChanges, applyNodeChanges } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useRef, useState } from 'react';
import { BaseNode } from '../BaseNode/BaseNode';
import { SequentialCanvas } from './SequentialCanvas';
import { SequentialViewProvider, useSequentialView } from './SequentialViewContext';
import { synthesizePositionsForFlow } from './synthesizePositionsForFlow';
import { ViewSwitcher } from './ViewSwitcher';

export interface ToggleHarnessProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  storageKey?: string;
  mode?: 'design' | 'view' | 'readonly';
}

const FLOW_NODE_TYPES = { default: BaseNode };

/**
 * Minimal composition demonstrating the flow<->sequential toggle (D11): a single
 * canonical nodes/edges state, a ViewSwitcher, and one mounted SequentialCanvas
 * that swaps its derived arrays in place. On toggle back to flow, nodes inserted
 * while in sequential view (stamped `seqInserted`) get real positions via
 * synthesizePositionsForFlow, so the round-trip is lossless.
 *
 * Used by tests and stories; not part of the public barrel (D13).
 */
export function ToggleHarness({
  initialNodes,
  initialEdges,
  storageKey = 'sequential-canvas.toggle-harness',
  mode = 'design',
}: ToggleHarnessProps) {
  return (
    <SequentialViewProvider storageKey={storageKey} initialView="sequential">
      <ToggleHarnessInner initialNodes={initialNodes} initialEdges={initialEdges} mode={mode} />
    </SequentialViewProvider>
  );
}

function ToggleHarnessInner({
  initialNodes,
  initialEdges,
  mode,
}: Required<Omit<ToggleHarnessProps, 'storageKey'>>) {
  const { view, setView } = useSequentialView();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const handleViewChange = useCallback(
    (nextView: typeof view) => {
      if (view === 'sequential' && nextView === 'flow') {
        setNodes((current) => synthesizePositionsForFlow(current, edgesRef.current));
      }
      setView(nextView);
    },
    [view, setView]
  );

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ padding: 8 }}>
        <ViewSwitcher value={view} onChange={handleViewChange} />
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 480 }}>
        <SequentialCanvas
          view={view}
          nodes={nodes}
          edges={edges}
          flowNodeTypes={FLOW_NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          mode={mode}
        />
      </div>
    </div>
  );
}
