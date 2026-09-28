import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, userEvent } from '../../utils/testing';
import { ProbeCard, type WatchResult } from './ProbeCard';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const W1: WatchResult = { id: 'w1', expression: 'a.b', value: 1, hasValue: true };
const W2: WatchResult = { id: 'w2', expression: 'c.d', value: 2, hasValue: true };

const noop = () => {};

function setup(props: Partial<React.ComponentProps<typeof ProbeCard>> = {}) {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onAddWatch = vi.fn();
  const onUpdateWatch = vi.fn();
  const onRemoveWatch = vi.fn();

  const utils = render(
    <ProbeCard
      watches={[]}
      onAddWatch={onAddWatch}
      onUpdateWatch={onUpdateWatch}
      onRemoveWatch={onRemoveWatch}
      onDragStart={noop}
      onDrag={noop}
      onDragEnd={noop}
      onResizeStart={noop}
      onResize={noop}
      onResizeEnd={noop}
      onClose={onClose}
      {...props}
    />
  );

  return { user, onClose, onAddWatch, onUpdateWatch, onRemoveWatch, ...utils };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ProbeCard', () => {
  it('renders the card with an accessible group role', () => {
    setup();
    expect(screen.getByRole('group', { name: 'Probe' })).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no watches', () => {
    setup();
    expect(screen.getByText(/no watches/i)).toBeInTheDocument();
  });

  it('renders an input for each watch', () => {
    setup({ watches: [W1, W2] });
    expect(screen.getAllByRole('textbox', { name: 'Watch expression' })).toHaveLength(2);
  });

  it('renders watch expression values in each input', () => {
    setup({ watches: [W1] });
    expect(screen.getByDisplayValue('a.b')).toBeInTheDocument();
  });

  // ── Close button ────────────────────────────────────────────────────────────

  it('calls onClose when the Remove probe button is clicked', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Remove probe' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Keyboard: Escape ────────────────────────────────────────────────────────

  it('calls onClose when Escape is pressed while the card has focus', async () => {
    const { user, onClose } = setup();
    screen.getByRole('group', { name: 'Probe' }).focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed while a watch input has focus', async () => {
    const { user, onClose } = setup({ watches: [W1] });
    screen.getByDisplayValue('a.b').focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Keyboard: Delete / Backspace ────────────────────────────────────────────

  it('calls onClose when Delete is pressed while the card itself has focus', async () => {
    const { user, onClose } = setup();
    screen.getByRole('group', { name: 'Probe' }).focus();
    await user.keyboard('{Delete}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Backspace is pressed while the card itself has focus', async () => {
    const { user, onClose } = setup();
    screen.getByRole('group', { name: 'Probe' }).focus();
    await user.keyboard('{Backspace}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when Delete is pressed while a watch input is active', async () => {
    const { user, onClose } = setup({ watches: [W1] });
    screen.getByDisplayValue('a.b').focus();
    await user.keyboard('{Delete}');
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Keyboard: ArrowUp / ArrowDown navigation ────────────────────────────────

  it('moves focus to the next input on ArrowDown', async () => {
    const { user } = setup({ watches: [W1, W2] });
    const [first, second] = screen.getAllByRole('textbox', { name: 'Watch expression' });
    first.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(second);
  });

  it('moves focus to the previous input on ArrowUp', async () => {
    const { user } = setup({ watches: [W1, W2] });
    const [first, second] = screen.getAllByRole('textbox', { name: 'Watch expression' });
    second.focus();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(first);
  });

  it('does nothing on ArrowDown when already on the last input', async () => {
    const { user } = setup({ watches: [W1] });
    const [input] = screen.getAllByRole('textbox', { name: 'Watch expression' });
    input.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(input);
  });

  // ── Watch list: add ─────────────────────────────────────────────────────────

  it('calls onAddWatch when the Add watch button is clicked', async () => {
    const { user, onAddWatch } = setup();
    await user.click(screen.getByRole('button', { name: 'Add watch' }));
    expect(onAddWatch).toHaveBeenCalledTimes(1);
  });

  it('focuses the last input after a new watch is added', async () => {
    const { user, rerender } = setup({ watches: [W1] });
    await user.click(screen.getByRole('button', { name: 'Add watch' }));
    rerender(
      <ProbeCard
        watches={[W1, W2]}
        onAddWatch={noop}
        onUpdateWatch={noop}
        onRemoveWatch={noop}
        onDragStart={noop}
        onDrag={noop}
        onDragEnd={noop}
        onResizeStart={noop}
        onResize={noop}
        onResizeEnd={noop}
        onClose={noop}
      />
    );
    const inputs = screen.getAllByRole('textbox', { name: 'Watch expression' });
    expect(document.activeElement).toBe(inputs[inputs.length - 1]);
  });

  // ── Watch list: remove ──────────────────────────────────────────────────────

  it('calls onRemoveWatch with the correct id when Remove watch is clicked', async () => {
    const { user, onRemoveWatch } = setup({ watches: [W1] });
    await user.click(screen.getByRole('button', { name: 'Remove watch' }));
    expect(onRemoveWatch).toHaveBeenCalledWith('w1');
  });

  // ── Watch expression update ─────────────────────────────────────────────────

  it('calls onUpdateWatch with the new expression on blur when the value changed', async () => {
    const { user, onUpdateWatch } = setup({ watches: [W1] });
    const input = screen.getByDisplayValue('a.b');
    await user.clear(input);
    await user.type(input, 'x.y');
    await user.tab();
    expect(onUpdateWatch).toHaveBeenCalledWith('w1', 'x.y');
  });

  it('does not call onUpdateWatch on blur when the value is unchanged', async () => {
    const { user, onUpdateWatch } = setup({ watches: [W1] });
    screen.getByDisplayValue('a.b').focus();
    await user.tab();
    expect(onUpdateWatch).not.toHaveBeenCalled();
  });

  // ── Iteration control ───────────────────────────────────────────────────────

  it('renders iteration prev/next buttons when iterationControl is provided', () => {
    setup({
      iterationControl: { current: 1, total: 3, onPrev: noop, onNext: noop },
    });
    expect(screen.getByRole('button', { name: 'Previous iteration' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next iteration' })).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('calls onPrev / onNext when the iteration buttons are clicked', async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { user } = setup({
      iterationControl: { current: 1, total: 3, onPrev, onNext },
    });
    await user.click(screen.getByRole('button', { name: 'Previous iteration' }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Next iteration' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('disables Previous iteration when current is 0', () => {
    setup({ iterationControl: { current: 0, total: 3, onPrev: noop, onNext: noop } });
    expect(screen.getByRole('button', { name: 'Previous iteration' })).toBeDisabled();
  });

  it('disables Next iteration when current is at the last index', () => {
    setup({ iterationControl: { current: 2, total: 3, onPrev: noop, onNext: noop } });
    expect(screen.getByRole('button', { name: 'Next iteration' })).toBeDisabled();
  });

  // ── Wheel forwarding ────────────────────────────────────────────────────────

  it('calls onCanvasZoom on ctrl+wheel', () => {
    const onCanvasZoom = vi.fn();
    setup({ onCanvasZoom });
    const card = screen.getByRole('group', { name: 'Probe' });
    // jsdom's WheelEvent constructor does not propagate modifier keys from the
    // init dict, so we override ctrlKey via defineProperty after construction.
    const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'ctrlKey', { value: true, configurable: true });
    card.dispatchEvent(event);
    expect(onCanvasZoom).toHaveBeenCalledWith(
      expect.objectContaining({ ctrlKey: true, deltaY: -100 })
    );
  });

  it('calls onCanvasPan on plain scroll (non-ctrl)', () => {
    const onCanvasPan = vi.fn();
    setup({ onCanvasPan });
    const card = screen.getByRole('group', { name: 'Probe' });
    fireEvent.wheel(card, { deltaY: 50 });
    expect(onCanvasPan).toHaveBeenCalledWith(expect.objectContaining({ y: expect.any(Number) }));
  });
});
