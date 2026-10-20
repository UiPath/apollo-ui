import type { Meta, StoryObj } from '@storybook/react-vite';
import { type RefObject, useRef, useState } from 'react';
import { Citation, type CitationData } from './citation';

const meta: Meta<typeof Citation> = {
  title: 'Chat/Components/Citation',
  component: Citation,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An inline citation marker for assistant prose. It is a real button, so it is reachable by keyboard and fires onSelect on click, Enter or Space. When it has a title, snippet or source, a preview card opens on hover and on focus. It does not navigate by itself: onSelect receives the citation, so a host can run its citation-click pre-hook and then open href. That href is dropped unless it uses a safe protocol.',
      },
    },
  },
  args: {
    index: 1,
  },
  decorators: [
    (Story) => (
      <div className="w-[420px] rounded-xl border border-border-subtle bg-card p-4 text-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SOURCES: Required<CitationData>[] = [
  {
    index: 1,
    title: 'Q3 vendor report.pdf',
    snippet: 'Acme Corp invoiced $5,600 on 14 September for consulting services.',
    source: 'Q3 vendor report.pdf, page 4',
    href: 'https://files.example.com/q3-vendor-report.pdf#page=4',
  },
  {
    index: 2,
    title: 'Invoice approval policy',
    snippet: 'Invoices above $5,000 require approval from a finance manager before payment.',
    source: 'policies.example.com',
    href: 'https://policies.example.com/finance/invoices',
  },
  {
    index: 3,
    title: 'Audit logging guide',
    snippet: 'Every manual approval must be recorded with the approver and a reason.',
    source: 'docs.example.com',
    href: 'https://docs.example.com/audit',
  },
];

export const Default: Story = {
  render: (args) => <Citation {...args} />,
};

// The CSS Custom Highlight API paints a Range without changing the DOM, so React's tree is left alone.
function useCitedHighlight(container: RefObject<HTMLElement | null>) {
  // A preview's close delay lets citations overlap, so highlight the latest one still active.
  const activeOrder = useRef<CitationData['index'][]>([]);
  return (index: CitationData['index'], active: boolean) => {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;
    activeOrder.current = activeOrder.current.filter((i) => i !== index);
    if (active) activeOrder.current.push(index);
    const latest = activeOrder.current.at(-1);
    const passage =
      latest === undefined ? null : container.current?.querySelector(`[data-cited="${latest}"]`);
    if (!passage) {
      CSS.highlights.delete('citation');
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(passage);
    CSS.highlights.set('citation', new Highlight(range));
  };
}

export const InProse: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Several citations inline in an answer. Hover or focus one to highlight the text it supports, and click one, or tab to it and press Enter, to see the onSelect payload. onActiveChange reports when a citation is hovered or keyboard focused, and stays true while its preview shows. It works with or without a preview: the third citation has preview={false}. The host wraps each cited passage and paints it with the CSS Custom Highlight API, which leaves the DOM untouched.',
      },
    },
  },
  render: function InProseStory() {
    const [selected, setSelected] = useState<CitationData | null>(null);
    const prose = useRef<HTMLParagraphElement>(null);
    const highlight = useCitedHighlight(prose);
    const [first, second, third] = SOURCES;
    return (
      <div className="flex flex-col gap-3">
        <style>
          {'::highlight(citation) { background-color: var(--color-background-highlight); }'}
        </style>
        <p ref={prose} className="leading-relaxed">
          <span data-cited={first.index}>Invoice #4023 from Acme Corp is for $5,600</span>
          <Citation
            {...first}
            onSelect={setSelected}
            onActiveChange={(active) => highlight(first.index, active)}
          />
          , which is <span data-cited={second.index}>above the $5,000 auto-approval threshold</span>
          <Citation
            {...second}
            onSelect={setSelected}
            onActiveChange={(active) => highlight(second.index, active)}
          />
          . A finance manager needs to approve it, and{' '}
          <span data-cited={third.index}>the approval has to be logged with a reason</span>
          <Citation
            {...third}
            preview={false}
            onSelect={setSelected}
            onActiveChange={(active) => highlight(third.index, active)}
          />
          .
        </p>
        <p className="text-xs text-muted-foreground">
          Selected: {selected ? `${selected.index}, ${selected.href}` : 'none'}
        </p>
      </div>
    );
  },
};

export const WithPreview: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The preview shows the source, title and snippet, each optional. Set preview={false} to keep only the marker.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <p>
        Full preview
        <Citation {...SOURCES[0]} />
      </p>
      <p>
        Title only
        <Citation index={2} title="Invoice approval policy" />
      </p>
      <p>
        No preview
        <Citation {...SOURCES[2]} preview={false} />
      </p>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="text-xs">
        Small, for compact text
        <Citation index={1} size="sm" />
      </p>
      <p>
        Default
        <Citation index={2} />
      </p>
      <p className="text-base">
        Large, for larger text
        <Citation index={3} size="lg" />
      </p>
    </div>
  ),
};
