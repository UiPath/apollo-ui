import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';
import { breakpoint, viewport } from './responsive';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Responsive',
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
      {/* Breakpoints */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Breakpoints</SectionTitle>

      <p className="mb-6 text-sm text-future-foreground-muted">
        Min-width values (px) used in Delegate template and ViewportGuard.
        Use with <code className="rounded bg-future-surface-overlay px-1 text-future-accent-foreground-muted">matchMedia(&apos;(min-width: Npx)&apos;)</code>.
      </p>

      <div className="flex flex-col gap-4">
        {Object.entries(breakpoint).map(([key, px]) => (
          <div
            key={key}
            className="flex items-center gap-6 border-b border-future-border-subtle py-3"
          >
            <code className="w-52 shrink-0 text-sm font-medium text-future-accent-foreground-muted">
              breakpoint.{key}
            </code>
            <span className="w-16 shrink-0 text-sm tabular-nums text-future-foreground-muted">
              {px}px
            </span>
            <span className="text-sm text-future-foreground-subtle">
              {key === 'viewportGuard'
                ? 'Content visible ≥ this width; below shows overlay'
                : 'Left panel expanded ≥ this width; below collapsed'}
            </span>
          </div>
        ))}
      </div>

      <Divider />

      {/* ------------------------------------------------------------------ */}
      {/* Viewport presets */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Viewport presets</SectionTitle>

      <p className="mb-6 text-sm text-future-foreground-muted">
        Named widths used in Storybook viewport dropdown (Screen XL, L, M, S, XS).
      </p>

      <div className="flex flex-col gap-4">
        {Object.entries(viewport).map(([key, px]) => (
          <div
            key={key}
            className="flex items-center gap-6 border-b border-future-border-subtle py-3"
          >
            <code className="w-52 shrink-0 text-sm font-medium text-future-accent-foreground-muted">
              viewport.{key}
            </code>
            <span className="w-16 shrink-0 text-sm tabular-nums text-future-foreground-muted">
              {px}px
            </span>
            <span className="text-sm text-future-foreground-subtle">
              Screen {key.toUpperCase()} {px}
            </span>
          </div>
        ))}
      </div>
      </div>
    </div>
  ),
};
