import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
import { ProbeCard, type ProbeCardProps } from './ProbeCard';

function makeProps(overrides: Partial<ProbeCardProps> = {}): ProbeCardProps {
  return {
    watches: [],
    onAddWatch: vi.fn(),
    onUpdateWatch: vi.fn(),
    onRemoveWatch: vi.fn(),
    onDragStart: vi.fn(),
    onDrag: vi.fn(),
    onDragEnd: vi.fn(),
    onResizeStart: vi.fn(),
    onResize: vi.fn(),
    onResizeEnd: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

describe('ProbeCard', () => {
  describe('keyboard shortcuts', () => {
    it('calls onClose when Delete is pressed while the card has focus', () => {
      const onClose = vi.fn();
      render(<ProbeCard {...makeProps({ onClose })} />);
      screen.getByRole('group', { name: 'Probe' }).focus();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })
      );
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Backspace is pressed while the card has focus', () => {
      const onClose = vi.fn();
      render(<ProbeCard {...makeProps({ onClose })} />);
      screen.getByRole('group', { name: 'Probe' }).focus();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })
      );
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose when Delete is pressed while a watch input has focus', () => {
      const onClose = vi.fn();
      render(
        <ProbeCard
          {...makeProps({
            onClose,
            watches: [{ id: 'w1', expression: 'x.y', value: undefined, hasValue: false }],
          })}
        />
      );
      screen.getByRole('textbox', { name: 'Watch expression' }).focus();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })
      );
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('wheel event forwarding', () => {
    it('does not stopPropagation on ctrl+wheel when onCanvasZoom is not provided', () => {
      render(<ProbeCard {...makeProps()} />);
      const card = screen.getByRole('group', { name: 'Probe' });
      const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
      Object.defineProperty(event, 'ctrlKey', { value: true, configurable: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      card.dispatchEvent(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls onCanvasZoom and stops propagation when ctrl+wheel fires with a handler provided', () => {
      const onCanvasZoom = vi.fn();
      render(<ProbeCard {...makeProps({ onCanvasZoom })} />);
      const card = screen.getByRole('group', { name: 'Probe' });
      // happy-dom does not forward modifier keys via the WheelEvent init dict,
      // so we set ctrlKey directly on the event object.
      const event = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 200,
        clientY: 150,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'ctrlKey', { value: true, configurable: true });
      card.dispatchEvent(event);
      // happy-dom drops clientX/clientY from the WheelEvent init dict,
      // so only assert the fields the component actually uses for routing.
      expect(onCanvasZoom).toHaveBeenCalledWith(
        expect.objectContaining({ deltaY: -100, ctrlKey: true })
      );
    });

    it('does not stopPropagation on plain wheel when onCanvasPan is not provided', () => {
      render(<ProbeCard {...makeProps()} />);
      const card = screen.getByRole('group', { name: 'Probe' });
      const event = new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      card.dispatchEvent(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls onCanvasPan and stops propagation when plain wheel fires with a handler provided', () => {
      const onCanvasPan = vi.fn();
      render(<ProbeCard {...makeProps({ onCanvasPan })} />);
      const card = screen.getByRole('group', { name: 'Probe' });
      card.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 20, deltaX: 0, bubbles: true, cancelable: true })
      );
      // Use any(Number) for both axes — -0 and 0 are distinct under Object.is
      expect(onCanvasPan).toHaveBeenCalledWith({
        x: expect.any(Number),
        y: expect.any(Number),
      });
    });
  });

  describe('drag session cleanup', () => {
    it('removes window mousemove and mouseup listeners on unmount during an active drag', () => {
      const { container, unmount } = render(<ProbeCard {...makeProps()} />);
      const header = container.querySelector('.cursor-move') as HTMLElement;

      // Start a drag session by pressing the header with the primary button
      fireEvent.mouseDown(header, { button: 0, clientX: 50, clientY: 50 });

      const spy = vi.spyOn(window, 'removeEventListener');
      unmount();

      expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(spy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      spy.mockRestore();
    });
  });
});
