import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../utils/testing';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import { SequentialPlaceholderNode } from './SequentialPlaceholderNode';

// The node renders xyflow <Handle>s, which need a store provider. This test
// only exercises the affordance rendering, so stub them out.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  return { ...actual, Handle: () => null };
});

// Minimal NodeProps stand-in for a focused render test.
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
    // The row shows a visible label.
    expect(screen.getByText('Add step')).toBeInTheDocument();
    expect(screen.queryByTestId('sequential-placeholder-plus')).not.toBeInTheDocument();
  });

  it('renders a quiet plus (no visible label) for the plus variant (append)', () => {
    renderNode({ variant: 'plus', onAdd: () => {} });
    expect(screen.getByTestId('sequential-placeholder-plus')).toBeInTheDocument();
    // The plus is icon-only: labelled for a11y, but no visible text.
    expect(screen.getByRole('button', { name: 'Add step' })).toBeInTheDocument();
    expect(screen.queryByText('Add step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sequential-placeholder-bar')).not.toBeInTheDocument();
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
});
