import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';
import { borderRadius } from './radius';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Radius',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helpers
// ============================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-6 text-2xl font-bold tracking-tight text-future-foreground"
      style={{ fontFamily: fontFamily.base }}
    >
      {children}
    </h2>
  );
}

// ============================================================================
// Story
// ============================================================================

export const Default: Story = {
  render: (_, { globals }) => (
    <div
      className={cn(
        globals.futureTheme === 'light' ? 'future-light' : 'future-dark',
        'min-h-screen w-full bg-future-surface'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-3xl space-y-2 p-8">
      <SectionTitle>Border Radius</SectionTitle>

      <div className="flex flex-col gap-4">
        {Object.entries(borderRadius).map(([key, px]) => (
          <div
            key={key}
            className="flex items-center gap-6 border-b border-future-border-subtle py-3"
          >
            <code className="w-48 shrink-0 text-sm font-medium text-future-accent-foreground-muted">
              borderRadius.{key}
            </code>
            <span className="w-16 shrink-0 text-sm tabular-nums text-future-foreground-muted">
              {px >= 9999 ? '9999px' : `${px}px`}
            </span>
            <div
              className="h-12 w-48 border border-future-border bg-future-surface-raised"
              style={{
                borderRadius: px >= 9999 ? '9999px' : `${px}px`,
              }}
            />
          </div>
        ))}
      </div>
      </div>
    </div>
  ),
};
