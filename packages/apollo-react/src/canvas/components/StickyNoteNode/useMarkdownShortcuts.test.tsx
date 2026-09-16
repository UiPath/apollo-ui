import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TextSelection } from './StickyNoteNode.types';
import { useMarkdownShortcuts } from './useMarkdownShortcuts';

function Harness({ onFormat }: { onFormat: (result: TextSelection) => void }) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const onKeyDown = useMarkdownShortcuts(textAreaRef, onFormat);
  return <textarea ref={textAreaRef} aria-label="note" defaultValue="text" onKeyDown={onKeyDown} />;
}

function renderHarness() {
  const onFormat = vi.fn();
  const hostKeyDown = vi.fn();
  render(
    <div onKeyDown={hostKeyDown}>
      <Harness onFormat={onFormat} />
    </div>
  );
  return { onFormat, hostKeyDown, textarea: screen.getByLabelText('note') };
}

describe('useMarkdownShortcuts', () => {
  it('formats and swallows a handled shortcut so the host never sees it', () => {
    const { onFormat, hostKeyDown, textarea } = renderHarness();

    fireEvent.keyDown(textarea, { key: 'b', metaKey: true });

    expect(onFormat).toHaveBeenCalledTimes(1);
    expect(hostKeyDown).not.toHaveBeenCalled();
  });

  it('matches the strikethrough chord despite the uppercase key Shift reports', () => {
    const { onFormat, hostKeyDown, textarea } = renderHarness();

    // A real browser reports 'X', not 'x', while Shift is held.
    fireEvent.keyDown(textarea, { key: 'X', metaKey: true, shiftKey: true });

    expect(onFormat).toHaveBeenCalledTimes(1);
    expect(hostKeyDown).not.toHaveBeenCalled();
  });

  it('lets unhandled shortcuts reach the host', () => {
    const { onFormat, hostKeyDown, textarea } = renderHarness();

    fireEvent.keyDown(textarea, { key: 'a', metaKey: true });

    expect(onFormat).not.toHaveBeenCalled();
    expect(hostKeyDown).toHaveBeenCalledTimes(1);
  });
});
