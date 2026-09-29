import { createEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';
import { fireEvent, render, screen } from '../../../utils/testing';
import {
  SequentialExternalDropProvider,
  type SequentialExternalDropValue,
} from '../SequentialExternalDropContext';
import { SequentialInsertButton } from './SequentialInsertButton';

// The button portals through xyflow's EdgeLabelRenderer, which needs a store.
// test/canvas-mocks.ts mocks xyflow globally and renders its children inline.

const point = { x: 120, y: 240 };
const label = 'Insert step after step 2';

describe('SequentialInsertButton', () => {
  it('renders a labelled affordance at the connector midpoint', () => {
    render(<SequentialInsertButton point={point} label={label} onInsert={vi.fn()} />);

    const button = screen.getByRole('button', { name: label });
    expect(button).toBeInTheDocument();
    // The label is the only thing that tells a screen-reader user WHICH slot this
    // opens, since every connector renders an identical plus glyph.
    expect(button.closest('[style]')).toHaveStyle({
      transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
    });
  });

  it('invokes onInsert when clicked', () => {
    const onInsert = vi.fn();
    render(<SequentialInsertButton point={point} label={label} onInsert={onInsert} />);

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(onInsert).toHaveBeenCalledTimes(1);
  });

  it('stops click and mousedown from reaching the canvas', () => {
    // Both matter, and for different reasons. The click must not fall through to
    // the canvas (which would deselect / pan), and the mousedown must not reach
    // the Toolbox's outside-mousedown listener, which would close the very Add
    // Node panel this button is opening.
    const onInsert = vi.fn();
    const onContainerClick = vi.fn();
    const onContainerMouseDown = vi.fn();
    render(
      <div onClick={onContainerClick} onMouseDown={onContainerMouseDown}>
        <SequentialInsertButton point={point} label={label} onInsert={onInsert} />
      </div>
    );

    const button = screen.getByRole('button', { name: label });
    fireEvent.mouseDown(button);
    fireEvent.click(button);

    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onContainerClick).not.toHaveBeenCalled();
    expect(onContainerMouseDown).not.toHaveBeenCalled();
  });
});

describe('SequentialInsertButton external drop', () => {
  const slot: InsertionSlot = {
    id: 'slot:edge:e1',
    source: { nodeId: 'a', handleId: 'output' },
    target: { nodeId: 'b', handleId: 'input' },
    graphEdgeId: 'e1',
  };
  const dataTransfer = () => ({ types: ['application/x-activity'], dropEffect: 'none' });

  function renderWithDrop(value: Partial<SequentialExternalDropValue>, buttonSlot = slot) {
    const context: SequentialExternalDropValue = {
      isDragActive: true,
      accepts: () => true,
      drop: vi.fn(),
      getPlaceholderSlot: () => undefined,
      ...value,
    };
    render(
      <SequentialExternalDropProvider value={context}>
        <SequentialInsertButton point={point} label={label} onInsert={vi.fn()} slot={buttonSlot} />
      </SequentialExternalDropProvider>
    );
    const button = screen.getByRole('button', { name: label });
    // The drag handlers sit on the positioned wrapper around the button.
    return { context, button, target: button.parentElement! };
  }

  it('shows at full strength during a drag and highlights while dragged over', () => {
    const { button, target } = renderWithDrop({});
    expect(button.className).toContain('opacity-100');

    const dragOver = createEvent.dragOver(target, { dataTransfer: dataTransfer() });
    fireEvent(target, dragOver);

    expect(dragOver.defaultPrevented).toBe(true);
    expect((dragOver as DragEvent).dataTransfer?.dropEffect).toBe('copy');
    expect(target).toHaveAttribute('data-drop-over');
  });

  it('reports a drop with its slot and stops it reaching the canvas', () => {
    const onContainerDrop = vi.fn();
    const drop = vi.fn();
    const context: SequentialExternalDropValue = {
      isDragActive: true,
      accepts: () => true,
      drop,
      getPlaceholderSlot: () => undefined,
    };
    render(
      <div onDrop={onContainerDrop}>
        <SequentialExternalDropProvider value={context}>
          <SequentialInsertButton point={point} label={label} onInsert={vi.fn()} slot={slot} />
        </SequentialExternalDropProvider>
      </div>
    );
    const target = screen.getByRole('button', { name: label }).parentElement!;

    fireEvent.dragOver(target, { dataTransfer: dataTransfer() });
    const notPrevented = fireEvent.drop(target, { dataTransfer: dataTransfer() });

    expect(notPrevented).toBe(false);
    expect(drop).toHaveBeenCalledWith(expect.objectContaining({ type: 'drop' }), slot);
    expect(onContainerDrop).not.toHaveBeenCalled();
    expect(target).not.toHaveAttribute('data-drop-over');
  });

  it('ignores a drag the host does not accept', () => {
    const { context, target } = renderWithDrop({ accepts: () => false });

    expect(fireEvent.dragOver(target, { dataTransfer: dataTransfer() })).toBe(true);
    expect(fireEvent.drop(target, { dataTransfer: dataTransfer() })).toBe(true);

    expect(context.drop).not.toHaveBeenCalled();
    expect(target).not.toHaveAttribute('data-drop-over');
  });

  it('is not a drop target without the external drop context', () => {
    render(<SequentialInsertButton point={point} label={label} onInsert={vi.fn()} slot={slot} />);
    const button = screen.getByRole('button', { name: label });

    expect(fireEvent.dragOver(button.parentElement!, { dataTransfer: dataTransfer() })).toBe(true);
    expect(button.className).toContain('opacity-40');
  });
});
