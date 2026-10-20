import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bot, Database, Mail, Wrench } from 'lucide-react';
import * as React from 'react';
import { DisclosureTree, type DisclosureTreeItem } from './disclosure-tree';
import { ToolCall, ToolCallContent, ToolCallHeader, ToolCallSection } from './tool-call';

const meta: Meta<typeof DisclosureTree> = {
  title: 'Chat/Components/Disclosure Tree',
  component: DisclosureTree,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A read-only tree of rows that disclose their children, for agent traces and nested results in a chat. Each row has an optional leading icon, a label, trailing info and a description shown as a tooltip. It follows the ARIA tree pattern: one row is in the tab order, Up and Down move between rows, Home and End jump to the first and last, Right opens a row or enters it, Left closes it or moves to its parent, and Enter or Space toggle. It has no toolbar and no built-in copy. Give it a name with aria-label or aria-labelledby. For a file manager with search, selection and menus use TreeView.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-120 bg-background text-sm text-muted-foreground">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const TRACE: DisclosureTreeItem[] = [
  {
    id: 'agent',
    label: 'Invoice approval agent',
    icon: <Bot />,
    trailing: '4.2 s',
    defaultExpanded: true,
    description: 'Run 7f3a, started by the month-end workflow',
    children: [
      {
        id: 'vendor',
        label: 'Look up vendor',
        icon: <Database />,
        trailing: '0.8 s',
        children: [
          { id: 'query', label: 'Query vendor table', trailing: '0.6 s' },
          { id: 'cache', label: 'Update vendor cache', trailing: '0.2 s' },
        ],
      },
      {
        id: 'policy',
        label: 'Check approval policy',
        icon: <Wrench />,
        trailing: '1.1 s',
        description: 'Invoices over 2,500 need a second approver',
      },
      { id: 'notify', label: 'Notify finance', icon: <Mail />, trailing: '0.3 s' },
    ],
  },
];

export const Basic: Story = {
  args: {
    'aria-label': 'Agent trace',
    items: TRACE,
  },
};

function buildSpans(depth: number, prefix: string): DisclosureTreeItem[] {
  return [1, 2, 3].map((index) => {
    const id = `${prefix}.${index}`;
    return {
      id,
      label: `Span ${id}`,
      trailing: `${index * 120} ms`,
      expandable: depth < 4,
      children: () => buildSpans(depth + 1, id),
    };
  });
}

function ControlledDemo() {
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const items = React.useMemo(() => buildSpans(1, '1'), []);
  return (
    <ToolCall status="completed" defaultOpen>
      <ToolCallHeader name="search invoices" duration="2.40 seconds" />
      <ToolCallContent>
        <ToolCallSection title="Traces" defaultOpen>
          <DisclosureTree
            aria-label="Traces"
            items={items}
            expanded={expanded}
            onExpandedChange={(id, open) =>
              setExpanded((list) => (open ? [...list, id] : list.filter((entry) => entry !== id)))
            }
          />
        </ToolCallSection>
      </ToolCallContent>
    </ToolCall>
  );
}

export const LazyAndControlled: Story = {
  args: { items: [] },
  render: () => <ControlledDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Inside a ToolCall Traces section. Each level is built by a function the first time its row opens, so a large trace costs nothing until someone looks, and the open rows are held by the host through expanded and onExpandedChange so they survive the tree unmounting.',
      },
    },
  },
};
