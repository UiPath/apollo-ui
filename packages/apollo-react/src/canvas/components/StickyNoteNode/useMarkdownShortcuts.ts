import { useCallback, type RefObject } from 'react';
import { toggleBold, toggleItalic, toggleStrikethrough } from './markdown-formatting';
import type { TextSelection } from './StickyNoteNode.types';

/**
 * Returns an onKeyDown handler that intercepts formatting keyboard shortcuts
 * (Cmd/Ctrl+B, Cmd/Ctrl+I, Cmd/Ctrl+Shift+X) and applies markdown formatting.
 *
 * Handled shortcuts stop propagating: a host that binds the same chord (a
 * VS Code webview toggling its sidebar on Cmd+B, for instance) would otherwise
 * act on the keystroke the editor just consumed.
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

      // Lowercased: with Shift held the browser reports an uppercase `key`, so a
      // literal 'x' comparison never matches the strikethrough chord.
      const key = e.key.toLowerCase();

      if (key === 'b' && !e.shiftKey) {
        formatFn = toggleBold;
      } else if (key === 'i' && !e.shiftKey) {
        formatFn = toggleItalic;
      } else if (key === 'x' && e.shiftKey) {
        formatFn = toggleStrikethrough;
      }

      if (formatFn) {
        e.preventDefault();
        e.stopPropagation();
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
