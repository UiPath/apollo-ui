import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@uipath/apollo-wind';
import { useState } from 'react';

import { FileViewer, type FileViewerLabels, type FileViewerView } from './FileViewer';
import { hasRenderedView } from './fileLanguage';
import type { FileViewerTheme } from './useApolloMonacoTheme';
import type { LoadMonaco } from './useMonaco';

// Storybook's Vite bundles Monaco; without worker config it runs on the main thread, which is fine here.
const loadMonaco: LoadMonaco = () => import('monaco-editor');

const LABELS: FileViewerLabels = {
  loading: 'Loading the editor…',
  loadFailed: 'The editor could not load.',
};

interface SampleFile {
  path: string;
  base: string;
  content: string;
}

const SAMPLE_FILES: [SampleFile, ...SampleFile[]] = [
  {
    path: 'wiki/as-is/overview.md',
    base: '---\nfriendly_name: Current process overview\nverified: false\n---\n\n# Current process overview\n\nInvoices arrive by email and are keyed in by hand.\n',
    content:
      '---\nfriendly_name: Current process overview\nverified: true\n---\n\n# Current process overview\n\nInvoices arrive by email and are **registered in the invoice pool**.\n\n| Step | Owner |\n| --- | --- |\n| Register invoice | AP clerk |\n| Approve journal | AP lead |\n',
  },
  {
    path: 'wiki/map.yaml',
    base: 'name: Vendor invoices\nversion: 1.3.0\nowners:\n  - ap-team\n',
    content: 'name: Vendor invoices\nversion: 1.4.0\nowners:\n  - ap-team\n  - finance-ops\n',
  },
  {
    path: 'wiki/as-is/process-provenance.json',
    base: '{\n  "steps": 13,\n  "verifiedBy": null\n}\n',
    content: '{\n  "steps": 14,\n  "verifiedBy": "process owner"\n}\n',
  },
];

// Storybook's Tailwind build does not scan stories, so the frame's height is set inline.
const STORY_HEIGHT = '36rem';

type ViewKind = 'rendered' | 'source' | 'changes';
const VIEW_KINDS: ViewKind[] = ['rendered', 'source', 'changes'];

function viewFor(
  kind: ViewKind,
  file: SampleFile,
  saveEdit: (content: string) => void
): FileViewerView {
  switch (kind) {
    case 'changes':
      return { kind, baseContent: file.base, layout: 'side-by-side' };
    case 'source':
      return { kind, onChange: saveEdit };
    case 'rendered':
      return { kind };
  }
}

function FileViewerPlayground({ theme }: { theme: FileViewerTheme }) {
  const [files, setFiles] = useState<SampleFile[]>(SAMPLE_FILES);
  const [selectedPath, setSelectedPath] = useState(SAMPLE_FILES[0].path);
  const [viewKind, setViewKind] = useState<ViewKind>('rendered');
  const file = files.find((candidate) => candidate.path === selectedPath) ?? SAMPLE_FILES[0];
  const availableViews = VIEW_KINDS.filter(
    (kind) => kind !== 'rendered' || hasRenderedView(file.path)
  );
  const shownView = availableViews.includes(viewKind) ? viewKind : 'source';

  const saveEdit = (content: string) =>
    setFiles((current) =>
      current.map((candidate) => (candidate === file ? { ...candidate, content } : candidate))
    );

  const view = viewFor(shownView, file, saveEdit);

  return (
    <div className="flex flex-col gap-3" style={{ height: STORY_HEIGHT }}>
      <div className="flex flex-wrap gap-2">
        {files.map((candidate) => (
          <Button
            key={candidate.path}
            size="sm"
            variant={candidate.path === file.path ? 'default' : 'outline'}
            onClick={() => setSelectedPath(candidate.path)}
          >
            {candidate.path}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        {availableViews.map((kind) => (
          <Button
            key={kind}
            size="sm"
            variant={kind === shownView ? 'secondary' : 'ghost'}
            onClick={() => setViewKind(kind)}
          >
            {kind}
          </Button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
        <FileViewer
          path={file.path}
          content={file.content}
          view={view}
          loadMonaco={loadMonaco}
          theme={theme}
          labels={LABELS}
        />
      </div>
    </div>
  );
}

const meta = {
  title: 'File Viewer',
  component: FileViewerPlayground,
  args: { theme: 'light' },
  argTypes: { theme: { control: 'inline-radio', options: ['light', 'dark'] } },
} satisfies Meta<typeof FileViewerPlayground>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
