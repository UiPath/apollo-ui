import { useEffect } from 'react';
import {
  $generateNodesFromSerializedNodes,
  $getLexicalContent,
  $insertGeneratedNodes,
} from '@lexical/clipboard';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createRangeSelectionFromDom,
  $getSelection,
  $isRangeSelection,
  type BaseSelection,
  COMMAND_PRIORITY_CRITICAL,
  COPY_COMMAND,
  CUT_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  PASTE_COMMAND,
} from 'lexical';
import {
  createInputTokenNode,
  createOutputTokenNode,
  createStateTokenNode,
  createResourceTokenNode,
} from '../nodes';
import type { PromptEditorToken } from '../types';
import {
  clipboardStringToTokens,
  getEditorTokensFromSelection,
  tokensToClipboardString,
} from '../utils';

const LEXICAL_MIME = 'application/x-lexical-editor';

const copySelectionToClipboard = (
  editor: LexicalEditor,
  clipboardData: DataTransfer,
  selection: BaseSelection
): boolean => {
  const tokens = getEditorTokensFromSelection(selection);
  if (tokens.length === 0) return false;
  clipboardData.setData('text/plain', tokensToClipboardString(tokens));
  const lexicalJson = $getLexicalContent(editor, selection);
  if (lexicalJson) clipboardData.setData(LEXICAL_MIME, lexicalJson);
  return true;
};

const tryPasteLexicalContent = (
  editor: LexicalEditor,
  clipboardData: DataTransfer,
  selection: BaseSelection
): boolean => {
  const lexicalJson = clipboardData.getData(LEXICAL_MIME);
  if (!lexicalJson) return false;
  try {
    const parsed = JSON.parse(lexicalJson);
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) return false;
    const nodes = $generateNodesFromSerializedNodes(parsed.nodes);
    if (nodes.length === 0) return false;
    $insertGeneratedNodes(editor, nodes, selection);
    return true;
  } catch {
    return false;
  }
};

const insertTokensAtSelection = (tokens: PromptEditorToken[], selection: BaseSelection) => {
  if (!$isRangeSelection(selection)) return;
  if (!selection.isCollapsed()) selection.removeText();

  for (const token of tokens) {
    if (token.type === 'text') {
      const lines = token.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) selection.insertText(lines[i]);
        if (i < lines.length - 1) selection.insertParagraph();
      }
    } else {
      let tokenNode: LexicalNode;
      switch (token.type) {
        case 'input':
          tokenNode = createInputTokenNode(token.value);
          break;
        case 'output':
          tokenNode = createOutputTokenNode(token.value);
          break;
        case 'state':
          tokenNode = createStateTokenNode(token.value);
          break;
        case 'resource':
          tokenNode = createResourceTokenNode(token.value);
          break;
        default:
          throw new Error('Unknown token type');
      }
      if (tokenNode) selection.insertNodes([tokenNode]);
    }
  }
};

const pasteTextContent = (text: string, selection: BaseSelection): boolean => {
  if (!text) return false;
  const tokens = clipboardStringToTokens(text);
  if (tokens.length === 0) return false;
  insertTokensAtSelection(tokens, selection);
  return true;
};

export const CopyPastePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        COPY_COMMAND,
        (event: ClipboardEvent | KeyboardEvent | null) => {
          if (!event || !('clipboardData' in event) || !event.clipboardData) return false;
          let handled = false;
          editor.read(() => {
            let selection = $getSelection();
            if (!selection || ($isRangeSelection(selection) && selection.isCollapsed())) {
              const domSelection = window.getSelection();
              const rootElement = editor.getRootElement();
              if (domSelection && rootElement && !domSelection.isCollapsed) {
                selection = $createRangeSelectionFromDom(domSelection, editor);
              }
            }
            if (!selection || ($isRangeSelection(selection) && selection.isCollapsed())) return;
            handled = copySelectionToClipboard(editor, event.clipboardData!, selection);
          });
          if (handled) event.preventDefault();
          return handled;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        CUT_COMMAND,
        (event: ClipboardEvent | KeyboardEvent | null) => {
          if (!event || !('clipboardData' in event) || !event.clipboardData) return false;
          let handled = false;
          editor.read(() => {
            let selection = $getSelection();
            if (!selection || ($isRangeSelection(selection) && selection.isCollapsed())) {
              const domSelection = window.getSelection();
              const rootElement = editor.getRootElement();
              if (domSelection && rootElement && !domSelection.isCollapsed) {
                selection = $createRangeSelectionFromDom(domSelection, editor);
              }
            }
            if (!selection || ($isRangeSelection(selection) && selection.isCollapsed())) return;
            handled = copySelectionToClipboard(editor, event.clipboardData!, selection);
          });
          if (handled) {
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if (selection && $isRangeSelection(selection)) selection.removeText();
            });
          }
          return handled;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent | KeyboardEvent | null) => {
          if (!event || !('clipboardData' in event) || !event.clipboardData) return false;
          const clipboardData = event.clipboardData;
          const hasLexicalJson = Boolean(clipboardData.getData(LEXICAL_MIME));
          const plainText = clipboardData.getData('text/plain');
          const hasPlainText = Boolean(plainText);
          if (!hasLexicalJson && !hasPlainText) return false;
          event.preventDefault();
          editor.update(
            () => {
              const selection = $getSelection();
              if (!selection) return;
              if (hasLexicalJson && tryPasteLexicalContent(editor, clipboardData, selection))
                return;
              if (hasPlainText) pasteTextContent(plainText, selection);
            },
            { discrete: true }
          );
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor]);

  return null;
};
