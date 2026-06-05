import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { msg } from '@lingui/core/macro';
import { CircularProgress, FormHelperText } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import { $getRoot, $insertNodes, type EditorState, type LexicalEditor } from 'lexical';
import type React from 'react';
import { useCallback, useMemo } from 'react';

import { useSafeLingui } from '../../../i18n/useSafeLingui';
import { ApTypography } from '../ap-typography';
import './ApRichTextEditor.css';
import type { ApRichTextEditorProps, RichTextEditorInputFormat } from './ApRichTextEditor.types';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import { RTE_TRANSFORMERS } from './plugins/MarkdownTransformers';
import ToolbarPlugin from './plugins/ToolbarPlugin';

// Error message component (mirrors the pattern used by ApTextField).
const ErrorMessage: React.FC<{ id?: string; message: string }> = ({ id, message }) => (
  <ApTypography
    id={id}
    variant={FontVariantToken.fontSizeS}
    style={{ color: 'var(--color-error-text)' }}
  >
    {message}
  </ApTypography>
);

const EditorTheme = {
  code: 'editor-code',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  image: 'editor-image',
  link: 'editor-link',
  list: {
    listitem: 'editor-listitem',
    nested: { listitem: 'editor-nested-listitem' },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
  },
  ltr: 'ltr',
  paragraph: 'editor-paragraph',
  placeholder: 'editor-placeholder',
  quote: 'editor-quote',
  rtl: 'rtl',
  table: 'editor-table',
  tableCell: 'editor-table-cell',
  tableCellEditing: 'editor-table-cell-editing',
  tableCellHeader: 'editor-table-cell-header',
  tableCellPrimarySelected: 'editor-table-cell-primary-selected',
  tableCellSelected: 'editor-table-cell-selected',
  tableSelected: 'editor-table-selected',
  tableSelection: 'editor-table-selection',
  text: {
    bold: 'editor-text-bold',
    code: 'editor-text-code',
    hashtag: 'editor-text-hashtag',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    strikethrough: 'editor-text-strikethrough',
    underline: 'editor-text-underline',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
  },
};

/**
 * ApRichTextEditor is a Lexical-based rich text editor with Apollo design system styling.
 * It supports markdown and HTML input/output, a formatting toolbar, lists, links, inline
 * code with syntax highlighting, and markdown tables.
 */
export const ApRichTextEditor: React.FC<ApRichTextEditorProps> = (props) => {
  const {
    label,
    required,
    initialContent,
    placeholder,
    disabled,
    helperText,
    error,
    errorMessage,
    onMarkdownChange,
    onHtmlChange,
    loading,
    maxHeight = '100%',
    inputFormat = 'markdown',
    dataTestid,
  } = props;

  const { _ } = useSafeLingui();

  const getInitialEditorState = useCallback(
    (editor: LexicalEditor, format: RichTextEditorInputFormat, content?: string) => {
      if (format === 'markdown') {
        $convertFromMarkdownString(content ?? '', RTE_TRANSFORMERS);
        return;
      }

      const htmlParser = new DOMParser();
      const dom = htmlParser.parseFromString(content ?? '', 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);

      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.select();
        $insertNodes(nodes);
      });
    },
    []
  );

  const editorConfig = useMemo(
    () => ({
      namespace: 'apollo-rich-text-editor',
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        AutoLinkNode,
        LinkNode,
        QuoteNode,
        TableNode,
        TableCellNode,
        TableRowNode,
      ],
      // Handling of errors during update
      onError(err: Error) {
        throw err;
      },
      // The editor theme
      theme: EditorTheme,
      editable: !disabled && !loading,
      editorState: (editor: LexicalEditor) =>
        getInitialEditorState(editor, inputFormat, initialContent),
    }),
    [disabled, loading, getInitialEditorState, inputFormat, initialContent]
  );

  const getHelperText = useCallback(() => {
    if (errorMessage) {
      return <ErrorMessage id="editor-error-message" message={errorMessage} />;
    }
    if (error) {
      return <ErrorMessage id="editor-error-message" message={helperText ?? ''} />;
    }
    return (
      <ApTypography id="editor-helper-text" variant={FontVariantToken.fontSizeS}>
        {helperText}
      </ApTypography>
    );
  }, [error, errorMessage, helperText]);

  return (
    <div className="ap-rich-text-editor">
      <span id="editor-label" className={`editor-label${disabled ? ' disabled' : ''}`}>
        {label}
        {required && ' *'}
      </span>
      {loading ? (
        <LexicalComposer key="rte-loading" initialConfig={editorConfig}>
          <div
            aria-labelledby="editor-label"
            role="application"
            className={`editor-container disabled'${errorMessage || error ? ' error' : ''} loading`}
            style={{ maxHeight }}
            aria-disabled={disabled}
            aria-invalid={!!error}
          >
            <ToolbarPlugin disabled={true} />
            <CircularProgress
              aria-label={_(msg({ id: 'rich-text-editor.loading', message: 'Loading' }))}
            />
          </div>
        </LexicalComposer>
      ) : (
        <LexicalComposer key="rte-editor" initialConfig={editorConfig}>
          <div
            aria-labelledby="editor-label"
            role="application"
            className={`editor-container${disabled ? ' disabled' : ''}${errorMessage || error ? ' error' : ''}`}
            aria-disabled={disabled}
            style={{ maxHeight }}
            aria-errormessage={errorMessage ? 'editor-error-message' : undefined}
            aria-describedby={helperText ? 'editor-helper-text' : undefined}
          >
            <OnChangePlugin
              onChange={(editorState: EditorState, editor: LexicalEditor) => {
                editorState.read(() => {
                  onHtmlChange?.($generateHtmlFromNodes(editor));
                  onMarkdownChange?.($convertToMarkdownString(RTE_TRANSFORMERS));
                });
              }}
            />
            <ToolbarPlugin disabled={disabled} />
            <div className={`editor-inner${disabled ? ' disabled' : ''}`}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    ariaLabelledBy="editor-label"
                    className="editor-input"
                    disabled={disabled}
                    ariaDescribedBy={
                      errorMessage
                        ? 'editor-error-message'
                        : helperText
                          ? 'editor-helper-text'
                          : undefined
                    }
                    data-testid={dataTestid}
                  />
                }
                placeholder={<div className="editor-placeholder">{placeholder}</div>}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <ListPlugin />
              <LinkPlugin />
              <AutoLinkPlugin />
              <CodeHighlightPlugin />
              <MarkdownShortcutPlugin transformers={RTE_TRANSFORMERS} />
              <TablePlugin hasCellMerge={false} hasCellBackgroundColor={false} />
            </div>
            <HistoryPlugin />
          </div>
          {(helperText || errorMessage) && (
            <FormHelperText component="div">{getHelperText()}</FormHelperText>
          )}
        </LexicalComposer>
      )}
    </div>
  );
};
