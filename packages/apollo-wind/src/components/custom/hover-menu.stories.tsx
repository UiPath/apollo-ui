import type { Meta, StoryObj } from '@storybook/react-vite';
import { HoverMenu } from './hover-menu';

const meta = {
  title: 'Components/UiPath/Hover Menu',
  component: HoverMenu,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof HoverMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <HoverMenu />
    </div>
  ),
};
