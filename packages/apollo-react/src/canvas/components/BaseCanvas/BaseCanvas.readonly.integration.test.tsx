import { render, screen } from '@testing-library/react';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BaseCanvas } from './BaseCanvas';
import { useIsNodeReadOnly } from './ReadOnlyNodesContext';

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  return {
    ...actual,
    ReactFlow: ({
      children,
      nodes,
      nodeTypes,
    }: {
      children?: ReactNode;
      nodes: Node[];
      nodeTypes: Record<string, React.ComponentType<{ id: string }>>;
    }) => (
      <div data-testid="react-flow">
        {nodes.map((node) => {
          const NodeComponent = nodeTypes[node.type ?? ''];
          return NodeComponent ? <NodeComponent key={node.id} id={node.id} /> : null;
        })}
        {children}
      </div>
    ),
    Background: () => <div data-testid="background" />,
    Panel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    useReactFlow: () => ({ fitView: vi.fn(), getNodes: () => [], getEdges: () => [] }),
  };
});

const nodes: Node[] = [
  { id: 'locked', type: 'probe', position: { x: 0, y: 0 }, data: {} },
  { id: 'free', type: 'probe', position: { x: 100, y: 0 }, data: {} },
];

function ProbeNode({ id }: { id: string }) {
  return <div data-testid={`node-${id}`} data-readonly={String(useIsNodeReadOnly(id))} />;
}

const renderCanvas = (readOnlyNodeIds?: ReadonlySet<string>) =>
  render(
    <ReactFlowProvider>
      <BaseCanvas
        nodes={nodes}
        edges={[]}
        nodeTypes={{ probe: ProbeNode }}
        mode="design"
        readOnlyNodeIds={readOnlyNodeIds}
      />
    </ReactFlowProvider>
  );

const readOnlyAttr = (id: string) => screen.getByTestId(`node-${id}`).dataset.readonly;

describe('BaseCanvas with individually locked nodes', () => {
  it('tells each node whether it is locked', () => {
    renderCanvas(new Set(['locked']));

    expect(readOnlyAttr('locked')).toBe('true');
    expect(readOnlyAttr('free')).toBe('false');
  });

  it('treats every node as editable when no locks are provided', () => {
    renderCanvas();

    expect(readOnlyAttr('locked')).toBe('false');
  });
});
