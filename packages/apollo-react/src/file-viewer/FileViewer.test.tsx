import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileViewer, type FileViewerLabels, type FileViewerView } from './FileViewer';
import type { LoadMonaco, MonacoApi } from './useMonaco';

const LABELS: FileViewerLabels = { loading: 'Loading editor', loadFailed: 'Editor unavailable' };

const MARKDOWN = '---\nfriendly_name: Overview\n---\n\n# Purchase order creation\n\nBody text';

function fakeMonaco() {
  let value = '';
  let contentListener: (() => void) | undefined;
  const model = { dispose: vi.fn() };
  const editor = {
    getValue: vi.fn(() => value),
    setValue: vi.fn((next: string) => {
      value = next;
    }),
    getModel: vi.fn(() => model),
    updateOptions: vi.fn(),
    onDidChangeModelContent: vi.fn((listener: () => void) => {
      contentListener = listener;
      return { dispose: vi.fn() };
    }),
    dispose: vi.fn(),
  };
  const diff = { setModel: vi.fn(), dispose: vi.fn() };
  const monaco = {
    editor: {
      create: vi.fn((_: HTMLElement, options: { value: string }) => {
        value = options.value;
        return editor;
      }),
      createDiffEditor: vi.fn(() => diff),
      createModel: vi.fn((text: string, language: string) => ({
        text,
        language,
        dispose: vi.fn(),
      })),
      defineTheme: vi.fn(),
      setTheme: vi.fn(),
      setModelLanguage: vi.fn(),
    },
  };
  const type = (next: string) => {
    value = next;
    contentListener?.();
  };
  return {
    monaco,
    editor,
    diff,
    type,
    load: (() => Promise.resolve(monaco as unknown as MonacoApi)) as LoadMonaco,
  };
}

function renderViewer(path: string, view: FileViewerView, load: LoadMonaco, content = MARKDOWN) {
  return render(
    <FileViewer
      path={path}
      content={content}
      view={view}
      loadMonaco={load}
      theme="light"
      labels={LABELS}
    />
  );
}

describe('FileViewer', () => {
  it('renders markdown with its frontmatter apart and never loads Monaco', () => {
    const load = vi.fn<LoadMonaco>();

    renderViewer('wiki/as-is/overview.md', { kind: 'rendered' }, load);

    expect(screen.getByRole('heading', { name: 'Purchase order creation' })).toBeInTheDocument();
    expect(screen.getByTestId('file-viewer-rendered')).toHaveTextContent('friendly_name: Overview');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();
  });

  it('shows a file without a rendered view as read-only source', async () => {
    const { monaco, editor, load } = fakeMonaco();

    renderViewer('wiki/map.yaml', { kind: 'rendered' }, load, 'version: 2');
    await act(() => Promise.resolve());

    expect(monaco.editor.create).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        value: 'version: 2',
        language: 'yaml',
        theme: 'apollo-future-light',
      })
    );
    expect(editor.updateOptions).toHaveBeenCalledWith({ readOnly: true });
  });

  it('shows highlighted text until Monaco is in', () => {
    renderViewer('wiki/map.yaml', { kind: 'source' }, () => new Promise(() => {}), 'version: 2');

    expect(screen.getByTestId('file-viewer-source-fallback')).toHaveTextContent('version: 2');
  });

  it('reports each edit when the host passes onChange', async () => {
    const { editor, type, load } = fakeMonaco();
    const onChange = vi.fn();

    renderViewer('notes.md', { kind: 'source', onChange }, load);
    await act(() => Promise.resolve());
    type('# Edited');

    expect(editor.updateOptions).toHaveBeenCalledWith({ readOnly: false });
    expect(onChange).toHaveBeenCalledWith('# Edited');
  });

  it('diffs the base text against the content', async () => {
    const { monaco, diff, load } = fakeMonaco();

    renderViewer(
      'history/CR-4.yaml',
      { kind: 'changes', baseContent: 'bump: minor', layout: 'inline' },
      load,
      'bump: major'
    );
    await act(() => Promise.resolve());

    expect(monaco.editor.createDiffEditor).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ readOnly: true, renderSideBySide: false })
    );
    expect(diff.setModel).toHaveBeenCalledWith({
      original: expect.objectContaining({ text: 'bump: minor', language: 'yaml' }),
      modified: expect.objectContaining({ text: 'bump: major', language: 'yaml' }),
    });
  });

  it('says so when Monaco fails to load for a diff', async () => {
    const load: LoadMonaco = () => Promise.reject(new Error('offline'));

    renderViewer(
      'a.json',
      { kind: 'changes', baseContent: '{}', layout: 'side-by-side' },
      load,
      '{}'
    );
    await act(() => Promise.resolve());

    expect(screen.getByText('Editor unavailable')).toBeInTheDocument();
  });
});
