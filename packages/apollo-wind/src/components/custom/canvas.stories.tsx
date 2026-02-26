import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas } from './canvas';

const meta = {
  title: 'Components/UiPath/Canvas',
  component: Canvas,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Canvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark flex h-[500px]">
      <Canvas>
        <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
          Canvas content area — used as the main content surface in Delegate and Flow templates.
        </div>
      </Canvas>
    </div>
  ),
};
