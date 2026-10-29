import { visit } from 'unist-util-visit';

import { CHAT_CITATION_START, type ContentPart } from '../../service';

// Written between a URL and a citation marker so GFM's autolink stops before the marker, then
// removed by citationPlugin. Markers that follow one are flagged with `+`, so the plugin can tell
// it apart from a tab the author wrote.
const SEPARATOR = '\t';

/**
 * Citation plugin that finds citation markers within text nodes and places citation components at exact positions
 */
export function citationPlugin() {
  // Global stack that persists across text nodes, so start/end can span nodes
  const citationStack: Array<{ citationsData: any[] }> = [];

  return (tree: any) => {
    visit(tree, 'text', (node: any, _index: number | undefined, parent: any) => {
      if (!node?.value || !parent) {
        return;
      }

      const text = String(node.value);

      // A `+` after the marker name means contentPartsToMarkdown wrote a separator tab in front of it
      const pattern = /\[\[cite-start(\+?):([^\]]+)\]\]|\[\[cite-end(\+?)\]\]/g;
      const newChildren: any[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null) {
        let before = text.slice(lastIndex, match.index);
        // Drop only the separator tab, never a tab the author wrote
        if ((match[1] || match[3]) && before.endsWith(SEPARATOR)) {
          before = before.slice(0, -SEPARATOR.length);
        }
        if (before) {
          newChildren.push({
            type: 'text',
            value: before,
          });
        }

        const token = match[0];
        if (token.startsWith('[[cite-start')) {
          try {
            // Decode base64, then reverse percent-encoding for Unicode support.
            // Data encoded before the Unicode fix used plain btoa (ASCII-only titles),
            // so atob alone is sufficient as a fallback.
            const raw = atob(match[2] as string);
            const decoded = raw.startsWith('%5B') ? decodeURIComponent(raw) : raw;
            const citationsData = JSON.parse(decoded);
            citationStack.push({ citationsData });

            newChildren.push({
              type: 'element',
              tagName: 'span',
              data: {
                hName: 'span',
                hProperties: {
                  className: [CHAT_CITATION_START],
                  'data-citation-ids': citationsData.map((c: any) => String(c.id)).join(' '),
                  style: 'display:none',
                },
              },
              children: [],
            });
          } catch (e) {
            console.error('[CitationPlugin] Failed to parse citation data:', e);
          }
        } else {
          const info = citationStack.pop();
          if (info) {
            const citationComponents = info.citationsData.map((citation: any) => ({
              type: 'citation',
              data: {
                hName: 'citation',
                hProperties: {
                  id: citation.id,
                  title: citation.title,
                  url: citation.url,
                  page_number: citation.page_number,
                  download_url: citation.download_url,
                  messageId: citation.messageId,
                },
              },
            }));
            newChildren.push(...citationComponents);
          }
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        newChildren.push({
          type: 'text',
          value: text.slice(lastIndex),
        });
      }

      // Replace this text node with rebuilt parts and additive markers/components
      const nodeIndex = parent.children.indexOf(node);
      if (nodeIndex >= 0) {
        parent.children.splice(nodeIndex, 1, ...newChildren);
      }
    });
  };
}

// The start of a URL that GFM may autolink (`http://`, `https://` or `www.`, in any case). GFM runs
// such a link until the next whitespace, so a citation marker written right after it would be
// absorbed into the link and shown as raw text.
const URL_START = /https?:\/\/|www\./i;

// One less than the longest URL_START match (`https://`), so a match split across two appended
// chunks is still found
const URL_START_OVERLAP = 7;

function lastWhitespaceIndex(text: string): number {
  let index = text.length - 1;
  while (index >= 0 && !/\s/.test(text[index] as string)) {
    index--;
  }
  return index;
}

/** Whether the last word of the text contains a URL that GFM may autolink. */
function endsWithUrl(text: string): boolean {
  return URL_START.test(text.slice(lastWhitespaceIndex(text) + 1));
}

/**
 * Whether a separator can go right after the text without changing how it renders. Not after an
 * emphasis delimiter run (repeats of one of `*`, `_`, `~`) that can open emphasis, which the
 * separator would prevent: a run after a letter or digit can only close emphasis, so it is safe,
 * and in `_**` the `**` is its own run after `_`. Not after an odd run of backslashes either, whose
 * last backslash escapes the next character and would show if a separator came between them.
 * When `truncated`, the text is only the end of the markdown, so a run that reaches its start may
 * be longer and is treated as unsafe.
 */
function canSeparateAfter(text: string, truncated = false): boolean {
  const last = text[text.length - 1];
  if (last !== '*' && last !== '_' && last !== '~' && last !== '\\') {
    return true;
  }
  let start = text.length - 1;
  while (start > 0 && text[start - 1] === last) {
    start--;
  }
  if (start === 0 && truncated) {
    return false;
  }
  if (last === '\\') {
    return (text.length - start) % 2 === 0;
  }
  return start > 0 && /[\p{L}\p{N}]/u.test(text[start - 1] as string);
}

/** Whether a citation marker written right after the text needs a separator. */
function needsUrlSeparator(text: string): boolean {
  return endsWithUrl(text) && canSeparateAfter(text);
}

// Length of the end of the markdown kept while it is built, enough to check what precedes the
// next marker without reading the whole message
const TAIL_LENGTH = 64;

/**
 * Converts an array of ContentParts to markdown format with proper citation tags
 * @param messageId - The ID of the message
 * @param contentParts - Array of content parts to convert
 * @returns Markdown string with embedded citation tags
 *
 * @example
 * ```typescript
 * const contentParts = [
 *   { text: "UiPath offers comprehensive " },
 *   {
 *     text: "automation capabilities",
 *     citations: [
 *       { id: "1", title: "UiPath Platform Guide", url: "https://docs.uipath.com/platform" },
 *       { id: "2", title: "Automation Best Practices", page_number: 15 }
 *     ]
 *   },
 *   { text: " including " },
 *   {
 *     text: "RPA, AI, and process mining",
 *     citations: [
 *       { id: "3", title: "Product Overview", download_url: "https://uipath.com/resources/overview.pdf" }
 *     ]
 *   },
 *   { text: "." }
 * ];
 *
 * const markdown = contentPartsToMarkdown(contentParts);
 * // Returns:
 * // "UiPath offers comprehensive[[cite-start:W3siaWQiOiIxIiwidGl0bGUiOiJVaVBhdGggUGxhdGZvcm0gR3VpZGUiLCJ1cmw
 * // iOiJodHRwczovL2RvY3MudWlwYXRoLmNvbS9wbGF0Zm9ybSJ9LHsiaWQiOiIyIiwidGl0bGUiOiJBdXRvbWF0aW9uIEJlc3QgUHJhY3R
 * // pY2VzIiwicGFnZV9udW1iZXIiOjE1fV0=]]automation capabilities[[cite-end]]including[[cite-start:W3siaWQiOiIz
 * // IiwidGl0bGUiOiJQcm9kdWN0IE92ZXJ2aWV3IiwiZG93bmxvYWRfdXJsIjoiaHR0cHM6Ly91aXBhdGguY29tL3Jlc291cmNlcy9vdmVy
 * // dmlldy5wZGYifV0=]]RPA, AI, and process mining[[cite-end]]."
 * ```
 */
export function contentPartsToMarkdown(messageId: string, contentParts: ContentPart[]): string {
  let markdown = '';
  // Whether the last word of `markdown` contains a URL, that word's last few characters, and the
  // end of `markdown`, kept up to date as text is appended so the whole message is never rescanned
  // or indexed. Text with no spaces, such as Chinese or Japanese, can make that word the whole
  // message.
  let lastWordHasUrl = false;
  let lastWordEnd = '';
  let tail = '';
  const append = (chunk: string) => {
    const whitespace = lastWhitespaceIndex(chunk);
    if (whitespace >= 0) {
      const word = chunk.slice(whitespace + 1);
      lastWordHasUrl = URL_START.test(word);
      lastWordEnd = word.slice(-URL_START_OVERLAP);
    } else {
      const joined = lastWordEnd + chunk;
      lastWordHasUrl = lastWordHasUrl || URL_START.test(joined);
      lastWordEnd = joined.slice(-URL_START_OVERLAP);
    }
    tail =
      chunk.length >= TAIL_LENGTH ? chunk.slice(-TAIL_LENGTH) : (tail + chunk).slice(-TAIL_LENGTH);
    markdown += chunk;
  };

  for (const part of contentParts) {
    let text = part.text ?? '';

    // If there are citations, wrap the text with citation data
    if (part.citations && part.citations.length > 0) {
      // Store all citations data as base64 encoded JSON
      const citationsData = part.citations.map((citation) => ({
        id: citation.id,
        title: citation.title,
        url: 'url' in citation ? citation.url : undefined,
        download_url: 'download_url' in citation ? citation.download_url : undefined,
        page_number: 'page_number' in citation ? citation.page_number : undefined,
        messageId,
      }));

      const encodedData = btoa(encodeURIComponent(JSON.stringify(citationsData)));
      // Put a separator between a URL and the marker after it so the autolink stops there.
      // citationPlugin removes it, so it adds no visible space. None goes after a delimiter
      // that could open emphasis or a backslash that escapes, so formatting never changes.
      // Cited text ending in an http(s) URL keeps its existing visible space before [[cite-end]].
      const startGap =
        lastWordHasUrl && canSeparateAfter(tail, markdown.length > tail.length) ? SEPARATOR : '';
      let endGap = '';
      if (/https?:\/\/\S+$/.test(text)) {
        endGap = ' ';
      } else if (needsUrlSeparator(text)) {
        endGap = SEPARATOR;
      }
      const startFlag = startGap ? '+' : '';
      const endFlag = endGap === SEPARATOR ? '+' : '';
      text = `${startGap}[[cite-start${startFlag}:${encodedData}]]${text}${endGap}[[cite-end${endFlag}]]`;
    }
    append(text);
  }

  return markdown;
}
