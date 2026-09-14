import { ListItemNode, ListNode } from '@lexical/list';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  ORDERED_LIST,
  STRIKETHROUGH,
  type TextMatchTransformer,
  type Transformer,
  UNORDERED_LIST,
} from '@lexical/markdown';
import {
  $createTextNode,
  $getRoot,
  $isTextNode,
  createEditor,
  type LexicalNode,
  type TextNode,
} from 'lexical';
import { InputTokenNode, OutputTokenNode, ResourceTokenNode, StateTokenNode } from '../nodes';
import { isPromptTokenNode, NODE_TYPE_TO_TOKEN_TYPE } from '../plugins/shared/token-nodes';
import type { PromptEditorToken, PromptEditorTokenType } from '../types';
import { createTokenNodeForOption } from './insert-token';
import { WORD_JOINER } from './serialization';

/**
 * Rich (WYSIWYG) serialization for the prompt editor: the `PromptEditorToken[]` contract is
 * unchanged — text tokens carry markdown — but in rich mode the editor state holds real formatted
 * nodes, converted through `@lexical/markdown` on the way in and out.
 *
 * Two invariants drive everything here:
 *
 * 1. **`\n` is a visible line break** (the plain editor's convention; previews render with
 *    `breaks: true`). Both conversions run with `shouldPreserveNewLines: true` so `a\nb` and
 *    `a\n\nb` each round-trip byte-identically instead of being rewritten into paragraph spacing.
 * 2. **Unknown markdown stays literal.** The transformer set is exactly the toolbar's feature set
 *    (bold/italic/underline/strikethrough + lists + inline code). Headings, quotes, code fences,
 *    links and tables pass through as plain text, which is the round-trip-safe behavior.
 */

/**
 * Underline has no markdown syntax, so it round-trips as literal `<u>` — a tag `marked` renders and
 * the preview's DOMPurify allowlist already permits. `TextFormatTransformer` needs one symmetric
 * marker, hence a text-match transformer keyed on the format bit instead.
 *
 * Accepted edge, like the literal-`*` case below: a typed `<u>` comes back as underline. The
 * preview already renders it that way, so interpreting it keeps the two consistent.
 */
const UNDERLINE: TextMatchTransformer = {
  dependencies: [],
  importRegExp: /<u>(.*?)<\/u>/,
  regExp: /<u>(.*?)<\/u>$/,
  trigger: '>',
  replace: (node, match) => {
    const inner = $createTextNode(match[1]);
    // Carry the bits an OUTER transformer already applied. `importTextTransformers` runs the
    // outermost match first, so `**<u>x</u>**` reaches here already bold — a fresh node would
    // silently drop the `**` on the next save.
    inner.setFormat(node.getFormat());
    inner.toggleFormat('underline');
    node.replace(inner);
    // Returning it re-runs format matching, so inner `*italic*` survives.
    return inner;
  },
  export: (node, _exportChildren, exportFormat) => {
    if (!$isTextNode(node) || !node.hasFormat('underline')) {
      return null;
    }
    // Inner emphasis splits a run across text nodes, so tag only the run's edges — otherwise
    // `<u>an *italic* run</u>` exports as three `<u>` pairs.
    const isUnderlined = (sibling: LexicalNode | null) =>
      $isTextNode(sibling) && sibling.hasFormat('underline');
    const open = isUnderlined(node.getPreviousSibling()) ? '' : '<u>';
    const close = isUnderlined(node.getNextSibling()) ? '' : '</u>';
    return `${open}${exportFormat(node, node.getTextContent())}${close}`;
  },
  type: 'text-match',
};

/** The toolbar's feature set. Underscore emphasis variants import legacy content; export emits star forms. */
export const PROMPT_EDITOR_RICH_TRANSFORMERS: Transformer[] = [
  ORDERED_LIST,
  UNORDERED_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  UNDERLINE,
  INLINE_CODE,
];

/** Lexical node classes rich mode registers beyond the plain editor's token nodes. */
export const RICH_EDITOR_EXTRA_NODES = [ListNode, ListItemNode];

/**
 * Token pills travel through the markdown conversion as Private-Use-Area sentinels
 * (`{index}` into a per-call side table) so a variable path containing markdown
 * characters (`*`, `_`, `[`…) can never be interpreted, escaped, or split by the converter.
 */
const PILL_SENTINEL_START = '\uE000';
const PILL_SENTINEL_END = '\uE001';
const PILL_SENTINEL_IMPORT = /\uE000(\d+)\uE001/;
const PILL_SENTINEL_SPLIT = /(\uE000\d+\uE001)/;
const PILL_SENTINEL_ANY = /[\uE000\uE001]/g;

type PillRef = { type: Exclude<PromptEditorTokenType, 'text'>; value: string };

/** Import-side transformer: swap a sentinel text run for the correct typed decorator node. */
function createPillImportTransformer(pills: PillRef[]): TextMatchTransformer {
  return {
    dependencies: [InputTokenNode, OutputTokenNode, StateTokenNode, ResourceTokenNode],
    importRegExp: PILL_SENTINEL_IMPORT,
    regExp: PILL_SENTINEL_IMPORT,
    replace: (node: TextNode, match) => {
      const pill = pills[Number(match[1])];
      if (!pill) {
        node.setTextContent('');
        return;
      }
      node.replace(createTokenNodeForOption(pill));
    },
    type: 'text-match',
  };
}

/** Export-side transformer: emit a sentinel per pill node, recording it in the side table. */
function createPillExportTransformer(pills: PillRef[]): TextMatchTransformer {
  return {
    dependencies: [InputTokenNode, OutputTokenNode, StateTokenNode, ResourceTokenNode],
    regExp: PILL_SENTINEL_IMPORT,
    export: (node) => {
      if (!isPromptTokenNode(node)) {
        return null;
      }
      const type = NODE_TYPE_TO_TOKEN_TYPE[node.getType()];
      if (!type) {
        return null;
      }
      const index = pills.length;
      pills.push({ type, value: node.getValue() });
      return `${PILL_SENTINEL_START}${index}${PILL_SENTINEL_END}`;
    },
    type: 'text-match',
  };
}

/**
 * Reverse the converter's blanket backslash-escaping of literal markdown characters
 * (`2 * 3` → `2 \* 3`, `my_var` → `my\_var`). Persisted values follow the plain editor's
 * convention where literal `*`/`_`/`~` appear unescaped, and downstream consumers (marked,
 * connector payloads) receive the string verbatim — so the escapes must not leak into storage.
 * Import unescapes the same set, so the round-trip stays stable. Known accepted edge: a literal
 * marker character INSIDE a formatted run can produce ambiguous markdown after unescaping
 * (pinned by tests).
 */
const unescapeMarkdownLiterals = (markdown: string): string =>
  markdown.replace(/\\([*_`~\\])/g, '$1');

/**
 * `@lexical/markdown` deliberately stops transforming inside a code span (`canContainTransformableMarkdown`
 * rejects code-formatted nodes), so a pill sentinel enclosed by backticks is never turned into a
 * decorator. It would then reach export as literal text with no entry in the export-side side table
 * and be dropped — silently deleting the user's variable reference. Rescue those runs afterwards:
 * the pill is what matters, so it wins and the code formatting on that run is given up.
 */
function $rescuePillsFromCodeSpans(pills: PillRef[]): void {
  for (const node of $getRoot().getAllTextNodes()) {
    if (!node.hasFormat('code') || !PILL_SENTINEL_IMPORT.test(node.getTextContent())) {
      continue;
    }
    const replacements = node
      .getTextContent()
      .split(PILL_SENTINEL_SPLIT)
      .filter((part) => part !== '')
      .map((part) => {
        const match = PILL_SENTINEL_IMPORT.exec(part);
        if (match && match[0] === part) {
          const pill = pills[Number(match[1])];
          return pill ? createTokenNodeForOption(pill) : $createTextNode('');
        }
        return $createTextNode(part);
      });
    if (replacements.length > 0) {
      const [first, ...rest] = replacements;
      node.replace(first);
      rest.reduce((prev, next) => {
        prev.insertAfter(next);
        return next;
      }, first);
    }
  }
}

/**
 * Editor state → tokens. Must be called inside `editor.read()`/`editor.update()`.
 * Formatted content serializes to markdown text tokens; pills come out as typed tokens.
 */
export function $getRichEditorTokensInternal(): PromptEditorToken[] {
  const pills: PillRef[] = [];
  const markdown = $convertToMarkdownString(
    [...PROMPT_EDITOR_RICH_TRANSFORMERS, createPillExportTransformer(pills)],
    undefined,
    /* shouldPreserveNewLines */ true
  );
  const tokens: PromptEditorToken[] = [];
  for (const part of unescapeMarkdownLiterals(markdown).split(PILL_SENTINEL_SPLIT)) {
    if (part === '') {
      continue;
    }
    const pillMatch = PILL_SENTINEL_IMPORT.exec(part);
    if (pillMatch && pillMatch[0] === part) {
      const pill = pills[Number(pillMatch[1])];
      if (pill) {
        tokens.push({ ...pill });
      }
      continue;
    }
    const text = part.split(WORD_JOINER).join('');
    if (text === '') {
      continue;
    }
    const last = tokens[tokens.length - 1];
    if (last && last.type === 'text') {
      last.value += text;
    } else {
      tokens.push({ type: 'text', value: text });
    }
  }
  return tokens;
}

/**
 * Tokens → editor state. Must be called inside `editor.update()`. Clears the root and parses the
 * text tokens' markdown into formatted nodes, splicing pills back in as decorator nodes.
 */
export function $setRichEditorTokensInternal(tokens: PromptEditorToken[]): void {
  const pills: PillRef[] = [];
  let markdown = '';
  for (const token of tokens) {
    if (token.type === 'text') {
      // Literal sentinel characters in content would corrupt the pill side table — strip them.
      markdown += token.value.replace(PILL_SENTINEL_ANY, '');
    } else {
      const index = pills.length;
      pills.push({ type: token.type, value: token.value });
      markdown += `${PILL_SENTINEL_START}${index}${PILL_SENTINEL_END}`;
    }
  }
  const root = $getRoot();
  root.clear();
  $convertFromMarkdownString(
    markdown,
    [...PROMPT_EDITOR_RICH_TRANSFORMERS, createPillImportTransformer(pills)],
    root,
    /* shouldPreserveNewLines */ true
  );
  $rescuePillsFromCodeSpans(pills);
}

/**
 * Pure "what will the rich editor re-emit for this seed" — an import→export round-trip through a
 * headless editor. Consumers use it to tell a genuine edit apart from mere markdown normalization
 * (`_em_` → `*em*`, `* item` → `- item`, …) so an untouched open/blur never rewrites a stored
 * value. Deterministic and side-effect free.
 */
export function normalizeRichTextTokens(tokens: PromptEditorToken[]): PromptEditorToken[] {
  // `createEditor` without a root element is headless: update/read work, and nothing here touches
  // the DOM — so no @lexical/headless dependency is needed.
  const editor = createEditor({
    namespace: 'PromptEditorRichNormalize',
    nodes: [
      InputTokenNode,
      OutputTokenNode,
      StateTokenNode,
      ResourceTokenNode,
      ...RICH_EDITOR_EXTRA_NODES,
    ],
    onError: (error: Error) => {
      throw error;
    },
  });
  editor.update(() => $setRichEditorTokensInternal(tokens), { discrete: true });
  let result: PromptEditorToken[] = [];
  editor.read(() => {
    result = $getRichEditorTokensInternal();
  });
  return result;
}
