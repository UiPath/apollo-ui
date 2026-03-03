import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';

const meta = {
  title: 'Theme/Future/Icons',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_, { globals }) => (
    <div
      className={cn(
        globals.futureTheme ?? 'future-dark',
        'flex min-h-screen w-full items-center justify-center bg-surface text-foreground-muted'
      )}
    >
      Coming soon
    </div>
  ),
};
