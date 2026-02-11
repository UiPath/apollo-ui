import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';
import { boxShadow, boxShadowClass } from './shadows';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Shadows',
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
      <SectionTitle>Box Shadow</SectionTitle>

      <div className="flex flex-col gap-6">
        {Object.entries(boxShadow).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-6 border-b border-future-border-subtle pb-6 pt-2"
          >
            <div className="flex w-64 shrink-0 flex-col gap-1">
              <code className="text-sm font-medium text-future-accent-foreground-muted">
                boxShadow.{key}
              </code>
              <span className="text-xs text-future-foreground-subtle">
                {boxShadowClass[key as keyof typeof boxShadowClass]}
              </span>
            </div>
            <div
              className="h-16 w-56 rounded-2xl border border-future-border-subtle bg-future-surface-raised"
              style={{ boxShadow: value }}
            />
          </div>
        ))}
      </div>
      </div>
    </div>
  ),
};
