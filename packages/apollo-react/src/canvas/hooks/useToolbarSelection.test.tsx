import { act, render } from '@testing-library/react';
import { type Node, ReactFlow, ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { ToolbarSelection } from '../utils/toolbar-resolver';
import { useToolbarSelection } from './useToolbarSelection';

// The shared test setup mocks React Flow; selection is read from and written to its real store here.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

const nodes: Node[] = [
  { id: 'a', position: { x: 0, y: 0 }, data: {}, selected: true },
  { id: 'b', position: { x: 0, y: 100 }, data: {}, selected: true },
  { id: 'c', position: { x: 0, y: 200 }, data: {} },
];

const renderSelection = () => {
  let selection: ToolbarSelection | undefined;
  function Probe() {
    selection = useToolbarSelection();
    return null;
  }
  render(
    <ReactFlowProvider>
      <ReactFlow defaultNodes={nodes} defaultEdges={[]}>
        <Probe />
      </ReactFlow>
    </ReactFlowProvider>
  );
  return () => selection as ToolbarSelection;
};

describe('useToolbarSelection', () => {
  it('reads the selected nodes from the canvas', () => {
    const selection = renderSelection();

    expect(selection().selectedNodeIds()).toEqual(['a', 'b']);
  });

  it('makes one node the only selection', () => {
    const selection = renderSelection();

    act(() => selection().selectOnly('c'));

    expect(selection().selectedNodeIds()).toEqual(['c']);
  });
});
