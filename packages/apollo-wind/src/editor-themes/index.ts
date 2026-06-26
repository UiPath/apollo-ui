/**
 * Apollo editor theme adapters — Future, Core, and Core HC variants.
 *
 * These are pure data exports — no Monaco or CodeMirror imports required.
 * Pass them directly into your editor's theme registration API.
 *
 * @example Monaco
 * ```ts
 * import * as monaco from 'monaco-editor';
 * import { apolloFutureDarkMonaco } from '@uipath/apollo-wind/editor-themes';
 * monaco.editor.defineTheme('apollo-future-dark', apolloFutureDarkMonaco);
 * ```
 *
 * @example CodeMirror v6
 * ```ts
 * import { apolloFutureDarkCodeMirror } from '@uipath/apollo-wind/editor-themes';
 * // Use apolloFutureDarkCodeMirror.syntax and apolloFutureDarkCodeMirror.ui
 * // to build your HighlightStyle + EditorView.theme extensions.
 * ```
 */

export type {
  ApolloCodeMirrorTheme,
  CodeMirrorSyntaxTokens,
  CodeMirrorUiTokens,
} from './codemirror';
export {
  apolloCoreDarkCodeMirror,
  apolloCoreDarkHCCodeMirror,
  apolloCoreLightCodeMirror,
  apolloCoreLightHCCodeMirror,
  apolloFutureDarkCodeMirror,
  apolloFutureLightCodeMirror,
} from './codemirror';
export {
  apolloCoreDarkHCMonaco,
  apolloCoreDarkMonaco,
  apolloCoreLightHCMonaco,
  apolloCoreLightMonaco,
  apolloFutureDarkMonaco,
  apolloFutureLightMonaco,
} from './monaco';
