import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { FlowViewToolbar } from './toolbar-view';

const meta = {
  title: 'Components/UiPath/View Toolbar',
  component: FlowViewToolbar,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FlowViewToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [activeNodeSize, setActiveNodeSize] = React.useState<'s' | 'm' | 'l'>('s');
    return (
      <div className="bg-surface p-8">
        <FlowViewToolbar activeNodeSize={activeNodeSize} onNodeSizeChange={setActiveNodeSize} />
      </div>
    );
  },
};
