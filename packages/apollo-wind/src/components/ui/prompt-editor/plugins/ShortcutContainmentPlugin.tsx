import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_NORMAL,
  isExactShortcutMatch,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { useEffect } from 'react';

/** Keys of the formatting chords Lexical's default keydown handler consumes. */
const FORMATTING_KEYS = ['b', 'i', 'u'];

/**
 * Mirrors Lexical's own (unexported) `CONTROL_OR_META` mask, so we swallow exactly the
 * chords it formats with and nothing else: Cmd on Apple, Ctrl elsewhere, no other modifier.
 * Omitted modifiers are required to be unpressed.
 */
const IS_APPLE =
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const CONTROL_OR_META = { ctrlKey: !IS_APPLE, metaKey: IS_APPLE };

/**
 * Keeps the formatting chords the editor consumes from reaching the host.
 *
 * Lexical's `$handleKeyDown` calls `preventDefault()` on Cmd/Ctrl+B / +I / +U and
 * dispatches `FORMAT_TEXT_COMMAND`, but lets the event keep bubbling. A host that binds
 * the same chord then acts on a keystroke the editor already ate: in a VS Code webview,
 * bolding prompt-editor text also toggles the left sidebar, because VS Code forwards
 * document-level keydown to its keybinding layer without consulting `defaultPrevented`.
 *
 * Only the chords we actually consume are swallowed. Cmd+A, Cmd+S, Cmd+V and friends
 * still reach the host untouched.
 *
 * Registered at `COMMAND_PRIORITY_NORMAL`, above the `COMMAND_PRIORITY_EDITOR` slot
 * Lexical's own handler occupies, and returns `false` so that handler still formats.
 */
export const registerShortcutContainment = (editor: LexicalEditor): (() => void) =>
  editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event: KeyboardEvent) => {
      if (FORMATTING_KEYS.some((key) => isExactShortcutMatch(event, key, CONTROL_OR_META))) {
        event.stopPropagation();
      }
      return false;
    },
    COMMAND_PRIORITY_NORMAL
  );

/** Rich-mode only: the plain editor applies none of these formats, so its chords belong to the host. */
export const ShortcutContainmentPlugin = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerShortcutContainment(editor), [editor]);
  return null;
};
