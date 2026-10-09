import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Globe } from 'lucide-react';
import { useState } from 'react';
import { type SourceData, SourceItem, Sources, SourcesList } from './sources';

const meta: Meta<typeof Sources> = {
  title: 'Chat/Components/Sources',
  component: Sources,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The sources behind an answer, collapsed behind a count. Put a SourcesList of SourceItem rows inside. A SourceItem with href renders as a link that opens a new tab. Without href it renders as a button for onSelect. onSelect receives the source and the event, so a host can run its citation-click pre-hook and call preventDefault to stop the link.',
      },
    },
  },
  args: {
    count: 3,
  },
  decorators: [
    (Story) => (
      <div className="w-[420px] rounded-xl border border-border-subtle bg-card p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SOURCES: (SourceData & { kind: 'web' | 'file' })[] = [
  {
    index: 1,
    kind: 'web',
    title: 'Invoice approval policy',
    source: 'policies.example.com',
    snippet: 'Invoices above $5,000 require approval from a finance manager before payment.',
    href: 'https://policies.example.com/finance/invoices',
  },
  {
    index: 2,
    kind: 'file',
    title: 'Q3 vendor report.pdf',
    source: 'Page 4',
    snippet: 'Acme Corp invoiced $5,600 on 14 September for consulting services.',
  },
  {
    index: 3,
    kind: 'web',
    title: 'Audit logging guide',
    source: 'docs.example.com',
    snippet: 'Every manual approval must be recorded with the approver and a reason.',
    href: 'https://docs.example.com/audit',
  },
];

function Items({
  snippets = false,
  onSelect,
}: {
  snippets?: boolean;
  onSelect?: (source: SourceData) => void;
}) {
  return (
    <SourcesList>
      {SOURCES.map(({ kind, snippet, ...source }) => (
        <SourceItem
          key={source.index}
          {...source}
          snippet={snippets ? snippet : undefined}
          icon={kind === 'web' ? <Globe /> : <FileText />}
          onSelect={onSelect}
        />
      ))}
    </SourcesList>
  );
}

export const Collapsed: Story = {
  render: (args) => (
    <Sources {...args} count={SOURCES.length}>
      <Items />
    </Sources>
  ),
};

export const Expanded: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Open by default. The web sources are links, the file source is a button that reports through onSelect.',
      },
    },
  },
  render: function ExpandedStory(args) {
    const [selected, setSelected] = useState<SourceData | null>(null);
    return (
      <div className="flex flex-col gap-3">
        <Sources {...args} count={SOURCES.length} defaultOpen>
          <Items onSelect={setSelected} />
        </Sources>
        <p className="text-xs text-muted-foreground">
          Selected: {selected ? selected.title : 'none'}
        </p>
      </div>
    );
  },
};

export const WithSnippets: Story = {
  render: (args) => (
    <Sources {...args} count={SOURCES.length} defaultOpen>
      <Items snippets />
    </Sources>
  ),
};

export const Strings: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The trigger text comes from strings.showSources, or strings.showSource for exactly one, with {count} replaced. The SourceItem rows read the new tab hint from the same strings.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <Sources
        count={SOURCES.length}
        defaultOpen
        strings={{ showSources: 'Quellen ({count})', opensInNewTab: '(öffnet in neuem Tab)' }}
      >
        <Items />
      </Sources>
      <Sources count={1} strings={{ showSource: 'Eine Quelle' }}>
        <SourcesList>
          <SourceItem index={1} title="Audit logging guide" href="https://docs.example.com/audit" />
        </SourcesList>
      </Sources>
    </div>
  ),
};
