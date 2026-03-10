import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { FlowCanvasToolbar } from './toolbar-canvas';

const meta = {
  title: 'Components/UiPath/Canvas Toolbar',
  component: FlowCanvasToolbar,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FlowCanvasToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [activeMode, setActiveMode] = React.useState<'build' | 'evaluate'>('build');
    return (
      <div className="bg-surface p-8">
        <FlowCanvasToolbar activeMode={activeMode} onModeChange={setActiveMode} />
      </div>
    );
  },
};
