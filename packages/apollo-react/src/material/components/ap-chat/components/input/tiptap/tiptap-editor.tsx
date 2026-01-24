import type { Range } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Placeholder, UndoRedo } from '@tiptap/extensions';
import { Fragment, Node, Slice } from '@tiptap/pm/model';
import { EditorContent, useEditor } from '@tiptap/react';
import React, { forwardRef, useCallback } from 'react';
import { textToDocument } from './tiptap.utils';
import { EditorContainer } from './tiptap-editor.styles';
import { type CursorCoordinates, createResourceSuggestion } from './tiptap-resource-suggestion';

export interface TipTapResourceItem {
  id: string;
  type: string;
  displayName: string;
  icon: string;
}

export interface TipTapEditorHandle {
  focus: () => void;
  insertResource: (resource: TipTapResourceItem, range?: Range) => void;
  getSerializedContent: () => string;
  clear: () => void;
}

interface TipTapEditorCallbacks {
  onChange?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
  onMentionStart?: (range: Range, coords: CursorCoordinates) => void;
  onMentionEnd?: () => void;
  onMentionQueryChange?: (query: string, range: Range) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface TipTapEditorProps extends TipTapEditorCallbacks {
  value?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  lineHeight?: string;
  disabled?: boolean;
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
    onFocus,
    onBlur,
  } = props;

  const callbacksRef = React.useRef<TipTapEditorCallbacks>({
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    onMentionStart,
    onMentionEnd,
    onMentionQueryChange,
  });

  React.useLayoutEffect(() => {
    callbacksRef.current = {
      onChange,
      onKeyDown,
      onFocus,
      onBlur,
      onMentionStart,
      onMentionEnd,
      onMentionQueryChange,
    };
  }, [onChange, onKeyDown, onFocus, onBlur, onMentionStart, onMentionEnd, onMentionQueryChange]);

  const resourceSuggestion = React.useMemo(
    () =>
      createResourceSuggestion({
        onStart: (range, coords) => callbacksRef.current.onMentionStart?.(range, coords),
        onExit: () => callbacksRef.current.onMentionEnd?.(),
        onQueryChange: (query, range) => callbacksRef.current.onMentionQueryChange?.(query, range),
      }),
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
      Mention.configure({
        HTMLAttributes: { class: 'resource-mention' },
        suggestion: resourceSuggestion,
        renderText: ({ node }) => node.attrs.label ?? node.attrs.id,
        renderHTML({ node }) {
          const { id, label, type, icon = 'description' } = node.attrs;

          return [
            'span',
            {
              class: 'resource-mention',
              'data-type': 'mention',
              'data-id': id,
              'data-resource-type': type,
              'data-label': label,
              'data-icon': icon,
            },
            ['span', { class: 'resource-chip-icon' }, icon],
            ['span', {}, label],
          ];
        },
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
    onFocus: () => callbacksRef.current.onFocus?.(),
    onBlur: () => callbacksRef.current.onBlur?.(),
    editorProps: {
      handleKeyDown: (_view, event) => {
        return callbacksRef.current.onKeyDown?.(event) ?? false;
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
    (resource: TipTapResourceItem, range?: Range) => {
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
          text: '\u00A0',
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
            return `[[resource-token:${JSON.stringify({ id, type, icon, displayName: label })}]]`;
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

  React.useImperativeHandle(ref, () => ({ focus, insertResource, getSerializedContent, clear }), [
    focus,
    insertResource,
    getSerializedContent,
    clear,
  ]);

  return (
    <EditorContainer minRows={minRows} maxRows={maxRows} lineHeight={lineHeight} onClick={focus}>
      <EditorContent editor={editor} />
    </EditorContainer>
  );
}

export const TipTapEditor = React.memo(forwardRef(TipTapEditorInner));
TipTapEditor.displayName = 'TipTapEditor';
