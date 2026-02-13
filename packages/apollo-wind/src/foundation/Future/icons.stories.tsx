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
        ({ light: 'future-light', 'legacy-dark': 'legacy-dark', 'legacy-light': 'legacy-light', wireframe: 'future-wireframe', vertex: 'future-vertex', canvas: 'future-canvas' } as Record<string, string>)[globals.futureTheme] ?? 'future-dark',
        'flex min-h-screen w-full items-center justify-center bg-future-surface text-future-foreground-muted'
      )}
    >
      Coming soon
    </div>
  ),
};
