import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../utils/testing';
import { SequentialInsertButton } from './SequentialInsertButton';

const point = { x: 120, y: 240 };
const label = 'Insert step after step 2';

function renderButton(onInsert = vi.fn()) {
  render(
    <SequentialInsertButton edgeId="e1" x={point.x} y={point.y} label={label} onInsert={onInsert} />
  );
  return onInsert;
}

describe('SequentialInsertButton', () => {
  it('renders a labelled affordance at the connector midpoint', () => {
    renderButton();

    const button = screen.getByRole('button', { name: label });
    expect(button).toBeInTheDocument();
    expect(button.closest('[style]')).toHaveStyle({
      transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
    });
  });

  it('invokes onInsert with its connector id when clicked', () => {
    const onInsert = renderButton();

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert).toHaveBeenCalledWith('e1');
  });

  it('stops click and mousedown from reaching the canvas', () => {
    // mousedown must not reach the Toolbox's outside-mousedown listener, which
    // would close the very Add Node panel this button is opening.
    const onInsert = vi.fn();
    const onContainerClick = vi.fn();
    const onContainerMouseDown = vi.fn();
    render(
      <div onClick={onContainerClick} onMouseDown={onContainerMouseDown}>
        <SequentialInsertButton
          edgeId="e1"
          x={point.x}
          y={point.y}
          label={label}
          onInsert={onInsert}
        />
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
