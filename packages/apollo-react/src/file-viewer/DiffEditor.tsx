import { useEffect, useRef } from 'react';

import { SHARED_EDITOR_OPTIONS } from './editorOptions';
import {
  type FileViewerTheme,
  MONACO_THEME_NAME,
  useApolloMonacoTheme,
} from './useApolloMonacoTheme';
import type { MonacoApi } from './useMonaco';

export type DiffLayout = 'side-by-side' | 'inline';

export interface DiffEditorProps {
  monaco: MonacoApi;
  /** The text before the change. */
  baseContent: string;
  /** The text after the change. */
  content: string;
  language: string;
  theme: FileViewerTheme;
  layout: DiffLayout;
}

export function DiffEditor({
  monaco,
  baseContent,
  content,
  language,
  theme,
  layout,
}: DiffEditorProps) {
  const container = useRef<HTMLDivElement>(null);
  const latestTheme = useRef(theme);
  latestTheme.current = theme;

  useApolloMonacoTheme(monaco, theme);

  // A read-only diff has no state worth keeping, so any change of input builds it again.
  useEffect(() => {
    if (!container.current) {
      return;
    }
    const original = monaco.editor.createModel(baseContent, language);
    const modified = monaco.editor.createModel(content, language);
    const diff = monaco.editor.createDiffEditor(container.current, {
      ...SHARED_EDITOR_OPTIONS,
      readOnly: true,
      originalEditable: false,
      renderSideBySide: layout === 'side-by-side',
      theme: MONACO_THEME_NAME[latestTheme.current],
    });
    diff.setModel({ original, modified });
    return () => {
      diff.dispose();
      original.dispose();
      modified.dispose();
    };
  }, [monaco, baseContent, content, language, layout]);

  return (
    <div ref={container} className="h-full min-h-0 w-full" data-testid="file-viewer-changes" />
  );
}
