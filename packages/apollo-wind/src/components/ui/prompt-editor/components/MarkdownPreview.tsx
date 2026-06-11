import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { useMemo } from 'react';
import { type PromptEditorToken } from '../types';
import { buildTokenIconSvgMarkup } from './token-icon-markup';

const marked = new Marked({ async: false, gfm: true, breaks: true });

// Preview element styles live in the package stylesheet (`styles/tailwind.utilities.css`, scoped
// under `.prompt-editor-preview`) that consumers already import — see the note there. They were
// previously injected inline here, but a per-component `.css` import doesn't resolve next to the
// emitted JS in apollo-wind's bundless build, so the rules moved into the shared stylesheet.

export interface MarkdownPreviewProps {
  tokens: PromptEditorToken[];
  minRows?: number;
}

/**
 * Strict DOMPurify whitelist — replaces defaults, no style attribute allowed. Includes lucide's SVG
 * primitives (`line`, `polyline`, `circle`, `rect`, `polygon`, `ellipse`) so the token-type icons
 * built by `buildTokenIconSvgMarkup` round-trip through sanitization intact.
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    // text
    'p',
    'br',
    'span',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'del',
    'ins',
    'mark',
    'sub',
    'sup',
    'small',
    // headings
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // lists
    'ul',
    'ol',
    'li',
    // code
    'code',
    'pre',
    // block
    'blockquote',
    'hr',
    'div',
    // links
    'a',
    // table
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    // inline SVG for token icons (lucide shapes)
    'svg',
    'path',
    'line',
    'polyline',
    'polygon',
    'circle',
    'ellipse',
    'rect',
    'g',
  ],
  ALLOWED_ATTR: [
    'class',
    // links — `target` is intentionally disallowed so `target="_blank"` can't enable tabnabbing
    'href',
    'rel',
    // SVG common
    'viewBox',
    'xmlns',
    'width',
    'height',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'fill-rule',
    'clip-rule',
    // <path>
    'd',
    // <line>
    'x1',
    'x2',
    'y1',
    'y2',
    // <polyline> / <polygon>
    'points',
    // <circle> / <ellipse>
    'cx',
    'cy',
    'r',
    // <rect>
    'x',
    'y',
    'rx',
    'ry',
    // table
    'colspan',
    'rowspan',
  ],
};

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Convert tokens to a markdown string, replacing variable tokens with styled HTML spans. The chip
 * text is the verbatim `token.value` (full path) so authors always see the path they're referencing;
 * the leading icon is chosen by token type to match what the editor renders in edit mode.
 */
const tokensToMarkdownWithPills = (tokens: PromptEditorToken[]): string => {
  let md = '';
  for (const token of tokens) {
    if (token.type === 'text') {
      md += token.value;
    } else {
      const iconSvg = buildTokenIconSvgMarkup(token.type);
      md += `<span class="token-pill">${iconSvg}${escapeHtml(token.value)}</span>`;
    }
  }
  return md;
};

const LINE_HEIGHT = 20;
const VERTICAL_PADDING = 8;
const EMPTY_MESSAGE = 'Nothing to preview';

/**
 * Renders the prompt tokens as sanitized markdown for preview mode.
 *
 * Preview is **visual-only**: every variable token renders as a pill regardless of whether its path
 * still exists in `autoCompleteOptions`. Unlike edit mode — where `ValidateTokensPlugin` flags
 * stale/unknown tokens as invalid — preview does not receive the option set and so does not reflect
 * token validity. Switch to edit mode to see validation state.
 */
export const MarkdownPreview = ({ tokens, minRows = 4 }: MarkdownPreviewProps) => {
  const html = useMemo(() => {
    if (tokens.length === 0)
      return `<p class="prompt-editor-preview-empty">${escapeHtml(EMPTY_MESSAGE)}</p>`;
    const md = tokensToMarkdownWithPills(tokens);
    const rawHtml = marked.parse(md) as string;
    return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);
  }, [tokens]);

  return (
    <div
      className="prompt-editor-preview"
      style={{
        padding: '8px 12px',
        minHeight: `${minRows * LINE_HEIGHT + VERTICAL_PADDING * 2}px`,
        fontFamily: "'Noto Sans', sans-serif",
        fontSize: '14px',
        lineHeight: '20px',
      }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is produced by marked then sanitized through DOMPurify with a strict allowlist (PURIFY_CONFIG) before this point.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
