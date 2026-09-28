/**
 * Hand-mirrored SVG markup for the lucide icons the token pills render in edit mode. Used by
 * `MarkdownPreview` so a chip's leading icon can be inlined into the sanitised HTML without going
 * through `react-dom/server`'s `renderToStaticMarkup` (which couples to React reconciler internals
 * and can crash depending on the host bundle).
 *
 * The element data is copied verbatim from `lucide-react@0.577.0`'s `__iconNode` arrays
 * (`dist/esm/icons/<name>.js`) so the preview SVGs match exactly what `<TokenPill>` renders.
 */

import type { PromptEditorTokenType } from '../types';

type IconElement =
  | { kind: 'path'; d: string }
  | { kind: 'line'; x1: string; x2: string; y1: string; y2: string }
  | { kind: 'circle'; cx: string; cy: string; r: string }
  | { kind: 'ellipse'; cx: string; cy: string; rx: string; ry: string }
  | { kind: 'rect'; x: string; y: string; width: string; height: string; rx?: string; ry?: string };

/** lucide `variable` — input variables. */
const VARIABLE_ICON: IconElement[] = [
  { kind: 'path', d: 'M8 21s-4-3-4-9 4-9 4-9' },
  { kind: 'path', d: 'M16 3s4 3 4 9-4 9-4 9' },
  { kind: 'line', x1: '15', x2: '9', y1: '9', y2: '15' },
  { kind: 'line', x1: '9', x2: '15', y1: '9', y2: '15' },
];

/** lucide `square-function` — output variables. */
const SQUARE_FUNCTION_ICON: IconElement[] = [
  { kind: 'rect', x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' },
  { kind: 'path', d: 'M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3' },
  { kind: 'path', d: 'M9 11.2h5.7' },
];

/** lucide `database` — state variables. */
const DATABASE_ICON: IconElement[] = [
  { kind: 'ellipse', cx: '12', cy: '5', rx: '9', ry: '3' },
  { kind: 'path', d: 'M3 5V19A9 3 0 0 0 21 19V5' },
  { kind: 'path', d: 'M3 12A9 3 0 0 0 21 12' },
];

/** lucide `paperclip` — resources. */
const PAPERCLIP_ICON: IconElement[] = [
  {
    kind: 'path',
    d: 'm16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551',
  },
];

interface IconChoice {
  name: string;
  body: IconElement[];
}

const TOKEN_TYPE_ICON: Record<Exclude<PromptEditorTokenType, 'text'>, IconChoice> = {
  input: { name: 'variable', body: VARIABLE_ICON },
  output: { name: 'square-function', body: SQUARE_FUNCTION_ICON },
  state: { name: 'database', body: DATABASE_ICON },
  resource: { name: 'paperclip', body: PAPERCLIP_ICON },
};

const renderElement = (el: IconElement): string => {
  switch (el.kind) {
    case 'path':
      return `<path d="${el.d}"/>`;
    case 'line':
      return `<line x1="${el.x1}" x2="${el.x2}" y1="${el.y1}" y2="${el.y2}"/>`;
    case 'circle':
      return `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}"/>`;
    case 'ellipse':
      return `<ellipse cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}"/>`;
    case 'rect':
      return (
        `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"` +
        `${el.rx ? ` rx="${el.rx}"` : ''}${el.ry ? ` ry="${el.ry}"` : ''}/>`
      );
  }
};

const wrapSvg = (iconName: string, body: IconElement[]): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ` +
  `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
  `class="lucide lucide-${iconName}">${body.map(renderElement).join('')}</svg>`;

/**
 * Build the inline SVG markup for a token chip's leading icon, keyed by token type. Output mirrors
 * what `<TokenPill>` renders in edit mode (lucide v0.577.0), suitable for embedding in a markdown
 * HTML string. Non-variable token types fall back to the input (`variable`) glyph.
 */
export function buildTokenIconSvgMarkup(type: PromptEditorTokenType): string {
  const choice = type === 'text' ? TOKEN_TYPE_ICON.input : TOKEN_TYPE_ICON[type];
  return wrapSvg(choice.name, choice.body);
}
