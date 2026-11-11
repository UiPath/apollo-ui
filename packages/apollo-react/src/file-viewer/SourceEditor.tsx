import type * as Monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

import { SHARED_EDITOR_OPTIONS } from './editorOptions';
import {
  type FileViewerTheme,
  MONACO_THEME_NAME,
  useApolloMonacoTheme,
} from './useApolloMonacoTheme';
import type { MonacoApi } from './useMonaco';

export interface SourceEditorProps {
  monaco: MonacoApi;
  content: string;
  language: string;
  theme: FileViewerTheme;
  /** Makes the source editable; without it the editor is read-only. */
  onChange?: (content: string) => void;
}

export function SourceEditor({ monaco, content, language, theme, onChange }: SourceEditorProps) {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const latest = useRef({ content, language, theme, onChange });
  latest.current = { content, language, theme, onChange };
  const isReadOnly = onChange === undefined;

  useApolloMonacoTheme(monaco, theme);

  useEffect(() => {
    if (!container.current) {
      return;
    }
    const {
      content: initialContent,
      language: initialLanguage,
      theme: initialTheme,
    } = latest.current;
    const created = monaco.editor.create(container.current, {
      ...SHARED_EDITOR_OPTIONS,
      value: initialContent,
      language: initialLanguage,
      theme: MONACO_THEME_NAME[initialTheme],
    });
    const edits = created.onDidChangeModelContent(() =>
      latest.current.onChange?.(created.getValue())
    );
    editor.current = created;
    return () => {
      edits.dispose();
      created.getModel()?.dispose();
      created.dispose();
      editor.current = null;
    };
  }, [monaco]);

  useEffect(() => {
    editor.current?.updateOptions({ readOnly: isReadOnly });
  }, [isReadOnly]);

  useEffect(() => {
    const model = editor.current?.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [monaco, language]);

  // The host replaced the text (a reload, a revert): show it. Echoes of the user's own typing match and are skipped.
  useEffect(() => {
    const isOutdated = editor.current !== null && editor.current.getValue() !== content;
    if (isOutdated) {
      editor.current?.setValue(content);
    }
  }, [content]);

  return <div ref={container} className="h-full min-h-0 w-full" data-testid="file-viewer-source" />;
}
