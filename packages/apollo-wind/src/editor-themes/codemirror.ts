/**
 * Apollo CodeMirror v6 Theme Tokens — Future, Core, and Core HC variants.
 *
 * Plain color/style data objects for building CodeMirror v6 extensions.
 * This file has NO imports from `@codemirror/*` — consumers wire these
 * values into their own CodeMirror setup.
 *
 * -------------------------------------------------------------------------
 * Usage Example
 * -------------------------------------------------------------------------
 *
 * ```ts
 * import { EditorView } from '@codemirror/view';
 * import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
 * import { tags as t } from '@lezer/highlight';
 * import { apolloFutureDarkCodeMirror } from '@uipath/apollo-wind/editor-themes';
 *
 * const { syntax, ui } = apolloFutureDarkCodeMirror;
 *
 * // 1. Base editor theme (cursor, selection, gutter, etc.)
 * const apolloFutureDarkTheme = EditorView.theme(
 *   {
 *     '&': {
 *       backgroundColor: ui.background,
 *       color: ui.foreground,
 *     },
 *     '.cm-cursor': { borderLeftColor: ui.cursor },
 *     '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
 *       backgroundColor: ui.selection,
 *     },
 *     '.cm-activeLine': { backgroundColor: ui.lineHighlight },
 *     '.cm-gutters': {
 *       backgroundColor: ui.background,
 *       borderRight: 'none',
 *     },
 *     '.cm-lineNumbers .cm-gutterElement': { color: ui.lineNumber },
 *     '.cm-activeLineGutter': { color: ui.lineNumberActive },
 *     '.cm-indentationMark': { borderLeft: `1px solid ${ui.indentGuide}` },
 *     '.cm-matchingBracket': { outline: `1px solid ${ui.matchingBracket}` },
 *   },
 *   { dark: true },
 * );
 *
 * // 2. Syntax highlight style
 * const apolloFutureDarkHighlight = HighlightStyle.define([
 *   { tag: t.comment,                  color: syntax.comment,     fontStyle: 'italic' },
 *   { tag: t.punctuation,              color: syntax.punctuation },
 *   { tag: [t.keyword, t.operator],    color: syntax.keyword },
 *   { tag: [t.string, t.regexp],       color: syntax.string },
 *   { tag: [t.number, t.integer],      color: syntax.number },
 *   { tag: [t.bool, t.null, t.className, t.typeName], color: syntax.literal },
 *   { tag: [t.propertyName, t.attributeName], color: syntax.keyword },
 *   { tag: t.meta,                     color: syntax.meta },
 *   { tag: t.name,                     color: syntax.rest },
 * ]);
 *
 * // 3. Combine into a single extension array
 * export const apolloFutureDark = [
 *   apolloFutureDarkTheme,
 *   syntaxHighlighting(apolloFutureDarkHighlight),
 * ];
 * ```
 *
 * Swap `apolloFutureDarkCodeMirror` for `apolloFutureLightCodeMirror` and
 * pass `{ dark: false }` to `EditorView.theme` to get the light variant.
 */

// =============================================================================
// Type
// =============================================================================

export interface CodeMirrorSyntaxTokens {
  /** Default text — unclassified identifiers, names */
  rest: string;
  /** Source comments */
  comment: string;
  /** Punctuation — brackets, delimiters, operators */
  punctuation: string;
  /** Language keywords (`if`, `return`, `const`, …) */
  keyword: string;
  /** String and template literals */
  string: string;
  /** Numeric literals */
  number: string;
  /** Booleans, `null`, `undefined`, class names, type names */
  literal: string;
  /** Operator symbols (`+`, `=>`, `&&`, …) — shares keyword color */
  operator: string;
  /** Directives, annotations, preprocessor meta */
  meta: string;
}

export interface CodeMirrorUiTokens {
  /** Editor panel background */
  background: string;
  /** Default text color */
  foreground: string;
  /** Text-insertion cursor */
  cursor: string;
  /** Selection highlight (semi-transparent) */
  selection: string;
  /** Active line background (semi-transparent) */
  lineHighlight: string;
  /** Gutter line number color */
  lineNumber: string;
  /** Gutter line number color for the active line */
  lineNumberActive: string;
  /** Indentation guide line color */
  indentGuide: string;
  /** Matching bracket outline */
  matchingBracket: string;
}

export interface ApolloCodeMirrorTheme {
  syntax: CodeMirrorSyntaxTokens;
  ui: CodeMirrorUiTokens;
}

// =============================================================================
// Apollo Future — Dark
// =============================================================================

/**
 * Apollo Future dark theme tokens for CodeMirror v6.
 *
 * Base palette: zinc-900 surfaces, cyan accent, muted zinc foregrounds.
 * Syntax colors follow the `--code-*` custom properties from the design system.
 */
export const apolloFutureDarkCodeMirror: ApolloCodeMirrorTheme = {
  syntax: {
    // --code-rest: zinc-400
    rest: '#a1a1aa',
    // comment: more muted than rest — zinc-600
    comment: '#52525b',
    // --code-punctuation: zinc-500
    punctuation: '#71717a',
    // --code-key (keywords/props): cyan-400
    keyword: '#22d3ee',
    // --code-string: emerald-400
    string: '#34d399',
    // --code-number: amber-400
    number: '#fbbf24',
    // --code-literal (booleans/null/class): violet-400
    literal: '#a78bfa',
    // operators share the keyword color (cyan-400)
    operator: '#22d3ee',
    // meta/directives: slightly muted — zinc-500
    meta: '#71717a',
  },
  ui: {
    // zinc-900
    background: '#18181b',
    // zinc-400 — matches --code-rest for default prose
    foreground: '#a1a1aa',
    // cyan-400
    cursor: '#22d3ee',
    // zinc-700 @ 40% opacity
    selection: '#3f3f4666',
    // zinc-800 @ 50% opacity
    lineHighlight: '#27272a80',
    // zinc-600
    lineNumber: '#52525b',
    // zinc-400
    lineNumberActive: '#a1a1aa',
    // zinc-700
    indentGuide: '#3f3f46',
    // cyan-400 (re-uses cursor color for bracket pairing)
    matchingBracket: '#22d3ee',
  },
};

// =============================================================================
// Apollo Future — Light
// =============================================================================

/**
 * Apollo Future light theme tokens for CodeMirror v6.
 *
 * Base palette: zinc-100 surfaces, cyan-700 accent, muted zinc foregrounds.
 * Syntax colors follow the `--code-*` custom properties from the design system.
 */
export const apolloFutureLightCodeMirror: ApolloCodeMirrorTheme = {
  syntax: {
    // --code-rest: zinc-600
    rest: '#52525b',
    // comment: more muted than rest — zinc-400
    comment: '#a1a1aa',
    // --code-punctuation: zinc-500
    punctuation: '#71717a',
    // --code-key (keywords/props): cyan-700
    keyword: '#0e7490',
    // --code-string: emerald-700
    string: '#047857',
    // --code-number: amber-700
    number: '#b45309',
    // --code-literal (booleans/null/class): violet-600
    literal: '#7c3aed',
    // operators share the keyword color (cyan-700)
    operator: '#0e7490',
    // meta/directives: slightly muted — zinc-500
    meta: '#71717a',
  },
  ui: {
    // zinc-100
    background: '#f4f4f5',
    // zinc-600 — matches --code-rest for default prose
    foreground: '#52525b',
    // cyan-600
    cursor: '#0891b2',
    // zinc-300 @ 40% opacity
    selection: '#d4d4d866',
    // zinc-200 @ 50% opacity
    lineHighlight: '#e4e4e780',
    // zinc-400
    lineNumber: '#a1a1aa',
    // zinc-500
    lineNumberActive: '#71717a',
    // zinc-300
    indentGuide: '#d4d4d8',
    // cyan-600 (re-uses cursor color for bracket pairing)
    matchingBracket: '#0891b2',
  },
};

// =============================================================================
// Apollo Core — Dark
// =============================================================================

export const apolloCoreDarkCodeMirror: ApolloCodeMirrorTheme = {
  syntax: {
    rest: '#cfd8dd',
    comment: '#526069',
    punctuation: '#8a97a0',
    keyword: '#66adff',
    string: '#f25a8c',
    number: '#6ecdb6',
    literal: '#dc80db',
    operator: '#66adff',
    meta: '#8a97a0',
  },
  ui: {
    background: '#182027',
    foreground: '#cfd8dd',
    cursor: '#66adff',
    selection: '#37465266',
    lineHighlight: '#27313980',
    lineNumber: '#526069',
    lineNumberActive: '#8a97a0',
    indentGuide: '#374652',
    matchingBracket: '#66adff',
  },
};

// =============================================================================
// Apollo Core — Light
// =============================================================================

export const apolloCoreLightCodeMirror: ApolloCodeMirrorTheme = {
  syntax: {
    rest: '#526069',
    comment: '#a4b1b8',
    punctuation: '#6b7882',
    keyword: '#0067df',
    string: '#d91153',
    number: '#1e7f5a',
    literal: '#b748b6',
    operator: '#0067df',
    meta: '#6b7882',
  },
  ui: {
    background: '#ffffff',
    foreground: '#526069',
    cursor: '#0067df',
    selection: '#e9f1fa',
    lineHighlight: '#f4f5f780',
    lineNumber: '#a4b1b8',
    lineNumberActive: '#6b7882',
    indentGuide: '#cfd8dd',
    matchingBracket: '#0067df',
  },
};

// =============================================================================
// Apollo Core — Dark High Contrast
// =============================================================================

export const apolloCoreDarkHCCodeMirror: ApolloCodeMirrorTheme = {
  syntax: {
    rest: '#cfd8dd',
    comment: '#526069',
    punctuation: '#8a97a0',
    keyword: '#badaff', // HC: brighter primary
    string: '#fd7da7', // HC: higher contrast pink
    number: '#6ecdb6',
    literal: '#dc80db',
    operator: '#badaff',
    meta: '#8a97a0',
  },
  ui: {
    background: '#182027',
    foreground: '#cfd8dd',
    cursor: '#badaff',
    selection: '#37465266',
    lineHighlight: '#27313980',
    lineNumber: '#526069',
    lineNumberActive: '#bbc7cd',
    indentGuide: '#374652',
    matchingBracket: '#badaff',
  },
};

// =============================================================================
// Apollo Core — Light High Contrast
// =============================================================================

export const apolloCoreLightHCCodeMirror: ApolloCodeMirrorTheme = {
  syntax: {
    rest: '#374652', // HC: stronger default text
    comment: '#8a97a0',
    punctuation: '#526069',
    keyword: '#00489d', // HC: stronger primary
    string: '#a60e3f', // HC: darker string
    number: '#176245', // HC: darker numeric
    literal: '#8c338b', // HC: darker purple
    operator: '#00489d',
    meta: '#526069',
  },
  ui: {
    background: '#ffffff',
    foreground: '#374652',
    cursor: '#00489d',
    selection: '#e9f1fa',
    lineHighlight: '#f4f5f780',
    lineNumber: '#8a97a0',
    lineNumberActive: '#526069',
    indentGuide: '#cfd8dd',
    matchingBracket: '#00489d',
  },
};
