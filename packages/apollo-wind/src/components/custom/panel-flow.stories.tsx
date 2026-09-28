import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { FlowPanel, defaultFlowNavItems } from './panel-flow';

const meta = {
  title: 'Components/UiPath/Panel (Flow)',
  component: FlowPanel,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FlowPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Tell me what tools the Excel agent is using',
  },
  {
    id: '2',
    role: 'assistant' as const,
    traceLabel: 'Chain of thought',
    toolCard: {
      title: 'Excel Agent',
      items: [
        {
          icon: 'search' as const,
          title: 'WebSearchTool',
          description:
            'Searching and analyzing multiple cells in this spreadsheet to create a summary for planning next steps.',
        },
        {
          icon: 'bot' as const,
          title: 'Excel Agent',
          description: 'Editing current column with additional information.',
        },
        {
          icon: 'search' as const,
          title: 'WebSearchTool',
          description: 'Checking categorized tabs to better understand spam and volume sources.',
        },
        {
          icon: 'bot' as const,
          title: 'Currency conversion',
          description:
            'Performing currency conversion using current market rates to ensure accurate calculations.',
        },
      ],
    },
  },
];

export const Default: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    const [activeNavId, setActiveNavId] = React.useState('chat');
    return (
      <div className="flex h-screen bg-surface">
        <FlowPanel
          open={open}
          onOpenChange={setOpen}
          navItems={defaultFlowNavItems}
          activeNavId={activeNavId}
          onNavChange={setActiveNavId}
          chatMessages={sampleMessages}
        />
        <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
          Canvas area
        </div>
      </div>
    );
  },
};

export const Collapsed: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [activeNavId, setActiveNavId] = React.useState('chat');
    return (
      <div className="flex h-screen bg-surface">
        <FlowPanel
          open={open}
          onOpenChange={setOpen}
          navItems={defaultFlowNavItems}
          activeNavId={activeNavId}
          onNavChange={setActiveNavId}
        />
        <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
          Canvas area
        </div>
      </div>
    );
  },
};
