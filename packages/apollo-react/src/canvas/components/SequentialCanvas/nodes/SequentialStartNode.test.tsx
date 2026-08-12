import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../utils/testing';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import { SequentialStartNode, type SequentialStartNodeData } from './SequentialStartNode';

// The node renders an xyflow <Handle>, which needs a store provider. xyflow is
// mocked globally in test/canvas-mocks.ts, so it renders as an inert marker.

type Mode = 'design' | 'view' | 'readonly';

const startNode = (data: SequentialStartNodeData) => (
  // biome-ignore lint/suspicious/noExplicitAny: minimal NodeProps stub for a focused render test.
  <SequentialStartNode {...({ id: 'start', data, width: 896, height: 56 } as any)} />
);

function renderStartNode(data: SequentialStartNodeData = {}, mode: Mode = 'design') {
  return render(<BaseCanvasModeProvider mode={mode}>{startNode(data)}</BaseCanvasModeProvider>);
}

describe('SequentialStartNode', () => {
  it('renders the start bar with its title', () => {
    renderStartNode();

    expect(screen.getByTestId('sequential-start-bar')).toBeInTheDocument();
    expect(screen.getByText('Workflow start')).toBeInTheDocument();
  });

  it('invokes onAddTrigger when the call to action is clicked', () => {
    const onAddTrigger = vi.fn();
    renderStartNode({ onAddTrigger });

    fireEvent.click(screen.getByRole('button', { name: 'Add trigger' }));

    expect(onAddTrigger).toHaveBeenCalledTimes(1);
  });

  it('stops the click from reaching the canvas, so adding a trigger does not also select the row', () => {
    const onAddTrigger = vi.fn();
    const onContainerClick = vi.fn();
    render(
      <BaseCanvasModeProvider mode="design">
        <div onClick={onContainerClick}>{startNode({ onAddTrigger })}</div>
      </BaseCanvasModeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add trigger' }));

    expect(onAddTrigger).toHaveBeenCalledTimes(1);
    expect(onContainerClick).not.toHaveBeenCalled();
  });

  describe('the trigger call to action is gated', () => {
    it('is hidden when the host wired no onAddTrigger handler', () => {
      renderStartNode();

      expect(screen.queryByRole('button', { name: 'Add trigger' })).not.toBeInTheDocument();
    });

    it.each([
      'view',
      'readonly',
    ] as const)('is hidden in %s mode even when a handler is wired', (mode) => {
      renderStartNode({ onAddTrigger: vi.fn() }, mode);

      // The bar itself still renders: a non-design canvas shows the start row,
      // it just offers no way to mutate the graph from it.
      expect(screen.getByTestId('sequential-start-bar')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add trigger' })).not.toBeInTheDocument();
    });
  });
});
