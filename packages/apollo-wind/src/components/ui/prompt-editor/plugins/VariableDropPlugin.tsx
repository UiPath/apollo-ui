import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createRangeSelection,
  $getNearestNodeFromDOMNode,
  $getRoot,
  $isDecoratorNode,
  $isParagraphNode,
  $isTextNode,
  $setSelection,
  type LexicalEditor,
} from 'lexical';
import { useEffect, useRef } from 'react';
import type { PromptEditorAutoCompleteOption } from '../types';
import { $insertTokenAtCursor } from '../utils';

/**
 * dataTransfer MIME a drag source must set to the variable path string (e.g. `vars.firstName`) for
 * the editor to treat a drop as a variable insertion. Only this MIME is handled — plain text drops
 * (e.g. dragging selected text) fall through to the browser's native behaviour untouched.
 */
export const VARIABLE_DRAG_MIME = 'application/x-apollo-prompt-variable';

export interface VariableDropPluginProps {
  disabled?: boolean;
  /** Map a dropped variable path to the token option to insert at the drop point. */
  mapVarDropToToken: (insertPath: string) => PromptEditorAutoCompleteOption;
}

type CursorPosition = { key: string; offset: number; type: 'text' | 'element' };

/** Resolve the caret under a screen point. `caretPositionFromPoint` is undefined in Safari → range fallback. */
const getCaretFromPoint = (x: number, y: number): { offsetNode: Node; offset: number } | null => {
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    return pos ? { offsetNode: pos.offsetNode, offset: pos.offset } : null;
  }
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { offsetNode: range.startContainer, offset: range.startOffset } : null;
};

/**
 * Map a DOM caret hit to a Lexical insertion point. For a token pill (decorator) we drop before or
 * after it depending on which half of the pill the pointer is over; for text/paragraph we use the
 * DOM offset directly. Ported from flow-workbench's VariableDropPlugin caret resolution.
 */
const $resolveDropPosition = (
  editor: LexicalEditor,
  offsetNode: Node,
  domOffset: number,
  clientX: number
): CursorPosition | null => {
  const node = $getNearestNodeFromDOMNode(offsetNode);
  if (!node) return null;

  if ($isDecoratorNode(node)) {
    const el = editor.getElementByKey(node.getKey());
    const rect = el?.getBoundingClientRect();
    const isAfter = rect ? clientX > rect.left + rect.width / 2 : true;
    const parent = node.getParent();
    if (!parent) return null;
    return {
      key: parent.getKey(),
      offset: node.getIndexWithinParent() + (isAfter ? 1 : 0),
      type: 'element',
    };
  }
  if ($isTextNode(node)) return { key: node.getKey(), offset: domOffset, type: 'text' };
  if ($isParagraphNode(node)) return { key: node.getKey(), offset: domOffset, type: 'element' };
  return null;
};

/**
 * Inserts a variable token when a drag source drops a variable path onto the editor. Native HTML5
 * drag-drop (no dnd-kit dependency): a consumer's drag source sets the dropped path on
 * `dataTransfer` (see {@link VARIABLE_DRAG_MIME}); on drop we resolve the caret at the drop point,
 * map the path to a token via `mapVarDropToToken`, and insert it there.
 */
export function VariableDropPlugin({ disabled, mapVarDropToToken }: VariableDropPluginProps) {
  const [editor] = useLexicalComposerContext();
  const mapRef = useRef(mapVarDropToToken);
  useEffect(() => {
    mapRef.current = mapVarDropToToken;
  });

  useEffect(() => {
    if (disabled) return;

    // Only react to our own variable payload. We can't read dataTransfer *contents* during dragover
    // (browsers expose only `types` there), so gate on the MIME alone — never `text/plain`, so a
    // normal text drag isn't hijacked and treated as a variable path.
    const hasVariablePayload = (dt: DataTransfer | null): boolean =>
      !!dt && dt.types.includes(VARIABLE_DRAG_MIME);

    const onDragOver = (e: DragEvent) => {
      if (!hasVariablePayload(e.dataTransfer)) return;
      // Allow the drop and show a copy cursor.
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDrop = (e: DragEvent) => {
      const path = e.dataTransfer?.getData(VARIABLE_DRAG_MIME);
      if (!path) return;
      e.preventDefault();

      const root = editor.getRootElement();
      const caret = getCaretFromPoint(e.clientX, e.clientY);
      editor.update(() => {
        let placed = false;
        if (caret && root?.contains(caret.offsetNode)) {
          const resolved = $resolveDropPosition(editor, caret.offsetNode, caret.offset, e.clientX);
          if (resolved) {
            const sel = $createRangeSelection();
            sel.anchor.set(resolved.key, resolved.offset, resolved.type);
            sel.focus.set(resolved.key, resolved.offset, resolved.type);
            $setSelection(sel);
            placed = true;
          }
        }
        // If the drop point can't be resolved to a caret (e.g. dropped on empty space), insert at the
        // end of the document rather than at whatever stale selection Lexical happened to be holding.
        if (!placed) $getRoot().selectEnd();
        $insertTokenAtCursor(mapRef.current(path));
      });
      editor.focus();
    };

    // registerRootListener fires immediately with the current root and again whenever it changes,
    // and once with (null, prevRoot) on teardown — so listeners always track the live root element.
    return editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement) {
        prevRootElement.removeEventListener('dragover', onDragOver);
        prevRootElement.removeEventListener('drop', onDrop);
      }
      if (rootElement) {
        rootElement.addEventListener('dragover', onDragOver);
        rootElement.addEventListener('drop', onDrop);
      }
    });
  }, [editor, disabled]);

  return null;
}
