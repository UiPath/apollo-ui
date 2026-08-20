import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../utils/testing';
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
