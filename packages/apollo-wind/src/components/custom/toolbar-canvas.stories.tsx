import type { Meta, StoryObj } from '@storybook/react-vite';
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
  render: () => (
    <div className="future-dark bg-future-surface p-8">
      <FlowCanvasToolbar activeMode="build" />
    </div>
  ),
};
