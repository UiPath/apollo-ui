import { useCallback, type RefObject } from 'react';
import { toggleBold, toggleItalic, toggleStrikethrough } from './markdown-formatting';
import type { TextSelection } from './StickyNoteNode.types';

/**
 * Returns an onKeyDown handler that intercepts formatting keyboard shortcuts
 * (Cmd/Ctrl+B, Cmd/Ctrl+I, Cmd/Ctrl+Shift+X) and applies markdown formatting.
 */
export function useMarkdownShortcuts(
  textAreaRef: RefObject<HTMLTextAreaElement | null>,
  onFormat: (result: TextSelection) => void
) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      const metaOrCtrl = e.metaKey || e.ctrlKey;
      if (!metaOrCtrl) return;

      let formatFn: ((input: TextSelection) => TextSelection) | null = null;

      if (e.key === 'b' && !e.shiftKey) {
        formatFn = toggleBold;
      } else if (e.key === 'i' && !e.shiftKey) {
        formatFn = toggleItalic;
      } else if (e.key === 'x' && e.shiftKey) {
        formatFn = toggleStrikethrough;
      }

      if (formatFn) {
        e.preventDefault();
        const input: TextSelection = {
          value: textarea.value,
          selectionStart: textarea.selectionStart,
          selectionEnd: textarea.selectionEnd,
        };
        onFormat(formatFn(input));
      }
    },
    [textAreaRef, onFormat]
  );
}
