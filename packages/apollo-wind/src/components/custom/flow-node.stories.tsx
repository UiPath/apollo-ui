import type { Meta, StoryObj } from '@storybook/react-vite';
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
    <div className="bg-surface p-8">
      <FlowNode title="Node title" subtitle="Secondary title" forceState="default" />
    </div>
  ),
};

export const Hover: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNode title="Node title" subtitle="Secondary title" forceState="hover" />
    </div>
  ),
};

export const Selected: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNode title="Node title" subtitle="Secondary title" forceState="selected" />
    </div>
  ),
};

export const SelectedHover: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNode title="Node title" subtitle="Secondary title" forceState="selected-hover" />
    </div>
  ),
};
