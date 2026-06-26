import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
} from 'lexical';
import {
  createInputTokenNode,
  createOutputTokenNode,
  createStateTokenNode,
  createResourceTokenNode,
} from '../nodes';
import type { PromptEditorAutoCompleteOption } from '../types';

/** Create the correct Lexical token decorator node for an autocomplete option. */
export const createTokenNodeForOption = (option: PromptEditorAutoCompleteOption) => {
  switch (option.type) {
    case 'input':
      return createInputTokenNode(option.value);
    case 'output':
      return createOutputTokenNode(option.value);
    case 'state':
      return createStateTokenNode(option.value);
    case 'resource':
      return createResourceTokenNode(option.value);
    default:
      return createInputTokenNode(option.value);
  }
};

/**
 * Insert a token pill at the current cursor position. Must be called inside an
 * `editor.update(() => ...)` block.
 *
 * - Text anchor: splits the text and inserts between the halves (or appends/prepends at edges).
 * - Element anchor: inserts as a child at the selection offset.
 * - No selection: appends to the root so the action is not silently dropped.
 */
export const $insertTokenAtCursor = (option: PromptEditorAutoCompleteOption): void => {
  const tokenNode = createTokenNodeForOption(option);
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    // No selection — append to the last paragraph/element of the root so the user sees the result.
    const root = $getRoot();
    const lastChild = root.getLastChild();
    if (lastChild && $isElementNode(lastChild)) {
      lastChild.append(tokenNode);
    } else {
      // RootNode only accepts block/element children, so wrap the inline token in a paragraph
      // rather than appending the decorator directly to the root (which would corrupt the state).
      const paragraph = $createParagraphNode();
      paragraph.append(tokenNode);
      root.append(paragraph);
    }
    tokenNode.selectNext(0, 0);
    return;
  }

  // Collapse any non-empty selection first so we replace it with the token.
  if (!selection.isCollapsed()) {
    selection.removeText();
  }

  const anchorNode = selection.anchor.getNode();
  const anchorOffset = selection.anchor.offset;

  if ($isTextNode(anchorNode)) {
    const textContent = anchorNode.getTextContent();
    const textBefore = textContent.slice(0, anchorOffset);
    const textAfter = textContent.slice(anchorOffset);

    if (textBefore && textAfter) {
      anchorNode.setTextContent(textBefore);
      anchorNode.insertAfter(tokenNode);
      const textAfterNode = $createTextNode(textAfter);
      tokenNode.insertAfter(textAfterNode);
      textAfterNode.select(0, 0);
    } else if (textBefore) {
      anchorNode.setTextContent(textBefore);
      anchorNode.insertAfter(tokenNode);
      tokenNode.selectNext(0, 0);
    } else if (textAfter) {
      anchorNode.insertBefore(tokenNode);
      tokenNode.selectNext(0, 0);
    } else {
      anchorNode.replace(tokenNode);
      tokenNode.selectNext(0, 0);
    }
    return;
  }

  if ($isElementNode(anchorNode)) {
    const children = anchorNode.getChildren();
    const childAtOffset = children[anchorOffset];
    if (childAtOffset) {
      childAtOffset.insertBefore(tokenNode);
    } else {
      anchorNode.append(tokenNode);
    }
    tokenNode.selectNext(0, 0);
  }
  // Any other anchor type (line breaks, decorator nodes) is a rare edge case —
  // silently no-op rather than risk corrupting the editor state.
};
