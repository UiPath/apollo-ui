import type * as Monaco from 'monaco-editor';

/** Options both the source editor and the diff editor share: a document view, not an IDE. */
export const SHARED_EDITOR_OPTIONS = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  fontSize: 13,
  renderLineHighlight: 'none',
} as const satisfies Monaco.editor.IEditorOptions;
