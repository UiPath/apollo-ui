import type { Range } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Placeholder, UndoRedo } from '@tiptap/extensions';
import { Fragment, Node, Slice } from '@tiptap/pm/model';
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import { exitSuggestion } from '@tiptap/suggestion';
import React, { forwardRef, useCallback } from 'react';
import { type AutopilotChatResourceItem } from './../../../service';
import { ResourceChipNodeView } from './resource-chip-node-view';
import { textToDocument } from './tiptap.utils';
import { EditorContainer } from './tiptap-editor.styles';
import {
  type CursorCoordinates,
  createResourceSuggestion,
  ResourceMentionPluginKey,
} from './tiptap-resource-suggestion';

/**
 * Extended Mention extension with custom resource attributes.
 * Adds `type` and `icon` to the default `id` and `label` attributes.
 * Uses ReactNodeViewRenderer for interactive chip with tooltip and delete.
 */
const ResourceMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      type: {
        parseHTML: (element) => element.getAttribute('data-resource-type'),
        renderHTML: (attributes) =>
          attributes.type ? { 'data-resource-type': attributes.type } : {},
      },
      icon: {
        parseHTML: (element) => element.getAttribute('data-icon'),
        renderHTML: (attributes) => (attributes.icon ? { 'data-icon': attributes.icon } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResourceChipNodeView);
  },
});

export interface TipTapEditorHandle {
  focus: () => void;
  insertResource: (resource: AutopilotChatResourceItem, range?: Range) => void;
  getSerializedContent: () => string;
  clear: () => void;
  clearMentionQuery: () => void;
  triggerMention: () => void;
  exitMention: () => void;
}

interface TipTapEditorCallbacks {
  onChange?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
  onMentionStart?: (range: Range, coords: CursorCoordinates) => void;
  onMentionEnd?: () => void;
  onMentionQueryChange?: (query: string, range: Range) => void;
}

interface TipTapEditorProps extends TipTapEditorCallbacks {
  value?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  lineHeight?: string;
}

function TipTapEditorInner(
  props: TipTapEditorProps,
  ref: React.ForwardedRef<TipTapEditorHandle>
): React.ReactElement {
  const {
    value = '',
    placeholder = '',
    minRows = 1,
    maxRows = 6,
    lineHeight = '20px',
    onChange,
    onKeyDown,
    onMentionStart,
    onMentionEnd,
    onMentionQueryChange,
  } = props;

  const callbacksRef = React.useRef<TipTapEditorCallbacks>({
    onChange,
    onKeyDown,
    onMentionStart,
    onMentionEnd,
    onMentionQueryChange,
  });

  const mentionRangeRef = React.useRef<Range | null>(null);
  const suppressSuggestionRef = React.useRef(false);

  React.useLayoutEffect(() => {
    callbacksRef.current = {
      onChange,
      onKeyDown,
      onMentionStart,
      onMentionEnd,
      onMentionQueryChange,
    };
  }, [onChange, onKeyDown, onMentionStart, onMentionEnd, onMentionQueryChange]);

  const resourceSuggestion = React.useMemo(
    () =>
      createResourceSuggestion(
        {
          onStart: (range, coords) => {
            mentionRangeRef.current = range;
            callbacksRef.current.onMentionStart?.(range, coords);
          },
          onExit: () => {
            mentionRangeRef.current = null;
            callbacksRef.current.onMentionEnd?.();
          },
          onQueryChange: (query, range) => {
            mentionRangeRef.current = range;
            callbacksRef.current.onMentionQueryChange?.(query, range);
          },
        },
        suppressSuggestionRef
      ),
    []
  );

  const extensions = React.useMemo(
    () => [
      Document,
      Paragraph,
      Text,
      UndoRedo,
      HardBreak.configure({ keepMarks: false }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      ResourceMention.configure({
        deleteTriggerWithBackspace: true,
        suggestion: resourceSuggestion,
        renderText: ({ node }) => node.attrs.label ?? node.attrs.id,
      }),
    ],
    [placeholder, resourceSuggestion]
  );

  const editor = useEditor({
    extensions,
    coreExtensionOptions: {
      clipboardTextSerializer: {
        blockSeparator: '\n',
      },
    },
    content: value ? textToDocument(value) : '',
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText();
      // Clear editor if content is whitespace-only
      if (text.trim().length === 0) {
        ed.commands.clearContent();
      }
      callbacksRef.current.onChange?.(ed.getText());
      ed.commands.scrollIntoView();
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        return callbacksRef.current.onKeyDown?.(event) ?? false;
      },
      handleDOMEvents: {
        mousedown: () => {
          suppressSuggestionRef.current = false;
          return false;
        },
        keydown: () => {
          suppressSuggestionRef.current = false;
          return false;
        },
      },
      attributes: { 'data-testid': 'tiptap-editor' },
      clipboardTextParser: (text, context) => {
        const doc = textToDocument(text);
        const nodes: Node[] = doc.content.map((para) =>
          Node.fromJSON(context.doc.type.schema, para)
        );
        const fragment = Fragment.fromArray(nodes);
        return Slice.maxOpen(fragment);
      },
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const currentText = editor.getText();

    // Skip if content already matches (prevents unnecessary updates)
    if (currentText === value) {
      return;
    }

    // Set content using safe JSON structure
    // emitUpdate: false prevents triggering onChange -> infinite loop
    editor.commands.setContent(value ? textToDocument(value) : '', { emitUpdate: false });
  }, [value, editor]);

  const insertResource = useCallback(
    (resource: AutopilotChatResourceItem, range?: Range) => {
      if (!editor) {
        return;
      }

      const chain = editor.chain().focus();

      if (range) {
        chain.deleteRange(range);
      }

      chain
        .insertContent({
          type: 'mention',
          attrs: {
            id: resource.id,
            label: resource.displayName,
            type: resource.type,
            icon: resource.icon,
          },
        })
        .insertContent({
          type: 'text',
          text: ' ',
        })
        .run();
    },
    [editor]
  );

  const getSerializedContent = useCallback(() => {
    if (!editor) {
      return '';
    }

    try {
      return editor.getText({
        blockSeparator: '\n',
        textSerializers: {
          mention: ({ node }) => {
            const { id, label, type, icon } = node.attrs;
            return `[[resource-token:${JSON.stringify({ id, type, displayName: label, ...(icon && { icon }) })}]]`;
          },
          hardBreak: () => '\n',
        },
      });
    } catch {
      return editor.getText() || '';
    }
  }, [editor]);

  const focus = useCallback(() => {
    editor?.commands.focus();
  }, [editor]);

  const clear = useCallback(() => {
    editor?.commands.clearContent();
  }, [editor]);

  const clearMentionQuery = useCallback(() => {
    if (!editor || !mentionRangeRef.current) {
      return;
    }
    const range = mentionRangeRef.current;
    const queryStart = range.from + 1;
    if (queryStart < range.to) {
      editor.chain().focus().deleteRange({ from: queryStart, to: range.to }).run();
      mentionRangeRef.current = { from: range.from, to: queryStart };
    }
  }, [editor]);

  const triggerMention = useCallback(() => {
    if (!editor) {
      return;
    }
    suppressSuggestionRef.current = false;
    editor.chain().focus().insertContent('@').run();
  }, [editor]);

  const exitMention = useCallback(() => {
    if (!editor) return;
    suppressSuggestionRef.current = true;
    exitSuggestion(editor.view, ResourceMentionPluginKey);
  }, [editor]);

  React.useImperativeHandle(
    ref,
    () => ({
      focus,
      insertResource,
      getSerializedContent,
      clear,
      clearMentionQuery,
      triggerMention,
      exitMention,
    }),
    [
      focus,
      insertResource,
      getSerializedContent,
      clear,
      clearMentionQuery,
      triggerMention,
      exitMention,
    ]
  );

  return (
    <EditorContainer minRows={minRows} maxRows={maxRows} lineHeight={lineHeight} onClick={focus}>
      <EditorContent editor={editor} />
    </EditorContainer>
  );
}

export const TipTapEditor = React.memo(forwardRef(TipTapEditorInner));
TipTapEditor.displayName = 'TipTapEditor';
