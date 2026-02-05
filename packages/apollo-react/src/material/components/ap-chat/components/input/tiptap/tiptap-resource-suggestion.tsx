import type { Editor, Range } from '@tiptap/core';
import type { MentionOptions } from '@tiptap/extension-mention';
import { PluginKey } from '@tiptap/pm/state';
import { CHAT_RESOURCE_MENTION_TERMINATOR } from '../../../service';
import { getFullMentionQuery } from './tiptap.utils';

export const ResourceMentionPluginKey = new PluginKey('resourceMention');

// Allowed first characters after @ -> letters, digits, underscore, dot, slashes
const RESOURCE_QUERY_START_PATTERN = /^[a-zA-Z0-9_./\\]/;

export interface CursorCoordinates {
  top: number;
  left: number;
}

interface ResourceSuggestionCallbacks {
  onStart?: (range: Range, coords: CursorCoordinates) => void;
  onExit?: () => void;
  onQueryChange?: (query: string, range: Range) => void;
}

function getCursorCoordinates(editor: Editor, pos: number): CursorCoordinates {
  const coords = editor.view.coordsAtPos(pos);
  return {
    top: coords.top,
    left: coords.left,
  };
}

export function createResourceSuggestion(
  callbacks: ResourceSuggestionCallbacks,
  suppressRef: { current: boolean }
): MentionOptions['suggestion'] {
  return {
    pluginKey: ResourceMentionPluginKey,
    allowSpaces: true,
    allow: ({ state, range }) => {
      if (suppressRef.current) {
        return false;
      }

      const textFrom = range.from + 1;
      const textTo = range.to;
      const query = textFrom < textTo ? state.doc.textBetween(textFrom, textTo) : '';

      if (query.length > 0 && !RESOURCE_QUERY_START_PATTERN.test(query.charAt(0))) {
        return false;
      }

      if (query.includes(CHAT_RESOURCE_MENTION_TERMINATOR)) {
        return false;
      }
      return true;
    },
    render: () => ({
      onStart: (props) => {
        const coords = getCursorCoordinates(props.editor, props.range.from);
        const { query, fullRange } = getFullMentionQuery(props.editor, props.range);
        callbacks.onStart?.(fullRange, coords);
        callbacks.onQueryChange?.(query, fullRange);
      },

      onUpdate: (props) => {
        const { query, fullRange } = getFullMentionQuery(props.editor, props.range);
        callbacks.onQueryChange?.(query, fullRange);
      },

      onExit: () => {
        callbacks.onExit?.();
      },
    }),
  };
}
