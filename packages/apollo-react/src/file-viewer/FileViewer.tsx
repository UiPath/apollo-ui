import { CodeBlock, cn, type MarkdownImagePolicy, type MarkdownStrings } from '@uipath/apollo-wind';

import { type DiffLayout, DiffEditor } from './DiffEditor';
import { type FileLanguage, hasRenderedView, languageForPath } from './fileLanguage';
import { MarkdownView } from './MarkdownView';
import { SourceEditor } from './SourceEditor';
import type { FileViewerTheme } from './useApolloMonacoTheme';
import { type LoadMonaco, useMonaco } from './useMonaco';

/** What the viewer shows. The host owns the choice (its toggle) and the text of each side. */
export type FileViewerView =
  | { kind: 'rendered' }
  | { kind: 'source'; onChange?: (content: string) => void }
  | { kind: 'changes'; baseContent: string; layout: DiffLayout };

/** Every string the viewer shows. It ships no English: the host passes its own translations. */
export interface FileViewerLabels {
  /** Shown while Monaco loads for the changes view. */
  loading: string;
  /** Shown when Monaco fails to load for the changes view. */
  loadFailed: string;
  /** The rendered markdown's and code blocks' strings (copy, copied, footnotes...). */
  markdown?: Partial<MarkdownStrings>;
}

export interface FileViewerProps {
  /** The file's path or name; its extension picks the language. */
  path: string;
  content: string;
  view: FileViewerView;
  loadMonaco: LoadMonaco;
  theme: FileViewerTheme;
  labels: FileViewerLabels;
  /** Which images in rendered markdown load. Defaults to none, as in `Markdown`. */
  images?: MarkdownImagePolicy;
  className?: string;
}

/**
 * One file in one of three views: rendered (markdown), source (Monaco, editable with `onChange`)
 * or changes (Monaco's diff against `baseContent`). Files without a rendered view show their
 * source, read-only. Monaco loads only when a source or changes view first needs it.
 */
export function FileViewer({
  path,
  content,
  view,
  loadMonaco,
  theme,
  labels,
  images = 'none',
  className,
}: FileViewerProps) {
  const language = languageForPath(path);
  const showsRendered = view.kind === 'rendered' && hasRenderedView(path);

  return (
    <div className={cn('h-full min-h-0 w-full bg-background text-foreground', className)}>
      {showsRendered ? (
        <MarkdownView content={content} images={images} strings={labels.markdown} />
      ) : (
        <MonacoView
          key={path}
          content={content}
          view={view}
          language={language}
          loadMonaco={loadMonaco}
          theme={theme}
          labels={labels}
        />
      )}
    </div>
  );
}

interface MonacoViewProps {
  content: string;
  view: FileViewerView;
  language: FileLanguage;
  loadMonaco: LoadMonaco;
  theme: FileViewerTheme;
  labels: FileViewerLabels;
}

function MonacoView({ content, view, language, loadMonaco, theme, labels }: MonacoViewProps) {
  const monaco = useMonaco(loadMonaco);

  if (view.kind === 'changes') {
    if (monaco.kind !== 'ready') {
      const notice = monaco.kind === 'loading' ? labels.loading : labels.loadFailed;
      return <p className="m-0 p-6 text-sm text-foreground-de-emp">{notice}</p>;
    }
    return (
      <DiffEditor
        monaco={monaco.monaco}
        baseContent={view.baseContent}
        content={content}
        language={language.monaco}
        theme={theme}
        layout={view.layout}
      />
    );
  }

  // Until Monaco is in (or when it never comes), the highlighted text reads the same.
  if (monaco.kind !== 'ready') {
    return (
      <div className="h-full min-h-0 overflow-auto" data-testid="file-viewer-source-fallback">
        <CodeBlock
          code={content}
          language={language.prism}
          showLineNumbers
          hideHeader
          strings={labels.markdown}
        />
      </div>
    );
  }

  const onChange = view.kind === 'source' ? view.onChange : undefined;
  return (
    <SourceEditor
      monaco={monaco.monaco}
      content={content}
      language={language.monaco}
      theme={theme}
      onChange={onChange}
    />
  );
}
