import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  type BaseSelection,
  type LexicalEditor,
  type LexicalNode,
  type ParagraphNode,
} from 'lexical';
import {
  createInputTokenNode,
  InputTokenNode,
  isInputTokenNode,
  createOutputTokenNode,
  isOutputTokenNode,
  OutputTokenNode,
  createStateTokenNode,
  isStateTokenNode,
  StateTokenNode,
  createResourceTokenNode,
  isResourceTokenNode,
  ResourceTokenNode,
} from '../nodes';
import type { PromptEditorToken } from '../types';

/** Convert Lexical editor state to PromptEditorToken[] */
export const WORD_JOINER = '⁠';

const appendTextToken = (tokens: PromptEditorToken[], raw: string) => {
  const text = raw.split(WORD_JOINER).join('');
  if (!text) return;
  const lastToken = tokens[tokens.length - 1];
  if (lastToken && lastToken.type === 'text') {
    lastToken.value += text;
  } else {
    tokens.push({ type: 'text', value: text });
  }
};

export const $getEditorTokensInternal = (): PromptEditorToken[] => {
  const root = $getRoot();
  const tokens: PromptEditorToken[] = [];

  const addText = (raw: string) => appendTextToken(tokens, raw);

  const traverseChildren = (children: LexicalNode[]) => {
    for (const node of children) {
      if ($isTextNode(node)) {
        addText(node.getTextContent());
      } else if ($isLineBreakNode(node)) {
        addText('\n');
      } else if (isInputTokenNode(node)) {
        tokens.push({ type: 'input', value: (node as InputTokenNode).getValue() });
      } else if (isOutputTokenNode(node)) {
        tokens.push({ type: 'output', value: (node as OutputTokenNode).getValue() });
      } else if (isStateTokenNode(node)) {
        tokens.push({ type: 'state', value: (node as StateTokenNode).getValue() });
      } else if (isResourceTokenNode(node)) {
        tokens.push({ type: 'resource', value: (node as ResourceTokenNode).getValue() });
      }
    }
  };

  const paragraphs = root.getChildren();
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if ($isParagraphNode(paragraph)) {
      traverseChildren((paragraph as ParagraphNode).getChildren());
      if (i < paragraphs.length - 1) {
        addText('\n');
      }
    }
  }

  return tokens;
};

/** Convert PromptEditorToken[] to Lexical editor state */
export const $setEditorTokensInternal = (tokens: PromptEditorToken[]) => {
  if (!Array.isArray(tokens)) {
    throw new TypeError('setEditorTokensInternal: tokens must be an array');
  }

  const root = $getRoot();
  root.clear();

  const currentParagraph = $createParagraphNode();

  for (const token of tokens) {
    if (token.type === 'text') {
      const lines = token.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) {
          currentParagraph.append($createTextNode(lines[i]));
        }
        if (i < lines.length - 1) {
          currentParagraph.append($createLineBreakNode());
        }
      }
    } else {
      let node: LexicalNode;
      switch (token.type) {
        case 'input':
          node = createInputTokenNode(token.value);
          break;
        case 'output':
          node = createOutputTokenNode(token.value);
          break;
        case 'state':
          node = createStateTokenNode(token.value);
          break;
        case 'resource':
          node = createResourceTokenNode(token.value);
          break;
        default:
          throw new Error(`Unknown token type: ${(token as { type: string }).type}`);
      }
      currentParagraph.append(node);
    }
  }

  root.append(currentParagraph);
};

export const getEditorTokens = (editor: LexicalEditor): PromptEditorToken[] => {
  let tokens: PromptEditorToken[] = [];
  editor.getEditorState().read(() => {
    tokens = $getEditorTokensInternal();
  });
  return tokens;
};

export const setEditorTokens = (editor: LexicalEditor, tokens: PromptEditorToken[]) => {
  editor.update(() => $setEditorTokensInternal(tokens), { discrete: true });
};

/** Serialize tokens to clipboard-friendly string (using {{ }} for variables) */
export const tokensToClipboardString = (tokens: PromptEditorToken[]): string => {
  let result = '';
  for (const token of tokens) {
    if (token.type === 'text') {
      result += token.value;
    } else {
      // All non-text tokens use {{ }} syntax for clipboard
      result += `{{ ${token.value} }}`;
    }
  }
  return result;
};

/** Parse a clipboard string back into tokens */
export const clipboardStringToTokens = (str: string): PromptEditorToken[] => {
  const tokens: PromptEditorToken[] = [];
  let currentText = '';
  let i = 0;

  const flushText = () => {
    if (currentText.length > 0) {
      tokens.push({ type: 'text', value: currentText });
      currentText = '';
    }
  };

  while (i < str.length) {
    // Check for {{ }} token
    if (str[i] === '{' && i + 1 < str.length && str[i + 1] === '{') {
      flushText();
      i += 2;
      let inner = '';
      let foundClosing = false;
      while (i < str.length) {
        if (str[i] === '}' && i + 1 < str.length && str[i + 1] === '}') {
          i += 2;
          foundClosing = true;
          break;
        }
        inner += str[i];
        i++;
      }
      if (foundClosing && inner.trim()) {
        // Default to input type for pasted variables
        tokens.push({ type: 'input', value: inner.trim() });
      } else if (foundClosing) {
        currentText += '{{}}';
      } else {
        currentText += `{{${inner}`;
      }
      continue;
    }

    currentText += str[i];
    i++;
  }

  flushText();
  return tokens;
};

/** Get tokens from a selection (for copy/cut operations) */
export const getEditorTokensFromSelection = (selection: BaseSelection): PromptEditorToken[] => {
  if (!$isRangeSelection(selection)) return [];
  if (selection.isCollapsed()) return [];

  const tokens: PromptEditorToken[] = [];
  const addText = (raw: string) => appendTextToken(tokens, raw);

  const selectedNodes = selection.getNodes();
  const anchorKey = selection.anchor.key;
  const focusKey = selection.focus.key;
  const anchorOffset = selection.anchor.offset;
  const focusOffset = selection.focus.offset;

  const anchorNode = selection.anchor.getNode();
  const nodeKeys = new Set(selectedNodes.map((n) => n.getKey()));
  const nodesToProcess: LexicalNode[] = [];

  if ($isTextNode(anchorNode) && !nodeKeys.has(anchorKey)) {
    nodesToProcess.push(anchorNode);
  }
  nodesToProcess.push(...selectedNodes);

  if (nodesToProcess.length === 0) return [];

  const firstSelectedNode = nodesToProcess[0];
  const isForward =
    nodesToProcess.length === 1
      ? anchorOffset <= focusOffset
      : firstSelectedNode.getKey() === anchorKey ||
        firstSelectedNode.getParent()?.getKey() === anchorKey;

  let prevNodeParagraph: ParagraphNode | null = null;

  for (const node of nodesToProcess) {
    const nodeKey = node.getKey();
    const nodeType = node.getType();
    const nodeParagraph = $isParagraphNode(node)
      ? node
      : (node.getParent() as ParagraphNode | null);

    if (prevNodeParagraph && nodeParagraph && prevNodeParagraph !== nodeParagraph) {
      addText('\n');
    }
    prevNodeParagraph = nodeParagraph;

    if ($isParagraphNode(node)) continue;

    if (nodeType === 'input-token') {
      tokens.push({ type: 'input', value: (node as InputTokenNode).getValue() });
    } else if (nodeType === 'output-token') {
      tokens.push({ type: 'output', value: (node as OutputTokenNode).getValue() });
    } else if (nodeType === 'state-token') {
      tokens.push({ type: 'state', value: (node as StateTokenNode).getValue() });
    } else if (nodeType === 'resource-token') {
      tokens.push({ type: 'resource', value: (node as ResourceTokenNode).getValue() });
    } else if ($isTextNode(node)) {
      const textContent = node.getTextContent();
      let selectedText = textContent;

      const isAnchorNode = nodeKey === anchorKey;
      const isFocusNode = nodeKey === focusKey;

      if (isAnchorNode && isFocusNode) {
        const start = Math.min(anchorOffset, focusOffset);
        const end = Math.max(anchorOffset, focusOffset);
        selectedText = textContent.slice(start, end);
      } else if (isAnchorNode) {
        selectedText = isForward
          ? textContent.slice(anchorOffset)
          : textContent.slice(0, anchorOffset);
      } else if (isFocusNode) {
        selectedText = isForward
          ? textContent.slice(0, focusOffset)
          : textContent.slice(focusOffset);
      }

      if (selectedText) addText(selectedText);
    } else if ($isLineBreakNode(node)) {
      addText('\n');
    }
  }

  return tokens;
};
