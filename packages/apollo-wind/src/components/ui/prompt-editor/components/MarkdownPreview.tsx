import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { type PromptEditorToken } from '../types';
import { buildTokenIconSvgMarkup } from './token-icon-markup';

const marked = new Marked({ async: false, gfm: true, breaks: true });

/**
 * Preview styles, injected via a `<style>` tag rather than a `.css` import so the published bundle
 * stays self-contained (a bundless `.css` import doesn't resolve next to the emitted JS for
 * consumers). Scoped under `.prompt-editor-preview`; colors use apollo-wind design tokens.
 */
const MARKDOWN_PREVIEW_STYLES = `
.prompt-editor-preview { color: var(--color-foreground); }
.prompt-editor-preview-empty { color: var(--color-muted-foreground); }
.prompt-editor-preview h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.3; }
.prompt-editor-preview h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.3; }
.prompt-editor-preview h3 { font-size: 1.1em; font-weight: 600; margin: 0.4em 0 0.2em; line-height: 1.3; }
.prompt-editor-preview h4, .prompt-editor-preview h5, .prompt-editor-preview h6 { font-size: 1em; font-weight: 600; margin: 0.4em 0 0.2em; line-height: 1.3; }
.prompt-editor-preview p { margin: 0.25em 0; }
.prompt-editor-preview code { font-family: 'Fira Code', 'Consolas', monospace; font-size: 0.875em; padding: 0.15em 0.4em; border-radius: 4px; background-color: var(--color-muted); color: var(--color-foreground); }
.prompt-editor-preview pre { margin: 0.5em 0; padding: 0.75em 1em; border-radius: 6px; overflow-x: auto; background-color: var(--color-muted); color: var(--color-foreground); }
.prompt-editor-preview pre code { padding: 0; background: none; font-size: 0.85em; }
.prompt-editor-preview blockquote { margin: 0.5em 0; padding: 0.25em 0.75em; border-left: 3px solid var(--color-border); color: var(--color-muted-foreground); }
.prompt-editor-preview ul, .prompt-editor-preview ol { margin: 0.25em 0; padding-left: 1.5em; }
.prompt-editor-preview ul { list-style-type: disc; }
.prompt-editor-preview ol { list-style-type: decimal; }
.prompt-editor-preview li { margin: 0.1em 0; }
.prompt-editor-preview a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px; }
.prompt-editor-preview a:hover { opacity: 0.8; }
.prompt-editor-preview hr { margin: 0.75em 0; border: none; border-top: 1px solid var(--color-border); }
.prompt-editor-preview table { border-collapse: collapse; margin: 0.5em 0; width: 100%; }
.prompt-editor-preview th, .prompt-editor-preview td { border: 1px solid var(--color-border); padding: 0.35em 0.75em; text-align: left; }
.prompt-editor-preview th { font-weight: 600; background-color: var(--color-muted); }
.prompt-editor-preview strong { font-weight: 700; }
.prompt-editor-preview em { font-style: italic; }
.prompt-editor-preview .token-pill { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 4px; border-radius: 4px; font-size: 13px; line-height: 20px; vertical-align: middle; background: var(--color-primary-lighter); color: var(--color-foreground); }
.prompt-editor-preview .token-pill[data-invalid='true'] { background: var(--color-error-background); }
.prompt-editor-preview .token-pill svg { display: block; flex-shrink: 0; color: var(--color-primary); width: 14px; height: 14px; }
`;

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
    'data-invalid',
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

export const MarkdownPreview = ({ tokens, minRows = 4 }: MarkdownPreviewProps) => {
  const html = useMemo(() => {
    if (tokens.length === 0)
      return `<p class="prompt-editor-preview-empty">${escapeHtml(EMPTY_MESSAGE)}</p>`;
    const md = tokensToMarkdownWithPills(tokens);
    const rawHtml = marked.parse(md) as string;
    return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);
  }, [tokens]);

  return (
    <>
      <style>{MARKDOWN_PREVIEW_STYLES}</style>
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
    </>
  );
};
