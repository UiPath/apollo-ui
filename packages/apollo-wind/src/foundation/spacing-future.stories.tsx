import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Theme/Future/Spacing',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => 'Coming soon',
};
