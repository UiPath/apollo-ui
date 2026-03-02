import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Mail } from 'lucide-react';
import { FlowNode } from './flow-node';

const meta = {
  title: 'Components/UiPath/Flow Node',
  component: FlowNode,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FlowNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark bg-surface p-8">
      <FlowNode title="AI Agent" />
    </div>
  ),
};

export const Selected: Story = {
  render: () => (
    <div className="future-dark bg-surface p-8">
      <FlowNode title="AI Agent" selected />
    </div>
  ),
};

export const CustomIcon: Story = {
  render: () => (
    <div className="future-dark flex gap-4 bg-surface p-8">
      <FlowNode
        title="Extract Data"
        icon={<FileText className="h-5 w-5 text-brand-foreground" />}
      />
      <FlowNode
        title="Send Email"
        icon={<Mail className="h-5 w-5 text-brand-foreground" />}
      />
    </div>
  ),
};
