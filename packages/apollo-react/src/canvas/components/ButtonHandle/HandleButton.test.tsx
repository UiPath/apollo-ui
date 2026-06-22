import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HandleButton } from './HandleButton';

const DRAG_THRESHOLD = 5;

function renderButton({
  visible = true,
  onAction = vi.fn<(e: React.MouseEvent) => void>(),
  onMouseEnter,
  onMouseLeave,
  handleEl,
}: {
  visible?: boolean;
  onAction?: (event: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  handleEl?: HTMLDivElement;
} = {}) {
  const handleRef = { current: handleEl ?? null } as React.RefObject<HTMLDivElement | null>;

  const result = render(
    <HandleButton
      visible={visible}
      position={Position.Right}
      onAction={onAction}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      handleRef={handleRef}
    />
  );

  const button = screen.getByRole('button', { name: 'Add node' });
  return { button, onAction, handleRef, ...result };
}

describe('HandleButton drag behaviour', () => {
  afterEach(cleanup);

  it('fires onAction on a plain click (no pointer movement)', () => {
    const { button, onAction } = renderButton();

    fireEvent.pointerDown(button, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(document);
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('suppresses the click after a drag that exceeds the threshold', () => {
    const { button, onAction } = renderButton();

    fireEvent.pointerDown(button, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(document, { clientX: 100 + DRAG_THRESHOLD + 1, clientY: 100 });
    fireEvent.pointerUp(document);
    fireEvent.click(button);

    expect(onAction).not.toHaveBeenCalled();
  });

  it('still fires onAction when movement stays below the threshold', () => {
    const { button, onAction } = renderButton();

    // Move just under the threshold (diagonal distance < 5)
    fireEvent.pointerDown(button, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(document, { clientX: 103, clientY: 103 }); // √(9+9) ≈ 4.24
    fireEvent.pointerUp(document);
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('dispatches a synthetic mousedown on the handle element when drag starts', () => {
    const handleEl = document.createElement('div');
    handleEl.getBoundingClientRect = () =>
      ({ left: 50, top: 50, width: 10, height: 10 }) as DOMRect;

    const mousedownSpy = vi.fn();
    handleEl.addEventListener('mousedown', mousedownSpy);

    const { button } = renderButton({ handleEl });

    fireEvent.pointerDown(button, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(document, { clientX: 100 + DRAG_THRESHOLD + 1, clientY: 100 });

    expect(mousedownSpy).toHaveBeenCalledOnce();
    const event = mousedownSpy.mock.calls[0]?.[0] as MouseEvent;
    expect(event.clientX).toBe(55); // rect.left + width/2
    expect(event.clientY).toBe(55); // rect.top  + height/2
  });

  it('only dispatches a single mousedown even with continued movement', () => {
    const handleEl = document.createElement('div');
    handleEl.getBoundingClientRect = () => ({ left: 0, top: 0, width: 10, height: 10 }) as DOMRect;

    const mousedownSpy = vi.fn();
    handleEl.addEventListener('mousedown', mousedownSpy);

    const { button } = renderButton({ handleEl });

    fireEvent.pointerDown(button, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 20, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 40, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 60, clientY: 0 });

    expect(mousedownSpy).toHaveBeenCalledOnce();
  });

  it('removes document listeners after pointerup', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { button } = renderButton();

    fireEvent.pointerDown(button, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(document);

    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

    removeSpy.mockRestore();
  });

  it('removes document listeners on unmount during an active drag', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { button, unmount } = renderButton();

    fireEvent.pointerDown(button, { clientX: 0, clientY: 0 });
    // Unmount without pointerup — the cleanup effect should fire
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

    removeSpy.mockRestore();
  });

  it('resets drag state for a new gesture after a previous drag', () => {
    const { button, onAction } = renderButton();

    // First gesture: drag
    fireEvent.pointerDown(button, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 20, clientY: 0 });
    fireEvent.pointerUp(document);
    fireEvent.click(button);
    expect(onAction).not.toHaveBeenCalled();

    // Second gesture: clean click
    fireEvent.pointerDown(button, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(document);
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledOnce();
  });
});

describe('HandleButton hover handlers', () => {
  afterEach(cleanup);

  it('invokes onMouseEnter when the cursor enters the inline button', async () => {
    const user = userEvent.setup();
    const onMouseEnter = vi.fn();
    const { button } = renderButton({ onMouseEnter });

    await user.hover(button);

    expect(onMouseEnter).toHaveBeenCalledOnce();
  });

  it('invokes onMouseLeave when the cursor leaves the inline button', async () => {
    const user = userEvent.setup();
    const onMouseLeave = vi.fn();
    const { button } = renderButton({ onMouseLeave });

    await user.hover(button);
    await user.unhover(button);

    expect(onMouseLeave).toHaveBeenCalledOnce();
  });

  it('still calls onAction on click when hover handlers are wired', async () => {
    const user = userEvent.setup();
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const { button, onAction } = renderButton({ onMouseEnter, onMouseLeave });

    await user.hover(button);
    await user.click(button);

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('does not throw when hovering with no hover handlers supplied', async () => {
    const user = userEvent.setup();
    const { button } = renderButton();

    await expect(user.hover(button)).resolves.toBeUndefined();
    await expect(user.unhover(button)).resolves.toBeUndefined();
  });
});

describe('HandleButton mount & label visibility', () => {
  afterEach(cleanup);

  it('unmounts the add button when not visible (default behavior)', () => {
    render(<HandleButton visible={false} position={Position.Top} onAction={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Add node' })).toBeNull();
  });

  it('keeps the add button mounted but transparent when keepButtonMounted and not visible', () => {
    render(
      <HandleButton visible={false} keepButtonMounted position={Position.Top} onAction={vi.fn()} />
    );

    // aria-hidden removes it from the accessible tree (and zeroes its accessible
    // name), so query with hidden: true and check the label via the attribute.
    const button = screen.getByRole('button', { hidden: true });
    expect(button).toHaveAttribute('aria-label', 'Add node');
    expect(button.className).toContain('opacity-0');
    expect(button.className).toContain('pointer-events-none');
    expect(button).toHaveAttribute('aria-hidden', 'true');
    // disabled (not just tabindex=-1) so aria-hidden is not applied to a focusable element.
    expect(button).toBeDisabled();
  });

  it('shows the mounted add button when keepButtonMounted and visible', () => {
    render(<HandleButton visible keepButtonMounted position={Position.Top} onAction={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'Add node' });
    expect(button.className).toContain('opacity-100');
    expect(button.className).toContain('pointer-events-auto');
  });

  it('fades the label via labelVisible', () => {
    const { rerender } = render(
      <HandleButton
        visible
        position={Position.Top}
        onAction={vi.fn()}
        label="Tools"
        labelVisible={false}
      />
    );
    expect(screen.getByText('Tools').closest('[class*="transition-opacity"]')?.className).toContain(
      'opacity-0'
    );

    rerender(
      <HandleButton visible position={Position.Top} onAction={vi.fn()} label="Tools" labelVisible />
    );
    expect(screen.getByText('Tools').closest('[class*="transition-opacity"]')?.className).toContain(
      'opacity-100'
    );
  });
});
