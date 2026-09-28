import { render, screen } from '@testing-library/react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseCanvas } from './BaseCanvas';
import { useIsConnectionReadOnly, useIsNodeReadOnly } from './ReadOnlyNodesContext';

// CanvasProviders and ReadOnlyNodesContext are deliberately NOT mocked: the
// unit tests stub that seam, so the wiring can be deleted without one failing.
// Only ReactFlow is replaced, by a stand-in that renders nodeTypes for real.

let lastNodes: Node[] = [];
let lastEdges: Edge[] = [];

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  return {
    ...actual,
    ReactFlow: ({
      children,
      nodes,
      edges,
      nodeTypes,
    }: {
      children?: ReactNode;
      nodes: Node[];
      edges: Edge[];
      nodeTypes: Record<string, React.ComponentType<{ id: string }>>;
    }) => {
      lastNodes = nodes;
      lastEdges = edges;
      return (
        <div data-testid="react-flow">
          {nodes.map((node) => {
            const NodeComponent = nodeTypes[node.type ?? ''];
            if (!NodeComponent) {
              return null;
            }
            return <NodeComponent key={node.id} id={node.id} />;
          })}
          {children}
        </div>
      );
    },
    Background: () => <div data-testid="background" />,
    Panel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    useReactFlow: () => ({ fitView: vi.fn(), getNodes: () => [], getEdges: () => [] }),
  };
});

const nodes: Node[] = [
  { id: 'locked-a', type: 'probe', position: { x: 0, y: 0 }, data: {} },
  { id: 'locked-b', type: 'probe', position: { x: 100, y: 0 }, data: {} },
  { id: 'free', type: 'probe', position: { x: 200, y: 0 }, data: {} },
];

// 'inside' lives wholly in the locked region; 'crossing' reaches out of it.
const edges: Edge[] = [
  { id: 'inside', source: 'locked-a', target: 'locked-b' },
  { id: 'crossing', source: 'locked-b', target: 'free' },
];

function ProbeNode({ id }: { id: string }) {
  return <div data-testid={`node-${id}`} data-readonly={String(useIsNodeReadOnly(id))} />;
}

function EdgeProbe({ source, target }: { source: string; target: string }) {
  return (
    <div
      data-testid={`edge-${source}-${target}`}
      data-frozen={String(useIsConnectionReadOnly(source, target))}
    />
  );
}

const renderCanvas = (readOnlyNodeIds?: ReadonlySet<string>) =>
  render(
    <ReactFlowProvider>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={{ probe: ProbeNode }}
        mode="design"
        readOnlyNodeIds={readOnlyNodeIds}
      >
        <EdgeProbe source="locked-a" target="locked-b" />
        <EdgeProbe source="locked-b" target="free" />
      </BaseCanvas>
    </ReactFlowProvider>
  );

const readOnlyAttr = (id: string) => screen.getByTestId(`node-${id}`).dataset.readonly;
const frozenAttr = (source: string, target: string) =>
  screen.getByTestId(`edge-${source}-${target}`).dataset.frozen;
const byId = <T extends { id: string }>(items: T[], id: string) =>
  items.find((item) => item.id === id);

describe('BaseCanvas with individually locked nodes', () => {
  beforeEach(() => {
    lastNodes = [];
    lastEdges = [];
  });

  it('tells each node whether it is locked', () => {
    renderCanvas(new Set(['locked-a', 'locked-b']));

    expect(readOnlyAttr('locked-a')).toBe('true');
    expect(readOnlyAttr('free')).toBe('false');
  });

  it('treats every node as editable when no locks are provided', () => {
    renderCanvas();

    expect(readOnlyAttr('locked-a')).toBe('false');
  });

  // Enforcement is a delete-time veto, not a flag on the elements, so the
  // objects React Flow holds stay the consumer's own. See
  // BaseCanvas.readonlyLeak for the round-trip that matters.
  it('hands React Flow the consumer node objects untouched', () => {
    renderCanvas(new Set(['locked-a', 'locked-b']));

    expect(byId(lastNodes, 'locked-a')).toBe(nodes[0]);
    expect(byId(lastNodes, 'free')).toBe(nodes[2]);
  });

  it('freezes only edges between two locked nodes', () => {
    renderCanvas(new Set(['locked-a', 'locked-b']));

    expect(frozenAttr('locked-a', 'locked-b')).toBe('true');
    expect(frozenAttr('locked-b', 'free')).toBe('false');

    expect(byId(lastEdges, 'inside')).toBe(edges[0]);
    expect(byId(lastEdges, 'crossing')).toBe(edges[1]);
  });
});
