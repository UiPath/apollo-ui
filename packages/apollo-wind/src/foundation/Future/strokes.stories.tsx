import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';
import {
  borderWidth,
  borderColor,
  borderColorClass,
} from './strokes';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Strokes',
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

function Divider() {
  return <div className="my-10 h-px bg-future-border-subtle" />;
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
      {/* ------------------------------------------------------------------ */}
      {/* Border Width */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Border Width</SectionTitle>

      <div className="flex flex-col gap-4">
        {Object.entries(borderWidth).map(([key, px]) => (
          <div
            key={key}
            className="flex items-center gap-6 border-b border-future-border-subtle py-3"
          >
            <code className="w-48 shrink-0 text-sm font-medium text-future-accent-foreground-muted">
              borderWidth.{key}
            </code>
            <span className="w-16 shrink-0 text-sm tabular-nums text-future-foreground-muted">
              {px}px
            </span>
            <div
              className="h-10 w-48 rounded-lg bg-future-surface-raised"
              style={{
                border: `${px}px solid var(--color-future-border)`,
              }}
            />
          </div>
        ))}
      </div>

      <Divider />

      {/* ------------------------------------------------------------------ */}
      {/* Border Color */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Border Color</SectionTitle>

      <div className="flex flex-col gap-4">
        {Object.entries(borderColor).map(([key, hex]) => (
          <div
            key={key}
            className="flex items-center gap-6 border-b border-future-border-subtle py-3"
          >
            <code className="w-48 shrink-0 text-sm font-medium text-future-accent-foreground-muted">
              borderColor.{key}
            </code>
            <span className="w-28 shrink-0 text-sm tabular-nums text-future-foreground-muted">
              {hex}
            </span>
            <span className="w-36 shrink-0 text-xs text-future-foreground-subtle">
              {borderColorClass[key as keyof typeof borderColorClass]}
            </span>
            <div
              className="h-10 w-48 rounded-lg bg-future-surface-raised"
              style={{
                border: `2px solid ${hex}`,
              }}
            />
          </div>
        ))}
      </div>
      </div>
    </div>
  ),
};
