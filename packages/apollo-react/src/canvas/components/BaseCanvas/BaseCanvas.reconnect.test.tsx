import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Reconnect anchors are rendered by React Flow only for edges it can measure,
 * which jsdom never reports, so asserting on the anchor DOM would pass
 * vacuously. Capture the props BaseCanvas hands to ReactFlow instead: anchors
 * appear purely because `onReconnect` is defined (`edgesReconnectable`
 * defaults to true), so the prop is the switch under test.
 */
const reactFlowProps: Record<string, unknown>[] = [];

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    ReactFlow: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
      reactFlowProps.push(props);
      return <div data-testid="react-flow">{props.children}</div>;
    },
  };
});

import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { BaseCanvas } from './BaseCanvas';

const nodes: Node[] = [
  { id: 'a', position: { x: 0, y: 0 }, data: {} },
  { id: 'b', position: { x: 300, y: 0 }, data: {} },
];
const edges: Edge[] = [{ id: 'a-b', source: 'a', target: 'b' }];

const renderCanvas = (mode: React.ComponentProps<typeof BaseCanvas>['mode']) => {
  reactFlowProps.length = 0;
  render(
    <ReactFlowProvider>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        mode={mode}
        onReconnect={vi.fn()}
        onReconnectEnd={vi.fn()}
      />
    </ReactFlowProvider>
  );

  return reactFlowProps.at(-1) as Record<string, unknown>;
};

describe('BaseCanvas reconnect callbacks', () => {
  it('forwards them in design mode', () => {
    const props = renderCanvas('design');

    expect(props.onReconnect).toBeTypeOf('function');
    expect(props.onReconnectEnd).toBeTypeOf('function');
  });

  it.each(['view', 'readonly'] as const)('withholds them in %s mode', (mode) => {
    const props = renderCanvas(mode);

    expect(props.onReconnect).toBeUndefined();
    expect(props.onReconnectEnd).toBeUndefined();
  });
});
