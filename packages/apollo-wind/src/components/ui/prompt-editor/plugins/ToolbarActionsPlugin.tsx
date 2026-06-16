import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
} from 'lexical';
import { type MutableRefObject, useEffect } from 'react';
import type { PromptEditorToolbarActionsRef } from '../types';

interface ToolbarActionsPluginProps {
  actionsRef: MutableRefObject<PromptEditorToolbarActionsRef | null>;
}

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

export const ToolbarActionsPlugin = ({ actionsRef }: ToolbarActionsPluginProps) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
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

    return () => {
      actionsRef.current = null;
    };
  }, [editor, actionsRef]);

  return null;
};
