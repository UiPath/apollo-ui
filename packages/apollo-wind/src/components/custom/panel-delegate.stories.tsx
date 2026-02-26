import type { Meta, StoryObj } from '@storybook/react-vite';
import { Folder, History, MessageCirclePlus, Settings } from 'lucide-react';
import { DelegatePanel } from './panel-delegate';

const meta = {
  title: 'Components/UiPath/Panel (Delegate)',
  component: DelegatePanel,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DelegatePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleNavItems = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageCirclePlus className="h-5 w-5" />,
    defaultOpen: true,
    children: [
      { id: 'chat-1', label: 'Invoice processing' },
      { id: 'chat-2', label: 'Expense reports' },
      { id: 'chat-3', label: 'Data extraction' },
    ],
  },
  {
    id: 'history',
    label: 'History',
    icon: <History className="h-5 w-5" />,
    children: [
      { id: 'hist-1', label: 'Yesterday' },
      { id: 'hist-2', label: 'Last week' },
    ],
  },
  {
    id: 'folders',
    label: 'Folders',
    icon: <Folder className="h-5 w-5" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export const Default: Story = {
  render: () => (
    <div className="future-dark flex h-[600px] bg-surface">
      <DelegatePanel
        defaultOpen
        navItems={sampleNavItems}
        activeNavId="chat"
        selectedChildId="chat-1"
      />
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        Content area
      </div>
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div className="future-dark flex h-[600px] bg-surface">
      <DelegatePanel defaultOpen={false} navItems={sampleNavItems} activeNavId="chat" />
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        Content area
      </div>
    </div>
  ),
};
