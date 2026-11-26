import { type KeyboardEvent, useCallback } from 'react';

/**
 * Keys for a label edited over several lines: plain Enter commits, as in a single-line label,
 * and Shift or Alt with it adds a line. Off, every key goes to `handleKeyDown`.
 */
export function useMultilineKeyDown(
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void,
  setLocalLabel: (value: string) => void,
  multiline = true
) {
  return useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!multiline || event.key !== 'Enter' || !(event.shiftKey || event.altKey)) {
        handleKeyDown(event);
        return;
      }
      // Kept from the canvas. A textarea adds the line for Shift+Enter but not for Alt+Enter.
      event.stopPropagation();
      if (event.shiftKey) return;
      event.preventDefault();
      const textarea = event.currentTarget;
      textarea.setRangeText('\n', textarea.selectionStart, textarea.selectionEnd, 'end');
      setLocalLabel(textarea.value);
    },
    [multiline, handleKeyDown, setLocalLabel]
  );
}
