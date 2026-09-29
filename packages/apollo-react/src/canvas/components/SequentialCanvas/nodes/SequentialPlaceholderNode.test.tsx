import { describe, expect, it, vi } from 'vitest';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';
import { fireEvent, render, screen } from '../../../utils/testing';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import {
  SequentialExternalDropProvider,
  type SequentialExternalDropValue,
} from '../SequentialExternalDropContext';
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

describe('SequentialPlaceholderNode external drop', () => {
  const slot: InsertionSlot = {
    id: 'slot:lane:if:false',
    source: { nodeId: 'if', handleId: 'false' },
  };
  const dataTransfer = () => ({ types: ['application/x-activity'], dropEffect: 'none' });

  function renderWithDrop(data: object, value: Partial<SequentialExternalDropValue> = {}) {
    const context: SequentialExternalDropValue = {
      isDragActive: true,
      accepts: () => true,
      drop: vi.fn(),
      getPlaceholderSlot: (id) => (id === 'ph' ? slot : undefined),
      ...value,
    };
    render(
      <BaseCanvasModeProvider mode="design">
        <SequentialExternalDropProvider value={context}>
          <SequentialPlaceholderNode {...props(data)} />
        </SequentialExternalDropProvider>
      </BaseCanvasModeProvider>
    );
    return context;
  }

  it('reports a drop on the dashed row with its slot', () => {
    const context = renderWithDrop({ variant: 'row', onAdd: () => {} });
    const row = screen.getByTestId('sequential-placeholder-bar');

    expect(fireEvent.dragOver(row, { dataTransfer: dataTransfer() })).toBe(false);
    expect(row).toHaveAttribute('data-drop-over');
    expect(fireEvent.drop(row, { dataTransfer: dataTransfer() })).toBe(false);

    expect(context.drop).toHaveBeenCalledWith(expect.objectContaining({ type: 'drop' }), slot);
    expect(row).not.toHaveAttribute('data-drop-over');
  });

  it('reports a drop on the plus with its slot, and shows the plus during a drag', () => {
    const context = renderWithDrop({ variant: 'plus', onAdd: () => {} });
    const button = screen.getByRole('button', { name: 'Add step' });
    expect(button.className).toContain('opacity-100');

    fireEvent.drop(button.parentElement!, { dataTransfer: dataTransfer() });

    expect(context.drop).toHaveBeenCalledWith(expect.objectContaining({ type: 'drop' }), slot);
  });

  it('ignores a drag the host does not accept', () => {
    const context = renderWithDrop({ variant: 'row', onAdd: () => {} }, { accepts: () => false });
    const row = screen.getByTestId('sequential-placeholder-bar');

    expect(fireEvent.dragOver(row, { dataTransfer: dataTransfer() })).toBe(true);
    expect(fireEvent.drop(row, { dataTransfer: dataTransfer() })).toBe(true);
    expect(context.drop).not.toHaveBeenCalled();
  });

  it('is not a drop target when the canvas has no slot for it', () => {
    const context = renderWithDrop(
      { variant: 'row', onAdd: () => {} },
      { getPlaceholderSlot: () => undefined }
    );
    const row = screen.getByTestId('sequential-placeholder-bar');

    expect(fireEvent.dragOver(row, { dataTransfer: dataTransfer() })).toBe(true);
    fireEvent.drop(row, { dataTransfer: dataTransfer() });
    expect(context.drop).not.toHaveBeenCalled();
  });
});
