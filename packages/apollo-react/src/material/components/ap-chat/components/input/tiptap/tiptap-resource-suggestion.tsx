import type { Editor, Range } from '@tiptap/core';
import type { MentionOptions } from '@tiptap/extension-mention';

export interface CursorCoordinates {
  top: number;
  left: number;
}

interface ResourceSuggestionCallbacks {
  onStart?: (range: Range, coords: CursorCoordinates) => void;
  onExit?: () => void;
  onQueryChange?: (query: string, range: Range) => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
}

function getCursorCoordinates(editor: Editor, pos: number): CursorCoordinates {
  const coords = editor.view.coordsAtPos(pos);
  return {
    top: coords.top,
    left: coords.left,
  };
}

export function createResourceSuggestion(
  callbacks: ResourceSuggestionCallbacks
): MentionOptions['suggestion'] {
  let isActive = false;

  return {
    items: () => [],
    render: () => ({
      onStart: (props) => {
        isActive = true;
        const coords = getCursorCoordinates(props.editor, props.range.from);
        callbacks.onStart?.(props.range, coords);
        callbacks.onQueryChange?.(props.query, props.range);
      },

      onUpdate: (props) => {
        callbacks.onQueryChange?.(props.query, props.range);
      },

      onKeyDown: (props) => {
        if (!isActive) {
          return false;
        }
        return callbacks.onKeyDown?.(props.event) ?? false;
      },

      onExit: () => {
        isActive = false;
        callbacks.onExit?.();
      },
    }),
  };
}
