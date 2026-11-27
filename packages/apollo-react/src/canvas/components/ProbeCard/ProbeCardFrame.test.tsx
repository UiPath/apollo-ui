import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
import { ProbeCardFrame } from './ProbeCardFrame';

const noop = () => {};

function setup(
  props: Partial<React.ComponentProps<typeof ProbeCardFrame>> = {},
  body: React.ReactNode = <p>Body</p>
) {
  const onClose = vi.fn();
  const utils = render(
    <ProbeCardFrame
      onDragStart={noop}
      onDrag={noop}
      onDragEnd={noop}
      onResizeStart={noop}
      onResize={noop}
      onResizeEnd={noop}
      onClose={onClose}
      {...props}
    >
      {body}
    </ProbeCardFrame>
  );
  return { onClose, ...utils };
}

describe('ProbeCardFrame', () => {
  it('renders its title, header actions and body, with the card named by its label', () => {
    setup({ title: 'Output', headerActions: <button type="button">Collapse</button> });

    expect(screen.getByRole('group', { name: 'Probe' })).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('takes its text from `strings`, falling back to English for the rest', () => {
    setup({ strings: { label: 'Sonde', close: 'Sonde entfernen' } });

    expect(screen.getByRole('group', { name: 'Sonde' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sonde entfernen' })).toBeInTheDocument();
  });

  it('closes from the close button', () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Remove probe' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Delete from a focused button inside it, so the canvas cannot delete the selected node', () => {
    const { onClose } = setup({ headerActions: <button type="button">Collapse</button> });
    const reachedDocument = vi.fn();
    document.addEventListener('keydown', reachedDocument);
    const collapse = screen.getByRole('button', { name: 'Collapse' });
    collapse.focus();

    fireEvent.keyDown(collapse, { key: 'Delete' });
    document.removeEventListener('keydown', reachedDocument);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(reachedDocument).not.toHaveBeenCalled();
  });

  it('leaves Delete to a focused input inside it', () => {
    const { onClose } = setup({}, <input aria-label="field" />);
    screen.getByRole('textbox', { name: 'field' }).focus();

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'field' }), { key: 'Delete' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('focuses the card when its header is pressed', () => {
    setup({ title: 'Output' });
    const card = screen.getByRole('group', { name: 'Probe' });

    fireEvent.mouseDown(screen.getByText('Output'), { button: 0 });

    expect(card).toHaveFocus();
  });

  it('moves with the arrow keys and resizes with Shift + arrow keys, only while the card itself has focus', () => {
    const onNudge = vi.fn();
    const onResizeBy = vi.fn();
    setup({ onNudge, onResizeBy, headerActions: <button type="button">Collapse</button> });
    const card = screen.getByRole('group', { name: 'Probe' });

    fireEvent.keyDown(screen.getByRole('button', { name: 'Collapse' }), { key: 'ArrowRight' });
    expect(onNudge).not.toHaveBeenCalled();

    fireEvent.keyDown(card, { key: 'ArrowLeft' });
    expect(onNudge).toHaveBeenCalledWith({ x: -10, y: 0 });
    fireEvent.keyDown(card, { key: 'ArrowDown', shiftKey: true });
    expect(onResizeBy).toHaveBeenCalledWith({ x: 0, y: 10 });
  });

  it('describes its keys to a screen reader only when the keyboard can move it', () => {
    const { unmount } = setup();
    expect(screen.getByRole('group', { name: 'Probe' })).not.toHaveAccessibleDescription();
    unmount();

    setup({ onNudge: vi.fn() });
    expect(screen.getByRole('group', { name: 'Probe' })).toHaveAccessibleDescription(
      /Arrow keys move the probe/
    );
  });

  it('keeps a right-click from reaching the canvas', () => {
    setup();
    const reachedDocument = vi.fn();
    document.addEventListener('contextmenu', reachedDocument);

    fireEvent.contextMenu(screen.getByRole('group', { name: 'Probe' }));
    document.removeEventListener('contextmenu', reachedDocument);

    expect(reachedDocument).not.toHaveBeenCalled();
  });

  it('pans the canvas on Shift + wheel over a scrollable body, on platforms where that is horizontal', () => {
    const onCanvasPan = vi.fn();
    setup({ onCanvasPan });
    const body = screen.getByText('Body').parentElement as HTMLElement;
    Object.defineProperty(body, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(body, 'clientHeight', { value: 100, configurable: true });
    const userAgent = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Windows');

    // jsdom's WheelEvent does not carry modifier keys from the init dict.
    const event = new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'shiftKey', { value: true, configurable: true });
    screen.getByText('Body').dispatchEvent(event);
    userAgent.mockRestore();

    // A purely horizontal pan: the whole wheel delta goes sideways and none of it scrolls the body.
    expect(onCanvasPan).toHaveBeenCalledTimes(1);
    const [pan] = onCanvasPan.mock.calls[0];
    expect(pan.x).toBe(-20);
    expect(pan.y === 0).toBe(true);
  });
});
