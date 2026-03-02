import type { Meta, StoryObj } from '@storybook/react-vite';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Experiments/Brand Motion',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helpers
// ============================================================================

function resolveThemeClass(value: string) {
  if (value === 'core-dark') return 'core-dark';
  if (value === 'core-light') return 'core-light';
  if (value === 'wireframe') return 'wireframe';
  if (value === 'vertex') return 'vertex';
  if (value === 'canvas') return 'canvas';
  if (value === 'light') return 'future-light';
  return 'future-dark';
}

// ============================================================================
// Coming Soon placeholder
// ============================================================================

function ComingSoon({ theme }: { theme: string }) {
  const themeClass = resolveThemeClass(theme);

  return (
    <div
      className={cn(themeClass, 'flex min-h-screen w-full items-center justify-center bg-background text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Brand Motion
        </h1>
        <p className="text-base text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

export const Default: Story = {
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} />
  ),
};
