import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn, TooltipProvider } from '@uipath/apollo-wind';
import { useState } from 'react';
import { CanvasLeftSidebar, type CanvasLeftSidebarItemId } from './CanvasLeftSidebar';

const meta = {
  title: 'Components/Controls/CanvasLeftSidebar',
  component: CanvasLeftSidebar,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Variables' },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof CanvasLeftSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SidebarStory({ variant }: { variant: 'default' | 'floating' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItemId, setActiveItemId] = useState<CanvasLeftSidebarItemId>('variables');
  const labels: Record<CanvasLeftSidebarItemId, string> = {
    'coding-agent': 'Coding agent',
    files: 'Files',
    variables: 'Variables',
    connections: 'Connections',
    'run-history': 'Run history',
    'whats-new': "What's new",
    account: 'Account',
  };

  return (
    <div className={cn('h-screen bg-surface', variant === 'floating' && 'p-6')}>
      <CanvasLeftSidebar
        title={labels[activeItemId]}
        variant={variant}
        isExpanded={isExpanded}
        onExpandedChange={setIsExpanded}
        activeItemId={activeItemId}
        onItemSelect={setActiveItemId}
      />
    </div>
  );
}

export const DefaultSidebar: Story = {
  name: 'Default Sidebar',
  render: () => <SidebarStory variant="default" />,
};

export const FloatingSidebar: Story = {
  name: 'Floating Sidebar',
  render: () => <SidebarStory variant="floating" />,
};
