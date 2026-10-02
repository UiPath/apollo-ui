import {
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  useStore,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '../../utils/testing';
import { ApolloCanvasDiffPane } from './ApolloCanvasDiffPane';
import { CanvasDiffView } from './CanvasDiffView';
import type { DiffModel, DiffPaneContext, DiffViewport } from './CanvasDiffView.types';

// Real React Flow (the shared setup mocks it) so both panes run the actual viewport wiring.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => importOriginal());

function ProbeNode({ id, data, selected }: NodeProps) {
  return (
    <div
      data-testid={`node-${id}`}
      data-suggestion={String(data.suggestionType ?? 'none')}
      data-selected={String(!!selected)}
    />
  );
}

function FitProbe() {
  const fitQueued = useStore((state) => state.fitViewQueued);
  return <span data-testid="fit-queued">{String(fitQueued)}</span>;
}

const nodeTypes = { probe: ProbeNode };
const node = (id: string): Node => ({ id, type: 'probe', position: { x: 0, y: 0 }, data: {} });

const model: DiffModel<Node, Edge> = {
  before: { nodes: [node('kept'), node('edited'), node('gone')], edges: [] },
  after: { nodes: [node('kept'), node('edited'), node('fresh')], edges: [] },
  highlight: {
    nodeKind: new Map([
      ['edited', 'changed'],
      ['gone', 'removed'],
      ['fresh', 'added'],
    ]),
    edgeKind: new Map(),
  },
  summary: {
    addedNodes: 1,
    removedNodes: 1,
    changedNodes: 1,
    addedEdges: 0,
    removedEdges: 0,
    changedEdges: 0,
  },
};

function renderDiff({ syncViewport }: { syncViewport?: boolean } = {}) {
  const reported: Array<[string, DiffViewport]> = [];
  const instances: Partial<Record<string, ReactFlowInstance>> = {};
  const renderPane = (ctx: DiffPaneContext<Node, Edge>) => (
    <ApolloCanvasDiffPane
      {...ctx}
      nodeTypes={nodeTypes}
      onViewportChange={(viewport) => {
        reported.push([ctx.side, viewport]);
        ctx.onViewportChange(viewport);
      }}
      canvasProps={{
        onInit: (instance) => {
          instances[ctx.side] = instance as unknown as ReactFlowInstance;
        },
      }}
    >
      <FitProbe />
    </ApolloCanvasDiffPane>
  );
  render(<CanvasDiffView model={model} renderPane={renderPane} syncViewport={syncViewport} />);
  const pane = (name: 'Before' | 'After') => within(screen.getByRole('region', { name }));
  return { reported, instances, pane };
}

describe('ApolloCanvasDiffPane inside CanvasDiffView', () => {
  it("marks each side's changes on its nodes", () => {
    const { pane } = renderDiff();

    expect(pane('Before').getByTestId('node-gone')).toHaveAttribute('data-suggestion', 'delete');
    expect(pane('Before').getByTestId('node-edited')).toHaveAttribute('data-suggestion', 'update');
    expect(pane('After').getByTestId('node-fresh')).toHaveAttribute('data-suggestion', 'add');
    expect(pane('After').getByTestId('node-kept')).toHaveAttribute('data-suggestion', 'none');
  });

  it('selects a clicked node in both panes and clears on a pane click', () => {
    const { pane } = renderDiff();

    fireEvent.click(pane('Before').getByTestId('node-edited'));
    expect(pane('Before').getByTestId('node-edited')).toHaveAttribute('data-selected', 'true');
    expect(pane('After').getByTestId('node-edited')).toHaveAttribute('data-selected', 'true');

    const afterPane = screen.getByRole('region', { name: 'After' });
    fireEvent.click(afterPane.querySelector('.react-flow__pane') as Element);
    expect(pane('Before').getByTestId('node-edited')).toHaveAttribute('data-selected', 'false');
  });

  it('moves the other pane with a pan and does not echo it back', async () => {
    const { reported, instances } = renderDiff();
    const pan = { x: 40, y: 30, zoom: 0.5 };
    await waitFor(() => expect(instances.before && instances.after).toBeDefined());

    await act(async () => {
      await instances.before?.setViewport(pan);
    });

    expect(instances.after?.getViewport()).toEqual(pan);
    expect(reported).toEqual([['before', pan]]);
  });

  it('fits only the after pane on mount while viewports are synced', () => {
    const { pane } = renderDiff();

    expect(pane('Before').getByTestId('fit-queued')).toHaveTextContent('false');
    expect(pane('After').getByTestId('fit-queued')).toHaveTextContent('true');
  });

  it('fits both panes when viewports are independent', () => {
    const { pane } = renderDiff({ syncViewport: false });

    expect(pane('Before').getByTestId('fit-queued')).toHaveTextContent('true');
    expect(pane('After').getByTestId('fit-queued')).toHaveTextContent('true');
  });
});
