import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../utils/testing';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import { SequentialLaneAddProvider } from '../SequentialLaneAddContext';
import { SequentialPlaceholderNode } from './SequentialPlaceholderNode';

// xyflow <Handle>s need a store provider; only the affordance rendering is under test.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  return { ...actual, Handle: () => null };
});

// biome-ignore lint/suspicious/noExplicitAny: minimal NodeProps stub.
const props = (data: object) => ({ id: 'ph', data, width: 896, height: 44 }) as any;

function renderNode(data: object, mode: 'design' | 'view' = 'design') {
  return render(
    <BaseCanvasModeProvider mode={mode}>
      <SequentialPlaceholderNode {...props(data)} />
    </BaseCanvasModeProvider>
  );
}

describe('SequentialPlaceholderNode', () => {
  it('renders the dashed Add step row for the row variant (empty lane/body)', () => {
    renderNode({ variant: 'row', onAdd: () => {} });
    expect(screen.getByTestId('sequential-placeholder-bar')).toBeInTheDocument();
    expect(screen.getByText('Add step')).toBeInTheDocument();
    expect(screen.queryByTestId('sequential-placeholder-plus')).not.toBeInTheDocument();
  });

  it('renders a quiet plus (no visible label) for the plus variant (append)', () => {
    renderNode({ variant: 'plus', onAdd: () => {} });
    expect(screen.getByTestId('sequential-placeholder-plus')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add step' })).toBeInTheDocument();
    expect(screen.queryByText('Add step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sequential-placeholder-bar')).not.toBeInTheDocument();
  });

  it('keeps the row button free of non-phrasing content', () => {
    renderNode({ variant: 'row', onAdd: () => {} });
    const button = screen.getByTestId('sequential-placeholder-bar');
    // xyflow handles are <div>s, not allowed inside a <button>; they live on the shell.
    expect(button.querySelector('div')).toBeNull();
    expect(button.parentElement).not.toBeNull();
  });

  it('defaults to the row variant when none is given', () => {
    renderNode({ onAdd: () => {} });
    expect(screen.getByTestId('sequential-placeholder-bar')).toBeInTheDocument();
  });

  it('calls onAdd when the plus is clicked in design mode', () => {
    const onAdd = vi.fn();
    renderNode({ variant: 'plus', onAdd });
    fireEvent.click(screen.getByRole('button', { name: 'Add step' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('does not add outside design mode', () => {
    const onAdd = vi.fn();
    renderNode({ variant: 'plus', onAdd }, 'view');
    fireEvent.click(screen.getByRole('button', { name: 'Add step' }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('adds a lane placeholder through the shared lane-add context with its slot id', () => {
    const onLaneAdd = vi.fn();
    render(
      <BaseCanvasModeProvider mode="design">
        <SequentialLaneAddProvider onLaneAdd={onLaneAdd}>
          <SequentialPlaceholderNode {...props({ variant: 'row', insertionSlotId: 'slot:x' })} />
        </SequentialLaneAddProvider>
      </BaseCanvasModeProvider>
    );
    fireEvent.click(screen.getByTestId('sequential-placeholder-bar'));
    expect(onLaneAdd).toHaveBeenCalledWith('slot:x');
  });

  it('disables a lane placeholder when no lane-add handler is provided', () => {
    renderNode({ variant: 'row', insertionSlotId: 'slot:x' });
    expect(screen.getByTestId('sequential-placeholder-bar')).toBeDisabled();
  });
});
