import type { Meta, StoryObj } from '@storybook/react-vite';
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
  { id: '1', role: 'user' as const, content: 'Build an invoice processing workflow' },
  { id: '2', role: 'assistant' as const, content: 'I\'ll create a workflow that extracts data from invoices using Document Understanding, validates the amounts, and routes them for approval.' },
  { id: '3', role: 'user' as const, content: 'Add error handling for invalid formats' },
];

export const Default: Story = {
  render: () => (
    <div className="future-dark flex h-[600px] bg-surface">
      <FlowPanel
        open
        navItems={defaultFlowNavItems}
        activeNavId="chat"
        chatMessages={sampleMessages}
      />
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        Canvas area
      </div>
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div className="future-dark flex h-[600px] bg-surface">
      <FlowPanel
        open={false}
        navItems={defaultFlowNavItems}
        activeNavId="chat"
      />
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        Canvas area
      </div>
    </div>
  ),
};
