import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createNodeSelection,
  $createRangeSelection,
  $createTextNode,
  $getSelection,
  $isLineBreakNode,
  $isNodeSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { isPromptTokenNode, type PromptTokenNode } from './shared/token-nodes';
import { WORD_JOINER } from '../utils';

/**
 * Confluence-style pill focus controller. Pills are inline `DecoratorNode`s with no caret-anchor,
 * so we drive focus through Lexical's `NodeSelection`: clicking or arrowing into a pill puts it in
 * NodeSelection, and this plugin owns the keyboard transitions in and out of that state.
 *
 * - Pill selected + Backspace → remove, cursor BEFORE
 * - Pill selected + Delete → remove, cursor AFTER
 * - Cursor adjacent to pill + ArrowLeft/Right → focus the pill (no pass-through)
 * - Pill selected + ArrowLeft/Right → cursor BEFORE / AFTER
 * - Pill selected + ArrowUp/Down → cursor BEFORE / AFTER, then browser walks the line
 * - Pill selected + Escape → cursor AFTER
 * - Cursor at start-of-text after a `LineBreakNode` + Backspace → remove the BR (unrelated to pills)
 *
 * Shift-arrow defers to Lexical's default range expansion.
 */

const $setCollapsedSelection = (key: string, offset: number, type: 'text' | 'element'): void => {
  const sel = $createRangeSelection();
  sel.anchor.set(key, offset, type);
  sel.focus.set(key, offset, type);
  $setSelection(sel);
};

const getSelectedPromptToken = (): PromptTokenNode | null => {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) return null;
  const nodes = selection.getNodes();
  if (nodes.length !== 1) return null;
  const node = nodes[0];
  return isPromptTokenNode(node) ? node : null;
};

const getCollapsedRangeSelection = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
  return selection;
};

/** Token immediately before the collapsed cursor, if any. Returns null otherwise. */
const getPromptTokenBeforeCursor = (): PromptTokenNode | null => {
  const selection = getCollapsedRangeSelection();
  if (!selection) return null;
  const anchorNode = selection.anchor.getNode();

  if ($isTextNode(anchorNode) && selection.anchor.offset === 0) {
    const prev = anchorNode.getPreviousSibling();
    return isPromptTokenNode(prev) ? prev : null;
  }
  if ($isParagraphNode(anchorNode)) {
    const offset = selection.anchor.offset;
    if (offset === 0) return null;
    const prev = anchorNode.getChildAtIndex(offset - 1);
    return isPromptTokenNode(prev) ? prev : null;
  }
  return null;
};

/** Token immediately after the collapsed cursor, if any. Returns null otherwise. */
const getPromptTokenAfterCursor = (): PromptTokenNode | null => {
  const selection = getCollapsedRangeSelection();
  if (!selection) return null;
  const anchorNode = selection.anchor.getNode();

  if ($isTextNode(anchorNode) && selection.anchor.offset === anchorNode.getTextContentSize()) {
    const next = anchorNode.getNextSibling();
    return isPromptTokenNode(next) ? next : null;
  }
  if ($isParagraphNode(anchorNode)) {
    const next = anchorNode.getChildAtIndex(selection.anchor.offset);
    return isPromptTokenNode(next) ? next : null;
  }
  return null;
};

/**
 * When the cursor lands on a standalone word-joiner node (one whose entire
 * content is the joiner character), skip past it in the given direction.
 * Only fires for standalone nodes — joiners appended to real text (Case A)
 * are traversed in a single native browser step and don't need this.
 */
const skipLineBreaks = (node: LexicalNode, direction: 'left' | 'right'): LexicalNode | null => {
  let sibling: LexicalNode | null =
    direction === 'left' ? node.getPreviousSibling() : node.getNextSibling();
  while (sibling && $isLineBreakNode(sibling)) {
    sibling = direction === 'left' ? sibling.getPreviousSibling() : sibling.getNextSibling();
  }
  return sibling;
};

const skipStandaloneJoiner = (direction: 'left' | 'right'): boolean => {
  const selection = getCollapsedRangeSelection();
  if (!selection) return false;
  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode) || anchorNode.getTextContent() !== WORD_JOINER) return false;

  const sibling = skipLineBreaks(anchorNode, direction);

  if (sibling && isPromptTokenNode(sibling)) {
    focusPromptToken(sibling);
    return true;
  }
  if ($isTextNode(sibling)) {
    $setCollapsedSelection(
      sibling.getKey(),
      direction === 'left' ? sibling.getTextContentSize() : 0,
      'text'
    );
    return true;
  }
  const parent = anchorNode.getParent();
  if (!parent) return false;
  const idx = anchorNode.getIndexWithinParent() + (direction === 'left' ? 0 : 1);
  $setCollapsedSelection(parent.getKey(), idx, 'element');
  return true;
};

/**
 * Place a collapsed `RangeSelection` immediately before `node`.
 *
 * At CSS line-wrap boundaries, caret positions between inline-block decorators
 * are visually ambiguous — the browser may render the caret on the previous
 * line. We insert a word-joiner before the decorator and position at offset 1
 * (after the joiner). The joiner prevents line breaks, so it wraps with the
 * pill — and offset 1 is unambiguously on the pill's line.
 */
const placeCursorBefore = (node: LexicalNode): void => {
  const prev = node.getPreviousSibling();

  if ($isTextNode(prev)) {
    const content = prev.getTextContent();
    if (!content.endsWith(WORD_JOINER)) {
      prev.setTextContent(content + WORD_JOINER);
    }
    $setCollapsedSelection(prev.getKey(), prev.getTextContentSize(), 'text');
  } else {
    const anchor = $createTextNode(WORD_JOINER);
    node.insertBefore(anchor);
    $setCollapsedSelection(anchor.getKey(), 1, 'text');
  }
};

/** Place a collapsed `RangeSelection` immediately after `node`. */
const placeCursorAfter = (node: LexicalNode): void => {
  const next = node.getNextSibling();
  if ($isTextNode(next)) {
    $setCollapsedSelection(next.getKey(), 0, 'text');
  } else {
    const parent = node.getParent();
    if (!parent) return;
    $setCollapsedSelection(parent.getKey(), node.getIndexWithinParent() + 1, 'element');
  }
};

/** Replace the current selection with a `NodeSelection` containing only `node`. */
const focusPromptToken = (node: LexicalNode): void => {
  const newSelection = $createNodeSelection();
  newSelection.add(node.getKey());
  $setSelection(newSelection);
};

/**
 * Registers the focus controller commands on a Lexical editor. Exported so tests can drive the
 * exact same logic the React plugin wires up at mount time, against a headless `createEditor()`.
 */
export const registerNodeSelectionFixCommands = (editor: LexicalEditor): (() => void) => {
  const handleBackspace = (event: KeyboardEvent): boolean => {
    const selectedToken = getSelectedPromptToken();
    if (selectedToken) {
      const before = (() => {
        const prev = selectedToken.getPreviousSibling();
        if ($isTextNode(prev))
          return { kind: 'text' as const, key: prev.getKey(), offset: prev.getTextContentSize() };
        const parent = selectedToken.getParent();
        if (parent)
          return {
            kind: 'element' as const,
            key: parent.getKey(),
            offset: selectedToken.getIndexWithinParent(),
          };
        return null;
      })();
      selectedToken.remove();
      if (before) {
        $setCollapsedSelection(before.key, before.offset, before.kind);
      }
      event.preventDefault();
      return true;
    }

    // Cursor just after a pill — focus it instead of deleting characters.
    const pillBefore = getPromptTokenBeforeCursor();
    if (pillBefore) {
      focusPromptToken(pillBefore);
      event.preventDefault();
      return true;
    }

    // Cursor at start-of-text after a LineBreakNode — remove the BR.
    const selection = getCollapsedRangeSelection();
    if (!selection) return false;
    const anchorNode = selection.anchor.getNode();
    let paragraph = null;
    let offset = 0;
    if (selection.anchor.type === 'element' && $isParagraphNode(anchorNode)) {
      paragraph = anchorNode;
      offset = selection.anchor.offset;
    } else if (
      selection.anchor.type === 'text' &&
      $isTextNode(anchorNode) &&
      selection.anchor.offset === 0
    ) {
      const parent = anchorNode.getParent();
      if (!$isParagraphNode(parent)) return false;
      paragraph = parent;
      offset = anchorNode.getIndexWithinParent();
    } else {
      return false;
    }
    if (offset <= 0) return false;
    const previousNode = paragraph.getChildAtIndex(offset - 1);
    if (!$isLineBreakNode(previousNode)) return false;

    const lineStartNode = paragraph.getChildAtIndex(offset);
    previousNode.remove();
    if ($isTextNode(lineStartNode) && lineStartNode.isAttached()) {
      $setCollapsedSelection(lineStartNode.getKey(), 0, 'text');
    } else {
      $setCollapsedSelection(paragraph.getKey(), Math.max(0, offset - 1), 'element');
    }
    event.preventDefault();
    return true;
  };

  const handleDelete = (event: KeyboardEvent): boolean => {
    const selectedToken = getSelectedPromptToken();
    if (selectedToken) {
      const after = (() => {
        const next = selectedToken.getNextSibling();
        if ($isTextNode(next)) return { kind: 'text' as const, key: next.getKey(), offset: 0 };
        const parent = selectedToken.getParent();
        if (parent)
          return {
            kind: 'element' as const,
            key: parent.getKey(),
            offset: selectedToken.getIndexWithinParent(),
          };
        return null;
      })();
      selectedToken.remove();
      if (after) {
        $setCollapsedSelection(after.key, after.offset, after.kind);
      }
      event.preventDefault();
      return true;
    }

    // Cursor just before a pill — focus it instead of deleting characters.
    const pillAfter = getPromptTokenAfterCursor();
    if (pillAfter) {
      focusPromptToken(pillAfter);
      event.preventDefault();
      return true;
    }
    return false;
  };

  const handleArrowLeft = (event: KeyboardEvent): boolean => {
    if (event.shiftKey) return false;

    const selectedToken = getSelectedPromptToken();
    if (selectedToken) {
      placeCursorBefore(selectedToken);
      event.preventDefault();
      return true;
    }

    const pillBefore = getPromptTokenBeforeCursor();
    if (pillBefore) {
      focusPromptToken(pillBefore);
      event.preventDefault();
      return true;
    }

    if (skipStandaloneJoiner('left')) {
      event.preventDefault();
      return true;
    }

    return false;
  };

  const handleArrowRight = (event: KeyboardEvent): boolean => {
    if (event.shiftKey) return false;

    const selectedToken = getSelectedPromptToken();
    if (selectedToken) {
      placeCursorAfter(selectedToken);
      event.preventDefault();
      return true;
    }

    const pillAfter = getPromptTokenAfterCursor();
    if (pillAfter) {
      focusPromptToken(pillAfter);
      event.preventDefault();
      return true;
    }

    if (skipStandaloneJoiner('right')) {
      event.preventDefault();
      return true;
    }

    return false;
  };

  const handleEscape = (event: KeyboardEvent): boolean => {
    const selectedToken = getSelectedPromptToken();
    if (!selectedToken) return false;
    placeCursorAfter(selectedToken);
    event.preventDefault();
    return true;
  };

  // ArrowUp/Down on a focused pill: drop a RangeSelection adjacent to the pill so the DOM caret
  // is in the contenteditable, then return false to let the browser walk the line. Without the
  // cursor-placement step, the browser sees no DOM caret and treats it as page scroll.
  // Single return is intentional — Lexical's command pipeline needs `false` ("not handled,
  // continue propagating") on every path so the browser still moves the caret line-by-line.
  const handleArrowUp = (event: KeyboardEvent): boolean => {
    if (!event.shiftKey) {
      const selectedToken = getSelectedPromptToken();
      if (selectedToken) placeCursorBefore(selectedToken);
    }
    return false;
  };

  const handleArrowDown = (event: KeyboardEvent): boolean => {
    if (!event.shiftKey) {
      const selectedToken = getSelectedPromptToken();
      if (selectedToken) placeCursorAfter(selectedToken);
    }
    return false;
  };

  const unregisterBackspace = editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    handleBackspace,
    COMMAND_PRIORITY_HIGH
  );
  const unregisterDelete = editor.registerCommand(
    KEY_DELETE_COMMAND,
    handleDelete,
    COMMAND_PRIORITY_HIGH
  );
  const unregisterArrowLeft = editor.registerCommand(
    KEY_ARROW_LEFT_COMMAND,
    handleArrowLeft,
    COMMAND_PRIORITY_HIGH
  );
  const unregisterArrowRight = editor.registerCommand(
    KEY_ARROW_RIGHT_COMMAND,
    handleArrowRight,
    COMMAND_PRIORITY_HIGH
  );
  const unregisterArrowUp = editor.registerCommand(
    KEY_ARROW_UP_COMMAND,
    handleArrowUp,
    COMMAND_PRIORITY_HIGH
  );
  const unregisterArrowDown = editor.registerCommand(
    KEY_ARROW_DOWN_COMMAND,
    handleArrowDown,
    COMMAND_PRIORITY_HIGH
  );
  const unregisterEscape = editor.registerCommand(
    KEY_ESCAPE_COMMAND,
    handleEscape,
    COMMAND_PRIORITY_HIGH
  );

  return () => {
    unregisterBackspace();
    unregisterDelete();
    unregisterArrowLeft();
    unregisterArrowRight();
    unregisterArrowUp();
    unregisterArrowDown();
    unregisterEscape();
  };
};

export const NodeSelectionFixPlugin = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerNodeSelectionFixCommands(editor), [editor]);
  return null;
};
