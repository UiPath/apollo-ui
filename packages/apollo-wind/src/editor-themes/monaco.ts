/**
 * Apollo Future Monaco Editor themes.
 *
 * Pure data — no Monaco import required. Pass these objects directly to
 * `monaco.editor.defineTheme` before rendering your editor instance.
 *
 * @example
 * ```ts
 * import { apolloFutureDarkMonaco, apolloFutureLightMonaco } from '@uipath/apollo-wind/editor-themes';
 * import * as monaco from 'monaco-editor';
 *
 * monaco.editor.defineTheme('apollo-future-dark', apolloFutureDarkMonaco);
 * monaco.editor.defineTheme('apollo-future-light', apolloFutureLightMonaco);
 *
 * // Then use the theme name in your editor instance:
 * monaco.editor.create(container, {
 *   theme: 'apollo-future-dark',
 *   // ...
 * });
 * ```
 */

// Monaco rule foreground values are hex WITHOUT the leading '#'.
// Monaco colors values are hex WITH the leading '#', and support 8-char #rrggbbaa.

/** Token color rules — dark variant */
const darkRules = [
  { token: '', foreground: 'a1a1aa' }, // zinc-400  --code-rest
  { token: 'comment', foreground: '52525b' }, // zinc-600  comment (muted)
  { token: 'comment.doc', foreground: '52525b' },
  { token: 'string', foreground: '34d399' }, // emerald-400  --code-string
  { token: 'string.escape', foreground: '34d399' },
  { token: 'regexp', foreground: 'a78bfa' }, // violet-400  --code-literal
  { token: 'number', foreground: 'fbbf24' }, // amber-400  --code-number
  { token: 'number.float', foreground: 'fbbf24' },
  { token: 'number.hex', foreground: 'fbbf24' },
  { token: 'boolean', foreground: 'a78bfa' }, // violet-400  --code-literal
  { token: 'keyword', foreground: '22d3ee' }, // cyan-400  --code-key
  { token: 'keyword.control', foreground: '22d3ee' },
  { token: 'keyword.operator', foreground: '71717a' }, // zinc-500  --code-punctuation
  { token: 'operator', foreground: '71717a' }, // zinc-500  --code-punctuation
  { token: 'delimiter', foreground: '71717a' },
  { token: 'delimiter.bracket', foreground: '71717a' },
  { token: 'delimiter.array', foreground: '71717a' },
  { token: 'delimiter.parenthesis', foreground: '71717a' },
  { token: 'type', foreground: 'a78bfa' }, // violet-400  --code-literal
  { token: 'type.identifier', foreground: 'a78bfa' },
  { token: 'class', foreground: 'a78bfa' },
  { token: 'class.identifier', foreground: 'a78bfa' },
  { token: 'function', foreground: '22d3ee' }, // cyan-400  --code-key
  { token: 'function.identifier', foreground: '22d3ee' },
  { token: 'variable', foreground: 'a1a1aa' }, // zinc-400  --code-rest
  { token: 'variable.predefined', foreground: 'a78bfa' },
  { token: 'constant', foreground: 'a78bfa' }, // violet-400  --code-literal
  { token: 'identifier', foreground: 'a1a1aa' }, // zinc-400  --code-rest
  { token: 'tag', foreground: '22d3ee' },
  { token: 'attribute.name', foreground: '22d3ee' },
  { token: 'attribute.value', foreground: '34d399' },
  { token: 'metatag', foreground: '71717a' },
] as const;

/** Token color rules — light variant */
const lightRules = [
  { token: '', foreground: '52525b' }, // zinc-600  --code-rest
  { token: 'comment', foreground: 'a1a1aa' }, // zinc-400  comment (muted)
  { token: 'comment.doc', foreground: 'a1a1aa' },
  { token: 'string', foreground: '047857' }, // emerald-700  --code-string
  { token: 'string.escape', foreground: '047857' },
  { token: 'regexp', foreground: '7c3aed' }, // violet-600  --code-literal
  { token: 'number', foreground: 'b45309' }, // amber-700  --code-number
  { token: 'number.float', foreground: 'b45309' },
  { token: 'number.hex', foreground: 'b45309' },
  { token: 'boolean', foreground: '7c3aed' }, // violet-600  --code-literal
  { token: 'keyword', foreground: '0e7490' }, // cyan-700  --code-key
  { token: 'keyword.control', foreground: '0e7490' },
  { token: 'keyword.operator', foreground: '71717a' }, // zinc-500  --code-punctuation
  { token: 'operator', foreground: '71717a' }, // zinc-500  --code-punctuation
  { token: 'delimiter', foreground: '71717a' },
  { token: 'delimiter.bracket', foreground: '71717a' },
  { token: 'delimiter.array', foreground: '71717a' },
  { token: 'delimiter.parenthesis', foreground: '71717a' },
  { token: 'type', foreground: '7c3aed' }, // violet-600  --code-literal
  { token: 'type.identifier', foreground: '7c3aed' },
  { token: 'class', foreground: '7c3aed' },
  { token: 'class.identifier', foreground: '7c3aed' },
  { token: 'function', foreground: '0e7490' }, // cyan-700  --code-key
  { token: 'function.identifier', foreground: '0e7490' },
  { token: 'variable', foreground: '52525b' }, // zinc-600  --code-rest
  { token: 'variable.predefined', foreground: '7c3aed' },
  { token: 'constant', foreground: '7c3aed' }, // violet-600  --code-literal
  { token: 'identifier', foreground: '52525b' }, // zinc-600  --code-rest
  { token: 'tag', foreground: '0e7490' },
  { token: 'attribute.name', foreground: '0e7490' },
  { token: 'attribute.value', foreground: '047857' },
  { token: 'metatag', foreground: '71717a' },
] as const;

/**
 * Apollo Future Dark — Monaco theme definition.
 *
 * Uses the Apollo Future zinc palette with cyan keywords, emerald strings,
 * amber numbers, and violet literals.
 */
export const apolloFutureDarkMonaco = {
  base: 'vs-dark' as const,
  inherit: false,
  rules: darkRules,
  colors: {
    'editor.background': '#18181b', // zinc-900  surface-raised
    'editor.foreground': '#a1a1aa', // zinc-400  --code-rest
    'editorLineNumber.foreground': '#52525b', // zinc-600  comment level
    'editorLineNumber.activeForeground': '#a1a1aa', // zinc-400
    'editor.selectionBackground': '#3f3f4666', // zinc-700 @ 40%
    'editor.inactiveSelectionBackground': '#3f3f4633', // zinc-700 @ 20%
    'editor.lineHighlightBackground': '#27272a80', // zinc-800 @ 50%
    'editorCursor.foreground': '#22d3ee', // cyan-400  brand
    'editorWhitespace.foreground': '#3f3f46', // zinc-700
    'editorIndentGuide.background1': '#27272a', // zinc-800
    'editorIndentGuide.activeBackground1': '#3f3f46', // zinc-700
    'editorBracketMatch.background': '#22d3ee1a', // cyan-400 @ 10%
    'editorBracketMatch.border': '#22d3ee', // cyan-400
    'editor.findMatchBackground': '#fbbf2440', // amber-400 @ 25%
    'editor.findMatchHighlightBackground': '#fbbf2420',
    'editorWidget.background': '#09090b', // zinc-950
    'editorWidget.border': '#3f3f46', // zinc-700
    'editorSuggestWidget.background': '#09090b',
    'editorSuggestWidget.border': '#3f3f46',
    'editorSuggestWidget.selectedBackground': '#27272a',
    'editorHoverWidget.background': '#09090b',
    'editorHoverWidget.border': '#3f3f46',
    'scrollbarSlider.background': '#3f3f4666',
    'scrollbarSlider.hoverBackground': '#52525b80',
    'scrollbarSlider.activeBackground': '#71717a80',
    focusBorder: '#22d3ee',
    'input.background': '#27272a',
    'input.border': '#3f3f46',
    'input.foreground': '#a1a1aa',
    'input.placeholderForeground': '#52525b',
  },
};

/**
 * Apollo Future Light — Monaco theme definition.
 *
 * Uses the Apollo Future zinc palette with cyan-700 keywords, emerald-700 strings,
 * amber-700 numbers, and violet-600 literals.
 */
export const apolloFutureLightMonaco = {
  base: 'vs' as const,
  inherit: false,
  rules: lightRules,
  colors: {
    'editor.background': '#f4f4f5', // zinc-100  surface-raised
    'editor.foreground': '#52525b', // zinc-600  --code-rest
    'editorLineNumber.foreground': '#a1a1aa', // zinc-400  comment level
    'editorLineNumber.activeForeground': '#71717a', // zinc-500
    'editor.selectionBackground': '#d4d4d866', // zinc-300 @ 40%
    'editor.inactiveSelectionBackground': '#d4d4d833', // zinc-300 @ 20%
    'editor.lineHighlightBackground': '#e4e4e780', // zinc-200 @ 50%
    'editorCursor.foreground': '#0891b2', // cyan-600  brand
    'editorWhitespace.foreground': '#d4d4d8', // zinc-300
    'editorIndentGuide.background1': '#e4e4e7', // zinc-200
    'editorIndentGuide.activeBackground1': '#d4d4d8', // zinc-300
    'editorBracketMatch.background': '#0891b21a', // cyan-600 @ 10%
    'editorBracketMatch.border': '#0891b2', // cyan-600
    'editor.findMatchBackground': '#b4530940', // amber-700 @ 25%
    'editor.findMatchHighlightBackground': '#b4530920',
    'editorWidget.background': '#e4e4e7', // zinc-200
    'editorWidget.border': '#d4d4d8', // zinc-300
    'editorSuggestWidget.background': '#e4e4e7',
    'editorSuggestWidget.border': '#d4d4d8',
    'editorSuggestWidget.selectedBackground': '#d4d4d8',
    'editorHoverWidget.background': '#e4e4e7',
    'editorHoverWidget.border': '#d4d4d8',
    'scrollbarSlider.background': '#d4d4d866',
    'scrollbarSlider.hoverBackground': '#a1a1aa80',
    'scrollbarSlider.activeBackground': '#71717a80',
    focusBorder: '#0891b2',
    'input.background': '#ffffff',
    'input.border': '#d4d4d8',
    'input.foreground': '#52525b',
    'input.placeholderForeground': '#a1a1aa',
  },
};
