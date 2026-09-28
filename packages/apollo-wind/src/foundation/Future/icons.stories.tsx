import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Theme/Future/Icons',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface text-foreground-muted">
      Coming soon
    </div>
  ),
};
