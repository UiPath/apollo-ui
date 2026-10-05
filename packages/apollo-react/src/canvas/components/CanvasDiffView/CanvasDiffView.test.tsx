import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, within } from '../../utils/testing';
import { CanvasDiffView } from './CanvasDiffView';
import type { DiffModel, DiffPaneContext } from './CanvasDiffView.types';

type TestNode = { id: string };
type TestEdge = { id: string };

const model: DiffModel<TestNode, TestEdge> = {
  before: { nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ id: 'a-b' }] },
  after: { nodes: [{ id: 'a' }, { id: 'c' }], edges: [] },
  highlight: {
    nodeKind: new Map([
      ['b', 'removed'],
      ['c', 'added'],
      ['a', 'changed'],
    ]),
    edgeKind: new Map([['a-b', 'removed']]),
  },
  summary: {
    addedNodes: 1,
    removedNodes: 1,
    changedNodes: 1,
    addedEdges: 0,
    removedEdges: 1,
    changedEdges: 0,
  },
};

const emptyModel: DiffModel<TestNode, TestEdge> = {
  before: { nodes: [], edges: [] },
  after: { nodes: [], edges: [] },
  highlight: { nodeKind: new Map(), edgeKind: new Map() },
  summary: {
    addedNodes: 0,
    removedNodes: 0,
    changedNodes: 0,
    addedEdges: 0,
    removedEdges: 0,
    changedEdges: 0,
  },
};

function TestPane(ctx: DiffPaneContext<TestNode, TestEdge>) {
  return (
    <div data-testid={`pane-${ctx.side}`}>
      <span data-testid={`nodes-${ctx.side}`}>{ctx.nodes.map((n) => n.id).join(',')}</span>
      <span data-testid={`fit-${ctx.side}`}>{String(ctx.fitViewOnMount)}</span>
      <span data-testid={`selected-${ctx.side}`}>{ctx.selectedNodeId ?? 'none'}</span>
      <span data-testid={`viewport-${ctx.side}`}>
        {ctx.viewport ? `${ctx.viewport.x},${ctx.viewport.y},${ctx.viewport.zoom}` : 'none'}
      </span>
      <span data-testid={`highlight-${ctx.side}`}>
        {[...ctx.highlight.nodeKind.keys(), ...ctx.highlight.edgeKind.keys()].join(',')}
      </span>
      <button type="button" onClick={() => ctx.onSelectNode('a')}>
        select-{ctx.side}
      </button>
      <button type="button" onClick={() => ctx.onSelectNode(undefined)}>
        clear-{ctx.side}
      </button>
      <button type="button" onClick={() => ctx.onViewportChange({ x: 10, y: 20, zoom: 1.5 })}>
        pan-{ctx.side}
      </button>
    </div>
  );
}

const renderPane = (ctx: DiffPaneContext<TestNode, TestEdge>) => <TestPane {...ctx} />;

describe('CanvasDiffView', () => {
  it('renders both panes with their side of the model', () => {
    render(<CanvasDiffView model={model} renderPane={renderPane} />);

    expect(screen.getByTestId('nodes-before')).toHaveTextContent('a,b');
    expect(screen.getByTestId('nodes-after')).toHaveTextContent('a,c');
    expect(screen.getByRole('region', { name: 'Before' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'After' })).toBeInTheDocument();
  });

  it("gives each pane only its side's changes", () => {
    render(<CanvasDiffView model={model} renderPane={renderPane} />);

    expect(screen.getByTestId('highlight-before')).toHaveTextContent('b,a,a-b');
    expect(screen.getByTestId('highlight-after')).toHaveTextContent('c,a');
  });

  it('shares an uncontrolled selection across panes', async () => {
    const user = userEvent.setup();
    render(<CanvasDiffView model={model} renderPane={renderPane} />);

    await user.click(screen.getByRole('button', { name: 'select-before' }));
    expect(screen.getByTestId('selected-before')).toHaveTextContent('a');
    expect(screen.getByTestId('selected-after')).toHaveTextContent('a');

    await user.click(screen.getByRole('button', { name: 'clear-after' }));
    expect(screen.getByTestId('selected-before')).toHaveTextContent('none');
  });

  it('defers to a controlled selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CanvasDiffView
        model={model}
        renderPane={renderPane}
        selection={{ selectedNodeId: 'c', onChange }}
      />
    );

    expect(screen.getByTestId('selected-before')).toHaveTextContent('c');
    await user.click(screen.getByRole('button', { name: 'select-after' }));
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByTestId('selected-after')).toHaveTextContent('c');
  });

  it("delivers one pane's viewport change to the other pane's context", async () => {
    const user = userEvent.setup();
    render(<CanvasDiffView model={model} renderPane={renderPane} />);

    expect(screen.getByTestId('viewport-after')).toHaveTextContent('none');
    await user.click(screen.getByRole('button', { name: 'pan-before' }));
    expect(screen.getByTestId('viewport-after')).toHaveTextContent('10,20,1.5');
    expect(screen.getByTestId('viewport-before')).toHaveTextContent('10,20,1.5');
  });

  it("keeps each side's highlight maps across pans and selection, so panes do no per-frame remapping", async () => {
    const user = userEvent.setup();
    const seen: DiffPaneContext<TestNode, TestEdge>['highlight'][] = [];
    render(
      <CanvasDiffView
        model={model}
        renderPane={(ctx) => {
          if (ctx.side === 'after') seen.push(ctx.highlight);
          return <TestPane {...ctx} />;
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'pan-before' }));
    await user.click(screen.getByRole('button', { name: 'select-before' }));

    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1);
  });

  it('lets the after pane lead the mount-time fit', () => {
    render(<CanvasDiffView model={model} renderPane={renderPane} />);

    expect(screen.getByTestId('fit-after')).toHaveTextContent('true');
    expect(screen.getByTestId('fit-before')).toHaveTextContent('false');
  });

  it('lets the before pane lead the fit when every node was removed', () => {
    const allRemoved = { ...model, after: { nodes: [], edges: [] } };
    render(<CanvasDiffView model={allRemoved} renderPane={renderPane} />);

    expect(screen.getByTestId('fit-before')).toHaveTextContent('true');
    expect(screen.getByTestId('fit-after')).toHaveTextContent('false');
  });

  it('keeps the after pane as fit leader when every node was added', () => {
    const allAdded = { ...model, before: { nodes: [], edges: [] } };
    render(<CanvasDiffView model={allAdded} renderPane={renderPane} />);

    expect(screen.getByTestId('fit-after')).toHaveTextContent('true');
    expect(screen.getByTestId('fit-before')).toHaveTextContent('false');
  });

  it('keeps viewports independent when syncViewport is false', async () => {
    const user = userEvent.setup();
    render(<CanvasDiffView model={model} renderPane={renderPane} syncViewport={false} />);

    await user.click(screen.getByRole('button', { name: 'pan-before' }));
    expect(screen.getByTestId('viewport-after')).toHaveTextContent('none');
  });

  it('shows keep and revert only when their handlers are given', async () => {
    const user = userEvent.setup();
    const onKeep = vi.fn();
    const onRevert = vi.fn();
    const { rerender } = render(
      <CanvasDiffView model={model} renderPane={renderPane} onKeep={onKeep} onRevert={onRevert} />
    );

    await user.click(screen.getByRole('button', { name: 'Keep' }));
    await user.click(screen.getByRole('button', { name: 'Revert' }));
    expect(onKeep).toHaveBeenCalledTimes(1);
    expect(onRevert).toHaveBeenCalledTimes(1);

    rerender(<CanvasDiffView model={model} renderPane={renderPane} />);
    expect(screen.queryByRole('button', { name: 'Keep' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revert' })).not.toBeInTheDocument();
  });

  it('uses custom keep and revert labels', () => {
    render(
      <CanvasDiffView
        model={model}
        renderPane={renderPane}
        onKeep={() => {}}
        onRevert={() => {}}
        keepLabel="Accept"
        revertLabel="Decline"
      />
    );

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
  });

  it('offers the code toggle only when a code view is given', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CanvasDiffView model={model} renderPane={renderPane} />);
    expect(screen.queryByRole('radio', { name: 'Code diff' })).not.toBeInTheDocument();

    rerender(
      <CanvasDiffView
        model={model}
        renderPane={renderPane}
        codeView={<pre data-testid="code-view">json</pre>}
      />
    );
    expect(screen.queryByTestId('code-view')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Code diff' }));
    expect(screen.getByTestId('code-view')).toBeInTheDocument();
    expect(screen.queryByTestId('pane-after')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Visual diff' }));
    expect(screen.getByTestId('pane-after')).toBeInTheDocument();
  });

  it('renders only the after pane when showBefore is false', () => {
    render(<CanvasDiffView model={model} renderPane={renderPane} showBefore={false} />);

    expect(screen.getByTestId('pane-after')).toBeInTheDocument();
    expect(screen.queryByTestId('pane-before')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show side by side' })).not.toBeInTheDocument();
  });

  it('toggles orientation, stacked by default', async () => {
    const user = userEvent.setup();
    const onOrientationChange = vi.fn();
    render(
      <CanvasDiffView
        model={model}
        renderPane={renderPane}
        onOrientationChange={onOrientationChange}
      />
    );
    const view = screen.getByTestId('canvas-diff-view');
    expect(view).toHaveAttribute('data-orientation', 'vertical');

    await user.click(screen.getByRole('button', { name: 'Show side by side' }));
    expect(onOrientationChange).toHaveBeenCalledWith('horizontal');
    expect(view).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByRole('button', { name: 'Show stacked' })).toBeInTheDocument();
  });

  it('honours a controlled orientation', async () => {
    const user = userEvent.setup();
    const onOrientationChange = vi.fn();
    render(
      <CanvasDiffView
        model={model}
        renderPane={renderPane}
        orientation="horizontal"
        onOrientationChange={onOrientationChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Show stacked' }));
    expect(onOrientationChange).toHaveBeenCalledWith('vertical');
    expect(screen.getByTestId('canvas-diff-view')).toHaveAttribute(
      'data-orientation',
      'horizontal'
    );
  });

  it('summarises non-zero counts and announces them', () => {
    render(<CanvasDiffView model={model} renderPane={renderPane} />);

    const summary = screen.getByRole('list', { name: 'Change summary' });
    const items = within(summary).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      '1 node added',
      '1 node removed',
      '1 node changed',
      '1 connection removed',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('1 node added');
    expect(screen.getByRole('status')).toHaveTextContent('1 connection removed');
  });

  it('reports an empty diff as no changes', () => {
    render(<CanvasDiffView model={emptyModel} renderPane={renderPane} />);

    expect(
      within(screen.getByRole('list', { name: 'Change summary' })).getByText('No changes')
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No changes');
  });

  it('summarises each phase in its own labelled list', () => {
    const noChange = emptyModel.summary;
    render(
      <CanvasDiffView
        model={{
          ...model,
          changePhases: [
            {
              id: 'applied',
              label: 'Applied this turn',
              highlight: { nodeKind: new Map([['a', 'changed']]), edgeKind: new Map() },
              summary: { ...noChange, changedNodes: 1 },
            },
            {
              id: 'pending',
              label: 'Pending approval',
              highlight: {
                nodeKind: new Map([
                  ['b', 'removed'],
                  ['c', 'added'],
                ]),
                edgeKind: new Map([['a-b', 'removed']]),
              },
              summary: { ...noChange, addedNodes: 1, removedNodes: 1, removedEdges: 1 },
            },
          ],
        }}
        renderPane={renderPane}
      />
    );

    const items = (name: string) =>
      within(screen.getByRole('list', { name }))
        .getAllByRole('listitem')
        .map((item) => item.textContent);
    expect(items('Applied this turn')).toEqual(['1 node changed']);
    expect(items('Pending approval')).toEqual([
      '1 node added',
      '1 node removed',
      '1 connection removed',
    ]);
    expect(screen.queryByRole('list', { name: 'Change summary' })).not.toBeInTheDocument();
  });

  it('starts a fresh review when the model changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CanvasDiffView model={model} renderPane={renderPane} />);

    await user.click(screen.getByRole('button', { name: 'select-before' }));
    await user.click(screen.getByRole('button', { name: 'pan-before' }));
    rerender(<CanvasDiffView model={{ ...model }} renderPane={renderPane} />);

    expect(screen.getByTestId('selected-after')).toHaveTextContent('none');
    expect(screen.getByTestId('viewport-after')).toHaveTextContent('none');
  });

  it('renders the title, header actions and a panel beside each pane', () => {
    render(
      <CanvasDiffView
        model={model}
        renderPane={renderPane}
        title="Agent edits"
        headerActions={<button type="button">Close</button>}
        panelSlot={(ctx) => <div data-testid={`panel-${ctx.side}`}>{ctx.side} panel</div>}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Agent edits' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Before' })).getByTestId('panel-before')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'After' })).getByTestId('panel-after')
    ).toBeInTheDocument();
  });
});
