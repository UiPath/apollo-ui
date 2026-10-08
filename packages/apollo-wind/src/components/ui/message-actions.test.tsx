import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Message, MessageContent } from './message';
import {
  DEFAULT_MESSAGE_ACTION_COPY_STRINGS,
  DEFAULT_MESSAGE_ACTION_FEEDBACK_STRINGS,
  DEFAULT_MESSAGE_ACTIONS_STRINGS,
  MessageActionCopy,
  MessageActionFeedback,
  type MessageActionItem,
  MessageActions,
} from './message-actions';

const actionItems = (count: number, onSelect = vi.fn()): MessageActionItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `a${i + 1}`,
    label: `Action ${i + 1}`,
    onSelect,
  }));

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

describe('MessageActions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a toolbar named by its strings', () => {
    const { rerender } = render(<MessageActions />);
    expect(
      screen.getByRole('toolbar', { name: DEFAULT_MESSAGE_ACTIONS_STRINGS.label })
    ).toHaveAttribute('data-slot', 'message-actions');
    rerender(<MessageActions strings={{ label: 'Answer tools' }} />);
    expect(screen.getByRole('toolbar', { name: 'Answer tools' })).toBeInTheDocument();
  });

  it('is visible by default and fades in on hover or focus when visibility is hover', () => {
    const { rerender } = render(<MessageActions data-testid="bar" />);
    expect(screen.getByTestId('bar')).not.toHaveClass('opacity-0');
    rerender(<MessageActions data-testid="bar" visibility="hover" />);
    const bar = screen.getByTestId('bar');
    expect(bar).toHaveAttribute('data-visibility', 'hover');
    expect(bar).toHaveClass(
      'opacity-0',
      'group-hover/message:opacity-100',
      'group-focus-within/message:opacity-100',
      'focus-within:opacity-100',
      '[@media(hover:none)]:opacity-100'
    );
  });

  it('renders every action as a button when maxVisible is not set', () => {
    render(<MessageActions actions={actionItems(4)} />);
    expect(screen.getAllByRole('button', { name: /^Action/ })).toHaveLength(4);
    expect(
      screen.queryByRole('button', { name: DEFAULT_MESSAGE_ACTIONS_STRINGS.more })
    ).not.toBeInTheDocument();
  });

  it('moves actions beyond maxVisible into the overflow menu', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MessageActions actions={actionItems(4, onSelect)} maxVisible={2} />);

    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Action 3' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: DEFAULT_MESSAGE_ACTIONS_STRINGS.more }));
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Action 3', 'Action 4']);

    await user.click(items[1]);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect for a visible action', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MessageActions actions={actionItems(1, onSelect)} />);
    await user.click(screen.getByRole('button', { name: 'Action 1' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('forwards refs and merges className', () => {
    const ref = createRef<HTMLDivElement>();
    render(<MessageActions ref={ref} className="custom" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('custom');
  });

  it('has no accessibility violations', async () => {
    mockClipboard();
    const { container } = render(
      <Message>
        <MessageContent>
          <p>Answer</p>
          <MessageActions actions={actionItems(3)} maxVisible={1}>
            <MessageActionCopy text="Answer" />
            <MessageActionFeedback />
          </MessageActions>
        </MessageContent>
      </Message>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('MessageActionCopy', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the text to the clipboard, shows the copied state, then reverts', async () => {
    vi.useFakeTimers();
    const writeText = mockClipboard();
    const onCopy = vi.fn();
    render(
      <MessageActions>
        <MessageActionCopy text="Hello world" onCopy={onCopy} />
      </MessageActions>
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: DEFAULT_MESSAGE_ACTION_COPY_STRINGS.copy })
      );
    });

    expect(writeText).toHaveBeenCalledWith('Hello world');
    expect(onCopy).toHaveBeenCalledWith('Hello world');
    const button = screen.getByRole('button', { name: DEFAULT_MESSAGE_ACTION_COPY_STRINGS.copied });
    expect(button).toHaveAttribute('data-copied', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(
      DEFAULT_MESSAGE_ACTION_COPY_STRINGS.copied
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(
      screen.getByRole('button', { name: DEFAULT_MESSAGE_ACTION_COPY_STRINGS.copy })
    ).not.toHaveAttribute('data-copied');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('does not claim success when the clipboard write fails', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const onCopy = vi.fn();
    render(
      <MessageActions>
        <MessageActionCopy text="x" onCopy={onCopy} />
      </MessageActions>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(onCopy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Copy' })).not.toHaveAttribute('data-copied');
  });

  it('uses overridden strings', () => {
    mockClipboard();
    render(
      <MessageActions>
        <MessageActionCopy text="x" strings={{ copy: 'Kopieren' }} />
      </MessageActions>
    );
    expect(screen.getByRole('button', { name: 'Kopieren' })).toBeInTheDocument();
  });
});

describe('MessageActionFeedback', () => {
  it('toggles aria-pressed and reports the rating', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MessageActions>
        <MessageActionFeedback onChange={onChange} />
      </MessageActions>
    );
    const up = screen.getByRole('button', {
      name: DEFAULT_MESSAGE_ACTION_FEEDBACK_STRINGS.helpful,
    });
    const down = screen.getByRole('button', {
      name: DEFAULT_MESSAGE_ACTION_FEEDBACK_STRINGS.notHelpful,
    });
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(down).toHaveAttribute('aria-pressed', 'false');

    await user.click(up);
    expect(onChange).toHaveBeenLastCalledWith('up');
    expect(up).toHaveAttribute('aria-pressed', 'true');

    await user.click(down);
    expect(onChange).toHaveBeenLastCalledWith('down');
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(down).toHaveAttribute('aria-pressed', 'true');

    await user.click(down);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(down).toHaveAttribute('aria-pressed', 'false');
  });

  it('follows a controlled value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MessageActions>
        <MessageActionFeedback value="down" onChange={onChange} />
      </MessageActions>
    );
    expect(screen.getByRole('button', { name: 'Not helpful' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await user.click(screen.getByRole('button', { name: 'Helpful' }));
    expect(onChange).toHaveBeenCalledWith('up');
    // Still controlled by the prop, which did not change.
    expect(screen.getByRole('button', { name: 'Helpful' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('groups the thumbs under an accessible name', () => {
    render(
      <MessageActions>
        <MessageActionFeedback />
      </MessageActions>
    );
    expect(
      screen.getByRole('group', { name: DEFAULT_MESSAGE_ACTION_FEEDBACK_STRINGS.label })
    ).toBeInTheDocument();
  });
});
