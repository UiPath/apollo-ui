import type {
  Edge,
  Node,
  NodeProps,
  ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '../../utils/testing';
import { ApolloCanvasDiffPane, type ApolloCanvasDiffPaneCanvasProps } from './ApolloCanvasDiffPane';
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

const nodeTypes = { probe: ProbeNode };
// Pre-measured, since jsdom lays nothing out: React Flow fits only measured nodes.
const node = (id: string): Node => ({
  id,
  type: 'probe',
  position: { x: 0, y: 0 },
  measured: { width: 100, height: 40 },
  data: {},
});

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

function renderDiff({
  syncViewport,
  diff = model,
  canvasProps,
}: {
  syncViewport?: boolean;
  diff?: DiffModel<Node, Edge>;
  canvasProps?: ApolloCanvasDiffPaneCanvasProps<Node, Edge>;
} = {}) {
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
        ...canvasProps,
        onInit: (instance) => {
          instances[ctx.side] = instance as unknown as ReactFlowInstance;
        },
      }}
    />
  );
  render(<CanvasDiffView model={diff} renderPane={renderPane} syncViewport={syncViewport} />);
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
    await waitFor(() => expect(reported).toHaveLength(1)); // the after pane's initial fit
    reported.length = 0;

    await act(async () => {
      await instances.before?.setViewport(pan);
    });

    expect(instances.after?.getViewport()).toEqual(pan);
    expect(reported).toEqual([['before', pan]]);
  });

  it('fits the after pane at no more than 100% and the before pane follows', async () => {
    const { reported, instances } = renderDiff();

    await waitFor(() => expect(reported).toHaveLength(1));
    const [side, fit] = reported[0] ?? [];
    expect(side).toBe('after');
    // A 100x40 graph in jsdom's 500x500 fallback pane would fit at the 3x zoom limit uncapped.
    expect(fit?.zoom).toBe(1);
    expect(instances.before?.getViewport()).toEqual(fit);
  });

  it('fits both panes when viewports are independent', async () => {
    const { reported } = renderDiff({ syncViewport: false });

    await waitFor(() => expect(reported.map(([side]) => side).sort()).toEqual(['after', 'before']));
    expect(reported.every(([, viewport]) => viewport.zoom === 1)).toBe(true);
  });

  it('fits the before pane and the after pane follows when every node was removed', async () => {
    const allRemoved = { ...model, after: { nodes: [], edges: [] } };
    const { reported, instances } = renderDiff({ diff: allRemoved });

    await waitFor(() => expect(reported).toHaveLength(1));
    const [side, fit] = reported[0] ?? [];
    expect(side).toBe('before');
    expect(instances.after?.getViewport()).toEqual(fit);
  });

  it('ignores a controlled viewport slipped through canvasProps', async () => {
    const forced = { x: 999, y: 999, zoom: 2 };
    const { reported, instances } = renderDiff({
      canvasProps: { viewport: forced } as ApolloCanvasDiffPaneCanvasProps<Node, Edge>,
    });
    await waitFor(() => expect(reported).toHaveLength(1));
    const pan = { x: 40, y: 30, zoom: 0.5 };

    await act(async () => {
      await instances.before?.setViewport(pan);
    });

    expect(instances.before?.getViewport()).toEqual(pan);
    expect(instances.after?.getViewport()).toEqual(pan);
  });
});
