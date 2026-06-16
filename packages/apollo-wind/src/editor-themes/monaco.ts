/**
 * Apollo Monaco Editor themes — Future, Core, and Core HC variants.
 *
 * Pure data — no Monaco import required. Pass these objects directly to
 * `monaco.editor.defineTheme` before rendering your editor instance.
 *
 * @example
 * ```ts
 * import { apolloCoreDarkMonaco } from '@uipath/apollo-wind/editor-themes';
 * import * as monaco from 'monaco-editor';
 *
 * monaco.editor.defineTheme('apollo-core-dark', apolloCoreDarkMonaco);
 *
 * // Then use the theme name in your editor instance:
 * monaco.editor.create(container, {
 *   theme: 'apollo-core-dark',
 *   // ...
 * });
 * ```
 */

// Monaco rule foreground values are hex WITHOUT the leading '#'.
// Monaco color values are hex WITH the leading '#', and support 8-char #rrggbbaa.

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

// ============================================================================
// Apollo Core — token color rules
// ============================================================================

const coreDarkRules = [
  { token: '', foreground: 'cfd8dd' },
  { token: 'comment', foreground: '526069' },
  { token: 'comment.doc', foreground: '526069' },
  { token: 'string', foreground: 'f25a8c' },
  { token: 'string.escape', foreground: 'f25a8c' },
  { token: 'regexp', foreground: 'dc80db' },
  { token: 'number', foreground: '6ecdb6' },
  { token: 'number.float', foreground: '6ecdb6' },
  { token: 'number.hex', foreground: '6ecdb6' },
  { token: 'boolean', foreground: 'dc80db' },
  { token: 'keyword', foreground: '66adff' },
  { token: 'keyword.control', foreground: '66adff' },
  { token: 'keyword.operator', foreground: '8a97a0' },
  { token: 'operator', foreground: '66adff' },
  { token: 'delimiter', foreground: '8a97a0' },
  { token: 'delimiter.bracket', foreground: '8a97a0' },
  { token: 'delimiter.array', foreground: '8a97a0' },
  { token: 'delimiter.parenthesis', foreground: '8a97a0' },
  { token: 'type', foreground: 'dc80db' },
  { token: 'type.identifier', foreground: 'dc80db' },
  { token: 'class', foreground: 'dc80db' },
  { token: 'class.identifier', foreground: 'dc80db' },
  { token: 'function', foreground: '66adff' },
  { token: 'function.identifier', foreground: '66adff' },
  { token: 'variable', foreground: 'cfd8dd' },
  { token: 'variable.predefined', foreground: 'dc80db' },
  { token: 'constant', foreground: 'dc80db' },
  { token: 'identifier', foreground: 'cfd8dd' },
  { token: 'tag', foreground: '66adff' },
  { token: 'attribute.name', foreground: '66adff' },
  { token: 'attribute.value', foreground: 'f25a8c' },
  { token: 'metatag', foreground: '8a97a0' },
] as const;

const coreLightRules = [
  { token: '', foreground: '526069' },
  { token: 'comment', foreground: 'a4b1b8' },
  { token: 'comment.doc', foreground: 'a4b1b8' },
  { token: 'string', foreground: 'd91153' },
  { token: 'string.escape', foreground: 'd91153' },
  { token: 'regexp', foreground: 'b748b6' },
  { token: 'number', foreground: '1e7f5a' },
  { token: 'number.float', foreground: '1e7f5a' },
  { token: 'number.hex', foreground: '1e7f5a' },
  { token: 'boolean', foreground: 'b748b6' },
  { token: 'keyword', foreground: '0067df' },
  { token: 'keyword.control', foreground: '0067df' },
  { token: 'keyword.operator', foreground: '6b7882' },
  { token: 'operator', foreground: '0067df' },
  { token: 'delimiter', foreground: '6b7882' },
  { token: 'delimiter.bracket', foreground: '6b7882' },
  { token: 'delimiter.array', foreground: '6b7882' },
  { token: 'delimiter.parenthesis', foreground: '6b7882' },
  { token: 'type', foreground: 'b748b6' },
  { token: 'type.identifier', foreground: 'b748b6' },
  { token: 'class', foreground: 'b748b6' },
  { token: 'class.identifier', foreground: 'b748b6' },
  { token: 'function', foreground: '0067df' },
  { token: 'function.identifier', foreground: '0067df' },
  { token: 'variable', foreground: '526069' },
  { token: 'variable.predefined', foreground: 'b748b6' },
  { token: 'constant', foreground: 'b748b6' },
  { token: 'identifier', foreground: '526069' },
  { token: 'tag', foreground: '0067df' },
  { token: 'attribute.name', foreground: '0067df' },
  { token: 'attribute.value', foreground: 'd91153' },
  { token: 'metatag', foreground: '6b7882' },
] as const;

const coreDarkHCRules = [
  { token: '', foreground: 'cfd8dd' },
  { token: 'comment', foreground: '526069' },
  { token: 'comment.doc', foreground: '526069' },
  { token: 'string', foreground: 'fd7da7' }, // HC: higher contrast pink
  { token: 'string.escape', foreground: 'fd7da7' },
  { token: 'regexp', foreground: 'dc80db' },
  { token: 'number', foreground: '6ecdb6' },
  { token: 'number.float', foreground: '6ecdb6' },
  { token: 'number.hex', foreground: '6ecdb6' },
  { token: 'boolean', foreground: 'dc80db' },
  { token: 'keyword', foreground: 'badaff' }, // HC: brighter primary
  { token: 'keyword.control', foreground: 'badaff' },
  { token: 'keyword.operator', foreground: '8a97a0' },
  { token: 'operator', foreground: 'badaff' },
  { token: 'delimiter', foreground: '8a97a0' },
  { token: 'delimiter.bracket', foreground: '8a97a0' },
  { token: 'delimiter.array', foreground: '8a97a0' },
  { token: 'delimiter.parenthesis', foreground: '8a97a0' },
  { token: 'type', foreground: 'dc80db' },
  { token: 'type.identifier', foreground: 'dc80db' },
  { token: 'class', foreground: 'dc80db' },
  { token: 'class.identifier', foreground: 'dc80db' },
  { token: 'function', foreground: 'badaff' },
  { token: 'function.identifier', foreground: 'badaff' },
  { token: 'variable', foreground: 'cfd8dd' },
  { token: 'variable.predefined', foreground: 'dc80db' },
  { token: 'constant', foreground: 'dc80db' },
  { token: 'identifier', foreground: 'cfd8dd' },
  { token: 'tag', foreground: 'badaff' },
  { token: 'attribute.name', foreground: 'badaff' },
  { token: 'attribute.value', foreground: 'fd7da7' },
  { token: 'metatag', foreground: '8a97a0' },
] as const;

const coreLightHCRules = [
  { token: '', foreground: '374652' }, // HC: stronger default text
  { token: 'comment', foreground: '8a97a0' },
  { token: 'comment.doc', foreground: '8a97a0' },
  { token: 'string', foreground: 'a60e3f' }, // HC: darker string
  { token: 'string.escape', foreground: 'a60e3f' },
  { token: 'regexp', foreground: '8c338b' },
  { token: 'number', foreground: '176245' }, // HC: darker numeric
  { token: 'number.float', foreground: '176245' },
  { token: 'number.hex', foreground: '176245' },
  { token: 'boolean', foreground: '8c338b' },
  { token: 'keyword', foreground: '00489d' }, // HC: stronger primary
  { token: 'keyword.control', foreground: '00489d' },
  { token: 'keyword.operator', foreground: '526069' },
  { token: 'operator', foreground: '00489d' },
  { token: 'delimiter', foreground: '526069' },
  { token: 'delimiter.bracket', foreground: '526069' },
  { token: 'delimiter.array', foreground: '526069' },
  { token: 'delimiter.parenthesis', foreground: '526069' },
  { token: 'type', foreground: '8c338b' },
  { token: 'type.identifier', foreground: '8c338b' },
  { token: 'class', foreground: '8c338b' },
  { token: 'class.identifier', foreground: '8c338b' },
  { token: 'function', foreground: '00489d' },
  { token: 'function.identifier', foreground: '00489d' },
  { token: 'variable', foreground: '374652' },
  { token: 'variable.predefined', foreground: '8c338b' },
  { token: 'constant', foreground: '8c338b' },
  { token: 'identifier', foreground: '374652' },
  { token: 'tag', foreground: '00489d' },
  { token: 'attribute.name', foreground: '00489d' },
  { token: 'attribute.value', foreground: 'a60e3f' },
  { token: 'metatag', foreground: '526069' },
] as const;

// ============================================================================
// Apollo Core Dark
// ============================================================================

export const apolloCoreDarkMonaco = {
  base: 'vs-dark' as const,
  inherit: false,
  rules: coreDarkRules,
  colors: {
    'editor.background': '#182027',
    'editor.foreground': '#cfd8dd',
    'editorLineNumber.foreground': '#526069',
    'editorLineNumber.activeForeground': '#8a97a0',
    'editor.selectionBackground': '#37465266',
    'editor.inactiveSelectionBackground': '#37465233',
    'editor.lineHighlightBackground': '#27313980',
    'editorCursor.foreground': '#66adff',
    'editorWhitespace.foreground': '#374652',
    'editorIndentGuide.background1': '#273139',
    'editorIndentGuide.activeBackground1': '#374652',
    'editorBracketMatch.background': '#66adff1a',
    'editorBracketMatch.border': '#66adff',
    'editor.findMatchBackground': '#6ecdb640',
    'editor.findMatchHighlightBackground': '#6ecdb620',
    'editorWidget.background': '#0f1922',
    'editorWidget.border': '#374652',
    'editorSuggestWidget.background': '#0f1922',
    'editorSuggestWidget.border': '#374652',
    'editorSuggestWidget.selectedBackground': '#273139',
    'editorHoverWidget.background': '#0f1922',
    'editorHoverWidget.border': '#374652',
    'scrollbarSlider.background': '#37465266',
    'scrollbarSlider.hoverBackground': '#52606980',
    'scrollbarSlider.activeBackground': '#8a97a080',
    focusBorder: '#66adff',
    'input.background': '#273139',
    'input.border': '#374652',
    'input.foreground': '#cfd8dd',
    'input.placeholderForeground': '#526069',
  },
};

// ============================================================================
// Apollo Core Light
// ============================================================================

export const apolloCoreLightMonaco = {
  base: 'vs' as const,
  inherit: false,
  rules: coreLightRules,
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#526069',
    'editorLineNumber.foreground': '#a4b1b8',
    'editorLineNumber.activeForeground': '#6b7882',
    'editor.selectionBackground': '#e9f1fa',
    'editor.inactiveSelectionBackground': '#e9f1fa80',
    'editor.lineHighlightBackground': '#f4f5f780',
    'editorCursor.foreground': '#0067df',
    'editorWhitespace.foreground': '#cfd8dd',
    'editorIndentGuide.background1': '#f4f5f7',
    'editorIndentGuide.activeBackground1': '#cfd8dd',
    'editorBracketMatch.background': '#0067df1a',
    'editorBracketMatch.border': '#0067df',
    'editor.findMatchBackground': '#1e7f5a40',
    'editor.findMatchHighlightBackground': '#1e7f5a20',
    'editorWidget.background': '#f4f5f7',
    'editorWidget.border': '#cfd8dd',
    'editorSuggestWidget.background': '#f4f5f7',
    'editorSuggestWidget.border': '#cfd8dd',
    'editorSuggestWidget.selectedBackground': '#e9f1fa',
    'editorHoverWidget.background': '#f4f5f7',
    'editorHoverWidget.border': '#cfd8dd',
    'scrollbarSlider.background': '#cfd8dd66',
    'scrollbarSlider.hoverBackground': '#a4b1b880',
    'scrollbarSlider.activeBackground': '#6b788280',
    focusBorder: '#0067df',
    'input.background': '#ffffff',
    'input.border': '#a4b1b8',
    'input.foreground': '#526069',
    'input.placeholderForeground': '#a4b1b8',
  },
};

// ============================================================================
// Apollo Core Dark High Contrast
// ============================================================================

export const apolloCoreDarkHCMonaco = {
  base: 'hc-black' as const,
  inherit: false,
  rules: coreDarkHCRules,
  colors: {
    'editor.background': '#182027',
    'editor.foreground': '#cfd8dd',
    'editorLineNumber.foreground': '#526069',
    'editorLineNumber.activeForeground': '#bbc7cd',
    'editor.selectionBackground': '#37465266',
    'editor.inactiveSelectionBackground': '#37465233',
    'editor.lineHighlightBackground': '#27313980',
    'editorCursor.foreground': '#badaff',
    'editorWhitespace.foreground': '#374652',
    'editorIndentGuide.background1': '#273139',
    'editorIndentGuide.activeBackground1': '#374652',
    'editorBracketMatch.background': '#badaff1a',
    'editorBracketMatch.border': '#badaff',
    'editor.findMatchBackground': '#6ecdb640',
    'editor.findMatchHighlightBackground': '#6ecdb620',
    'editorWidget.background': '#0f1922',
    'editorWidget.border': '#526069',
    'editorSuggestWidget.background': '#0f1922',
    'editorSuggestWidget.border': '#526069',
    'editorSuggestWidget.selectedBackground': '#273139',
    'editorHoverWidget.background': '#0f1922',
    'editorHoverWidget.border': '#526069',
    'scrollbarSlider.background': '#37465266',
    'scrollbarSlider.hoverBackground': '#52606980',
    'scrollbarSlider.activeBackground': '#8a97a080',
    focusBorder: '#badaff',
    'input.background': '#273139',
    'input.border': '#526069',
    'input.foreground': '#cfd8dd',
    'input.placeholderForeground': '#526069',
  },
};

// ============================================================================
// Apollo Core Light High Contrast
// ============================================================================

export const apolloCoreLightHCMonaco = {
  base: 'hc-light' as const,
  inherit: false,
  rules: coreLightHCRules,
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#374652',
    'editorLineNumber.foreground': '#8a97a0',
    'editorLineNumber.activeForeground': '#526069',
    'editor.selectionBackground': '#e9f1fa',
    'editor.inactiveSelectionBackground': '#e9f1fa80',
    'editor.lineHighlightBackground': '#f4f5f780',
    'editorCursor.foreground': '#00489d',
    'editorWhitespace.foreground': '#cfd8dd',
    'editorIndentGuide.background1': '#f4f5f7',
    'editorIndentGuide.activeBackground1': '#cfd8dd',
    'editorBracketMatch.background': '#00489d1a',
    'editorBracketMatch.border': '#00489d',
    'editor.findMatchBackground': '#17624540',
    'editor.findMatchHighlightBackground': '#17624520',
    'editorWidget.background': '#f4f5f7',
    'editorWidget.border': '#6b7882',
    'editorSuggestWidget.background': '#f4f5f7',
    'editorSuggestWidget.border': '#6b7882',
    'editorSuggestWidget.selectedBackground': '#e9f1fa',
    'editorHoverWidget.background': '#f4f5f7',
    'editorHoverWidget.border': '#6b7882',
    'scrollbarSlider.background': '#a4b1b866',
    'scrollbarSlider.hoverBackground': '#6b788280',
    'scrollbarSlider.activeBackground': '#52606980',
    focusBorder: '#00489d',
    'input.background': '#ffffff',
    'input.border': '#6b7882',
    'input.foreground': '#374652',
    'input.placeholderForeground': '#8a97a0',
  },
};
