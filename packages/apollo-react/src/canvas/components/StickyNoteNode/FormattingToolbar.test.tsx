import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormattingToolbar } from './FormattingToolbar';
import type { ActiveFormats } from './markdown-formatting';

const defaultFormats: ActiveFormats = {
  bold: false,
  italic: false,
  strikethrough: false,
  bulletList: false,
  numberedList: false,
};

function createMockTextArea(value = '', selectionStart = 0, selectionEnd = 0) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.selectionStart = selectionStart;
  textarea.selectionEnd = selectionEnd;
  document.body.appendChild(textarea);
  textarea.focus();
  return { current: textarea };
}

describe('FormattingToolbar', () => {
  it('calls onFormat when a button is clicked', () => {
    const onFormat = vi.fn();
    const ref = createMockTextArea('hello world', 6, 11);

    render(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={onFormat}
      />
    );

    // Click the first button (bold)
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(onFormat).toHaveBeenCalledWith(expect.objectContaining({ value: 'hello **world**' }));

    ref.current.remove();
  });

  it('does not call onFormat when textAreaRef is null', () => {
    const onFormat = vi.fn();
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;

    render(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={onFormat}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(onFormat).not.toHaveBeenCalled();
  });

  it('prevents textarea blur on mousedown', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement | null>;
    const { container } = render(
      <FormattingToolbar
        textAreaRef={ref}
        borderColor="#42A1FF"
        activeFormats={defaultFormats}
        onFormat={vi.fn()}
      />
    );

    const toolbarContainer = container.firstChild as HTMLElement;
    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const prevented = !toolbarContainer.dispatchEvent(mouseDownEvent);
    expect(prevented).toBe(true);
  });
});
