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
  { token: '', foreground: '9f9fa9' }, // zinc-400  --code-rest
  { token: 'comment', foreground: '52525c' }, // zinc-600  comment (muted)
  { token: 'comment.doc', foreground: '52525c' },
  { token: 'string', foreground: '00d492' }, // emerald-400  --code-string
  { token: 'string.escape', foreground: '00d492' },
  { token: 'regexp', foreground: 'a684ff' }, // violet-400  --code-literal
  { token: 'number', foreground: 'ffb900' }, // amber-400  --code-number
  { token: 'number.float', foreground: 'ffb900' },
  { token: 'number.hex', foreground: 'ffb900' },
  { token: 'boolean', foreground: 'a684ff' }, // violet-400  --code-literal
  { token: 'keyword', foreground: '00d3f2' }, // cyan-400  --code-key
  { token: 'keyword.control', foreground: '00d3f2' },
  { token: 'keyword.operator', foreground: '71717b' }, // zinc-500  --code-punctuation
  { token: 'operator', foreground: '71717b' }, // zinc-500  --code-punctuation
  { token: 'delimiter', foreground: '71717b' },
  { token: 'delimiter.bracket', foreground: '71717b' },
  { token: 'delimiter.array', foreground: '71717b' },
  { token: 'delimiter.parenthesis', foreground: '71717b' },
  { token: 'type', foreground: 'a684ff' }, // violet-400  --code-literal
  { token: 'type.identifier', foreground: 'a684ff' },
  { token: 'class', foreground: 'a684ff' },
  { token: 'class.identifier', foreground: 'a684ff' },
  { token: 'function', foreground: '00d3f2' }, // cyan-400  --code-key
  { token: 'function.identifier', foreground: '00d3f2' },
  { token: 'variable', foreground: '9f9fa9' }, // zinc-400  --code-rest
  { token: 'variable.predefined', foreground: 'a684ff' },
  { token: 'constant', foreground: 'a684ff' }, // violet-400  --code-literal
  { token: 'identifier', foreground: '9f9fa9' }, // zinc-400  --code-rest
  { token: 'tag', foreground: '00d3f2' },
  { token: 'attribute.name', foreground: '00d3f2' },
  { token: 'attribute.value', foreground: '00d492' },
  { token: 'metatag', foreground: '71717b' },
] as const;

/** Token color rules — light variant */
const lightRules = [
  { token: '', foreground: '52525c' }, // zinc-600  --code-rest
  { token: 'comment', foreground: '9f9fa9' }, // zinc-400  comment (muted)
  { token: 'comment.doc', foreground: '9f9fa9' },
  { token: 'string', foreground: '007a55' }, // emerald-700  --code-string
  { token: 'string.escape', foreground: '007a55' },
  { token: 'regexp', foreground: '7f22fe' }, // violet-600  --code-literal
  { token: 'number', foreground: 'bb4d00' }, // amber-700  --code-number
  { token: 'number.float', foreground: 'bb4d00' },
  { token: 'number.hex', foreground: 'bb4d00' },
  { token: 'boolean', foreground: '7f22fe' }, // violet-600  --code-literal
  { token: 'keyword', foreground: '007595' }, // cyan-700  --code-key
  { token: 'keyword.control', foreground: '007595' },
  { token: 'keyword.operator', foreground: '71717b' }, // zinc-500  --code-punctuation
  { token: 'operator', foreground: '71717b' }, // zinc-500  --code-punctuation
  { token: 'delimiter', foreground: '71717b' },
  { token: 'delimiter.bracket', foreground: '71717b' },
  { token: 'delimiter.array', foreground: '71717b' },
  { token: 'delimiter.parenthesis', foreground: '71717b' },
  { token: 'type', foreground: '7f22fe' }, // violet-600  --code-literal
  { token: 'type.identifier', foreground: '7f22fe' },
  { token: 'class', foreground: '7f22fe' },
  { token: 'class.identifier', foreground: '7f22fe' },
  { token: 'function', foreground: '007595' }, // cyan-700  --code-key
  { token: 'function.identifier', foreground: '007595' },
  { token: 'variable', foreground: '52525c' }, // zinc-600  --code-rest
  { token: 'variable.predefined', foreground: '7f22fe' },
  { token: 'constant', foreground: '7f22fe' }, // violet-600  --code-literal
  { token: 'identifier', foreground: '52525c' }, // zinc-600  --code-rest
  { token: 'tag', foreground: '007595' },
  { token: 'attribute.name', foreground: '007595' },
  { token: 'attribute.value', foreground: '007a55' },
  { token: 'metatag', foreground: '71717b' },
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
    'editor.background': '#27272a', // zinc-800  surface-overlay
    'editor.foreground': '#9f9fa9', // zinc-400  --code-rest
    'editorLineNumber.foreground': '#52525c', // zinc-600  comment level
    'editorLineNumber.activeForeground': '#9f9fa9', // zinc-400
    'editor.selectionBackground': '#3f3f4666', // zinc-700 @ 40%
    'editor.inactiveSelectionBackground': '#3f3f4633', // zinc-700 @ 20%
    'editor.lineHighlightBackground': '#27272a80', // zinc-800 @ 50%
    'editorCursor.foreground': '#00d3f2', // cyan-400  brand
    'editorWhitespace.foreground': '#3f3f46', // zinc-700
    'editorIndentGuide.background1': '#27272a', // zinc-800
    'editorIndentGuide.activeBackground1': '#3f3f46', // zinc-700
    'editorBracketMatch.background': '#00d3f21a', // cyan-400 @ 10%
    'editorBracketMatch.border': '#00d3f2', // cyan-400
    'editorBracketHighlight.foreground1': '#71717b', // zinc-500  --code-punctuation (matches CodeMirror)
    'editorBracketHighlight.foreground2': '#71717b',
    'editorBracketHighlight.foreground3': '#71717b',
    'editorBracketHighlight.foreground4': '#71717b',
    'editorBracketHighlight.foreground5': '#71717b',
    'editorBracketHighlight.foreground6': '#71717b',
    'editorBracketHighlight.unexpectedBracket.foreground': '#ff8484', // error-text
    'editor.findMatchBackground': '#ffb90040', // amber-400 @ 25%
    'editor.findMatchHighlightBackground': '#ffb90020',
    'editorWidget.background': '#27272a', // zinc-800  surface-overlay
    'editorWidget.border': '#3f3f46', // zinc-700
    'editorSuggestWidget.background': '#27272a', // zinc-800  surface-overlay
    'editorSuggestWidget.border': '#3f3f46',
    'editorSuggestWidget.selectedBackground': '#3f3f46', // zinc-700  background-selected
    'editorSuggestWidget.foreground': '#9f9fa9', // zinc-400  --code-rest
    'editorSuggestWidget.selectedForeground': '#fafafa', // zinc-50  foreground
    'editorSuggestWidget.highlightForeground': '#00d3f2', // cyan-400  brand
    'editorSuggestWidget.focusHighlightForeground': '#00d3f2',
    'editorHoverWidget.background': '#27272a', // zinc-800  surface-overlay
    'editorHoverWidget.border': '#3f3f46',
    'scrollbarSlider.background': '#3f3f4666',
    'scrollbarSlider.hoverBackground': '#52525c80',
    'scrollbarSlider.activeBackground': '#71717b80',
    focusBorder: '#00d3f2',
    'input.background': '#27272a',
    'input.border': '#3f3f46',
    'input.foreground': '#9f9fa9',
    'input.placeholderForeground': '#52525c',
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
    'editor.background': '#ffffff', // white  surface-overlay
    'editor.foreground': '#52525c', // zinc-600  --code-rest
    'editorLineNumber.foreground': '#9f9fa9', // zinc-400  comment level
    'editorLineNumber.activeForeground': '#71717b', // zinc-500
    'editor.selectionBackground': '#d4d4d866', // zinc-300 @ 40%
    'editor.inactiveSelectionBackground': '#d4d4d833', // zinc-300 @ 20%
    'editor.lineHighlightBackground': '#e4e4e780', // zinc-200 @ 50%
    'editorCursor.foreground': '#0092b8', // cyan-600  brand
    'editorWhitespace.foreground': '#d4d4d8', // zinc-300
    'editorIndentGuide.background1': '#e4e4e7', // zinc-200
    'editorIndentGuide.activeBackground1': '#d4d4d8', // zinc-300
    'editorBracketMatch.background': '#0092b81a', // cyan-600 @ 10%
    'editorBracketMatch.border': '#0092b8', // cyan-600
    'editorBracketHighlight.foreground1': '#71717b', // zinc-500  --code-punctuation (matches CodeMirror)
    'editorBracketHighlight.foreground2': '#71717b',
    'editorBracketHighlight.foreground3': '#71717b',
    'editorBracketHighlight.foreground4': '#71717b',
    'editorBracketHighlight.foreground5': '#71717b',
    'editorBracketHighlight.foreground6': '#71717b',
    'editorBracketHighlight.unexpectedBracket.foreground': '#a6040a', // error-text
    'editor.findMatchBackground': '#bb4d0040', // amber-700 @ 25%
    'editor.findMatchHighlightBackground': '#bb4d0020',
    'editorWidget.background': '#ffffff', // white  surface-overlay
    'editorWidget.border': '#d4d4d8', // zinc-300
    'editorSuggestWidget.background': '#ffffff', // white  surface-overlay
    'editorSuggestWidget.border': '#d4d4d8',
    'editorSuggestWidget.selectedBackground': '#e4e4e7', // zinc-200  background-selected
    'editorSuggestWidget.foreground': '#52525c', // zinc-600  --code-rest
    'editorSuggestWidget.selectedForeground': '#09090b', // zinc-950  foreground
    'editorSuggestWidget.highlightForeground': '#0092b8', // cyan-600  brand
    'editorSuggestWidget.focusHighlightForeground': '#0092b8',
    'editorHoverWidget.background': '#ffffff', // white  surface-overlay
    'editorHoverWidget.border': '#d4d4d8',
    'scrollbarSlider.background': '#d4d4d866',
    'scrollbarSlider.hoverBackground': '#9f9fa980',
    'scrollbarSlider.activeBackground': '#71717b80',
    focusBorder: '#0092b8',
    'input.background': '#ffffff',
    'input.border': '#d4d4d8',
    'input.foreground': '#52525c',
    'input.placeholderForeground': '#9f9fa9',
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
    'editorBracketHighlight.foreground1': '#8a97a0', // punctuation (matches CodeMirror)
    'editorBracketHighlight.foreground2': '#8a97a0',
    'editorBracketHighlight.foreground3': '#8a97a0',
    'editorBracketHighlight.foreground4': '#8a97a0',
    'editorBracketHighlight.foreground5': '#8a97a0',
    'editorBracketHighlight.foreground6': '#8a97a0',
    'editorBracketHighlight.unexpectedBracket.foreground': '#ff8484',
    'editor.findMatchBackground': '#6ecdb640',
    'editor.findMatchHighlightBackground': '#6ecdb620',
    'editorWidget.background': '#0f1922',
    'editorWidget.border': '#374652',
    'editorSuggestWidget.background': '#0f1922',
    'editorSuggestWidget.border': '#374652',
    'editorSuggestWidget.selectedBackground': '#273139',
    'editorSuggestWidget.foreground': '#cfd8dd',
    'editorSuggestWidget.selectedForeground': '#f4f5f7',
    'editorSuggestWidget.highlightForeground': '#66adff',
    'editorSuggestWidget.focusHighlightForeground': '#66adff',
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
    'editorBracketHighlight.foreground1': '#6b7882', // punctuation (matches CodeMirror)
    'editorBracketHighlight.foreground2': '#6b7882',
    'editorBracketHighlight.foreground3': '#6b7882',
    'editorBracketHighlight.foreground4': '#6b7882',
    'editorBracketHighlight.foreground5': '#6b7882',
    'editorBracketHighlight.foreground6': '#6b7882',
    'editorBracketHighlight.unexpectedBracket.foreground': '#a6040a',
    'editor.findMatchBackground': '#1e7f5a40',
    'editor.findMatchHighlightBackground': '#1e7f5a20',
    'editorWidget.background': '#f4f5f7',
    'editorWidget.border': '#cfd8dd',
    'editorSuggestWidget.background': '#f4f5f7',
    'editorSuggestWidget.border': '#cfd8dd',
    'editorSuggestWidget.selectedBackground': '#e9f1fa',
    'editorSuggestWidget.foreground': '#526069',
    'editorSuggestWidget.selectedForeground': '#273139',
    'editorSuggestWidget.highlightForeground': '#0067df',
    'editorSuggestWidget.focusHighlightForeground': '#0067df',
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
    'editorBracketHighlight.foreground1': '#8a97a0', // punctuation (matches CodeMirror)
    'editorBracketHighlight.foreground2': '#8a97a0',
    'editorBracketHighlight.foreground3': '#8a97a0',
    'editorBracketHighlight.foreground4': '#8a97a0',
    'editorBracketHighlight.foreground5': '#8a97a0',
    'editorBracketHighlight.foreground6': '#8a97a0',
    'editorBracketHighlight.unexpectedBracket.foreground': '#ffadad',
    'editor.findMatchBackground': '#6ecdb640',
    'editor.findMatchHighlightBackground': '#6ecdb620',
    'editorWidget.background': '#0f1922',
    'editorWidget.border': '#526069',
    'editorSuggestWidget.background': '#0f1922',
    'editorSuggestWidget.border': '#526069',
    'editorSuggestWidget.selectedBackground': '#273139',
    'editorSuggestWidget.foreground': '#cfd8dd',
    'editorSuggestWidget.selectedForeground': '#f4f5f7',
    'editorSuggestWidget.highlightForeground': '#badaff',
    'editorSuggestWidget.focusHighlightForeground': '#badaff',
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
    'editorBracketHighlight.foreground1': '#526069', // punctuation (matches CodeMirror)
    'editorBracketHighlight.foreground2': '#526069',
    'editorBracketHighlight.foreground3': '#526069',
    'editorBracketHighlight.foreground4': '#526069',
    'editorBracketHighlight.foreground5': '#526069',
    'editorBracketHighlight.foreground6': '#526069',
    'editorBracketHighlight.unexpectedBracket.foreground': '#a6040a',
    'editor.findMatchBackground': '#17624540',
    'editor.findMatchHighlightBackground': '#17624520',
    'editorWidget.background': '#f4f5f7',
    'editorWidget.border': '#6b7882',
    'editorSuggestWidget.background': '#f4f5f7',
    'editorSuggestWidget.border': '#6b7882',
    'editorSuggestWidget.selectedBackground': '#e9f1fa',
    'editorSuggestWidget.foreground': '#374652',
    'editorSuggestWidget.selectedForeground': '#273139',
    'editorSuggestWidget.highlightForeground': '#00489d',
    'editorSuggestWidget.focusHighlightForeground': '#00489d',
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
