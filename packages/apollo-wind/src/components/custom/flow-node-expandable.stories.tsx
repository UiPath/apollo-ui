import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowNodeExpandable } from './flow-node-expandable';

const meta = {
  title: 'Components/UiPath/Flow Node Expandable',
  component: FlowNodeExpandable,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FlowNodeExpandable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Collapsed ────────────────────────────────────────────────────────────────

export const CollapsedDefault: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded={false} forceState="default" />
    </div>
  ),
};

export const CollapsedHover: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded={false} forceState="hover" />
    </div>
  ),
};

export const CollapsedSelected: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded={false} forceState="selected" />
    </div>
  ),
};

export const CollapsedSelectedHover: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded={false} forceState="selected-hover" />
    </div>
  ),
};

// ── Expanded ─────────────────────────────────────────────────────────────────

export const ExpandedDefault: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded forceState="default" />
    </div>
  ),
};

export const ExpandedHover: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded forceState="hover" />
    </div>
  ),
};

export const ExpandedSelected: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded forceState="selected" />
    </div>
  ),
};

export const ExpandedSelectedHover: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <FlowNodeExpandable title="Node title" expanded forceState="selected-hover" />
    </div>
  ),
};
