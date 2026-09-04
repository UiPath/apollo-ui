import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { type MutableRefObject, useEffect } from 'react';
import type { PromptEditorToolbarActionsRef, PromptEditorToolbarActiveFormats } from '../types';

interface ToolbarActionsPluginProps {
  actionsRef: MutableRefObject<PromptEditorToolbarActionsRef | null>;
  /** WYSIWYG mode: dispatch real Lexical format/list commands instead of inserting markdown markers. */
  richText?: boolean;
  /** Rich mode only: reports which formats are active at the selection, for toolbar pressed states. */
  onActiveFormatsChange?: (formats: PromptEditorToolbarActiveFormats) => void;
}

const EMPTY_ACTIVE_FORMATS: PromptEditorToolbarActiveFormats = {
  bold: false,
  italic: false,
  strikethrough: false,
  orderedList: false,
  bulletedList: false,
};

/** Which formats/list types the selection currently carries. Must run inside a read/update. */
const $readActiveFormats = (): PromptEditorToolbarActiveFormats => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return EMPTY_ACTIVE_FORMATS;
  }
  const anchorNode = selection.anchor.getNode();
  const listType = $getNearestNodeOfType(anchorNode, ListNode)?.getListType();
  return {
    bold: selection.hasFormat('bold'),
    italic: selection.hasFormat('italic'),
    strikethrough: selection.hasFormat('strikethrough'),
    orderedList: listType === 'number',
    bulletedList: listType === 'bullet',
  };
};

const activeFormatsEqual = (
  a: PromptEditorToolbarActiveFormats,
  b: PromptEditorToolbarActiveFormats
) =>
  a.bold === b.bold &&
  a.italic === b.italic &&
  a.strikethrough === b.strikethrough &&
  a.orderedList === b.orderedList &&
  a.bulletedList === b.bulletedList;

/**
 * Wrap current selection with start/end markers (e.g., **bold**, *italic*, `code`).
 * Preserves token (decorator) nodes — only wraps the text boundaries with markers.
 */
const wrapSelectionWithMarkers = (startMarker: string, endMarker: string) => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;

  if (selection.isCollapsed()) {
    const markerNode = $createTextNode(`${startMarker}${endMarker}`);
    selection.insertNodes([markerNode]);
    const offset = startMarker.length;
    selection.setTextNodeRange(markerNode, offset, markerNode, offset);
    return;
  }

  // Normalize to the logical start/end points: anchor/focus swap meaning for backward
  // (right-to-left) selections, so resolve via isBackward() rather than assuming anchor=start.
  const isBackward = selection.isBackward();
  const startPoint = isBackward ? selection.focus : selection.anchor;
  const endPoint = isBackward ? selection.anchor : selection.focus;
  const startNode = startPoint.getNode();
  const startOffset = startPoint.offset;
  const endNode = endPoint.getNode();
  const endOffset = endPoint.offset;

  // Insert the end marker first so the start offset stays valid when both points share one text node.
  if ($isTextNode(endNode)) {
    const text = endNode.getTextContent();
    endNode.setTextContent(text.slice(0, endOffset) + endMarker + text.slice(endOffset));
  } else {
    // End point is a non-text node (e.g., decorator) — insert after it
    const endText = $createTextNode(endMarker);
    endNode.insertAfter(endText);
  }

  if ($isTextNode(startNode)) {
    const text = startNode.getTextContent();
    startNode.setTextContent(text.slice(0, startOffset) + startMarker + text.slice(startOffset));
  } else {
    // Start point is a non-text node — insert before it
    const startText = $createTextNode(startMarker);
    startNode.insertBefore(startText);
  }
};

/**
 * Insert a prefix at the beginning of each selected paragraph.
 * Handles multi-line selections, toggle-off, incremental numbering, and token nodes at line start.
 */
const insertLinePrefixForSelection = (getPrefix: (index: number) => string) => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;

  // Collect all paragraphs that are part of the selection
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  // Get the paragraphs containing anchor and focus
  const anchorParent =
    $isTextNode(anchorNode) || !$isParagraphNode(anchorNode) ? anchorNode.getParent() : anchorNode;
  const focusParent =
    $isTextNode(focusNode) || !$isParagraphNode(focusNode) ? focusNode.getParent() : focusNode;

  if (!anchorParent || !focusParent) return;

  // Get all paragraphs in the root
  const root = $getRoot();
  const allParagraphs = root.getChildren().filter($isParagraphNode);

  // Find the range of paragraphs to affect
  const anchorIndex = allParagraphs.findIndex((p) => p.is(anchorParent));
  const focusIndex = allParagraphs.findIndex((p) => p.is(focusParent));
  if (anchorIndex === -1 || focusIndex === -1) return;

  const startIndex = Math.min(anchorIndex, focusIndex);
  const endIndex = Math.max(anchorIndex, focusIndex);

  let lineCounter = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const paragraph = allParagraphs[i];
    const firstChild = paragraph.getFirstChild();
    const prefix = getPrefix(lineCounter);
    lineCounter++;

    if ($isTextNode(firstChild)) {
      const text = firstChild.getTextContent();
      // Toggle off: if prefix already exists at start, remove it
      if (text.startsWith(prefix)) {
        firstChild.setTextContent(text.slice(prefix.length));
      } else {
        firstChild.setTextContent(prefix + text);
      }
    } else if (firstChild) {
      // First child is a decorator node (token pill) — insert text node before it
      const prefixNode = $createTextNode(prefix);
      firstChild.insertBefore(prefixNode);
    } else {
      // Empty paragraph — just add the prefix as text
      paragraph.append($createTextNode(prefix));
    }
  }
};

export const ToolbarActionsPlugin = ({
  actionsRef,
  richText,
  onActiveFormatsChange,
}: ToolbarActionsPluginProps) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (richText) {
      // WYSIWYG: real Lexical formatting — the state holds formatted nodes, serialized to
      // markdown only at the token boundary (see utils/rich-serialization).
      const toggleList = (target: 'number' | 'bullet') => {
        const listType = editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return undefined;
          return $getNearestNodeOfType(selection.anchor.getNode(), ListNode)?.getListType();
        });
        if (listType === target) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(
            target === 'number' ? INSERT_ORDERED_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
            undefined
          );
        }
      };
      actionsRef.current = {
        formatBold: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),
        formatItalic: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),
        formatStrikethrough: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'),
        formatNumberedList: () => toggleList('number'),
        formatBulletedList: () => toggleList('bullet'),
      };
    } else {
      actionsRef.current = {
        formatBold: () => {
          editor.update(() => wrapSelectionWithMarkers('**', '**'));
        },
        formatItalic: () => {
          editor.update(() => wrapSelectionWithMarkers('*', '*'));
        },
        formatStrikethrough: () => {
          // GFM strikethrough — `marked` (preview renderer) honours it natively.
          editor.update(() => wrapSelectionWithMarkers('~~', '~~'));
        },
        formatNumberedList: () => {
          editor.update(() => insertLinePrefixForSelection((i) => `${i + 1}. `));
        },
        formatBulletedList: () => {
          editor.update(() => insertLinePrefixForSelection(() => '- '));
        },
      };
    }

    return () => {
      actionsRef.current = null;
    };
  }, [editor, actionsRef, richText]);

  // Pressed-state tracking for the toolbar, rich mode only (plain mode has no live formats).
  useEffect(() => {
    if (!richText || !onActiveFormatsChange) return;
    let last: PromptEditorToolbarActiveFormats | null = null;
    const report = () => {
      const next = editor.getEditorState().read($readActiveFormats);
      if (!last || !activeFormatsEqual(last, next)) {
        last = next;
        onActiveFormatsChange(next);
      }
    };
    report();
    return mergeRegister(
      editor.registerUpdateListener(report),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          report();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, richText, onActiveFormatsChange]);

  return null;
};
