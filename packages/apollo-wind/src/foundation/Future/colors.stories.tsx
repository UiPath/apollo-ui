import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { accent, border, foreground, gradient, ring, surface } from './colors';
import { fontFamily } from './typography';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Colors',
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

function TokenRow({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-future-border-subtle py-3">
      <code className="w-56 shrink-0 text-sm font-medium text-future-accent-foreground-muted">
        {label}
      </code>
      <span className="w-52 shrink-0 text-xs text-future-foreground-subtle">{className}</span>
      {children}
    </div>
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
      <div className="mx-auto max-w-4xl space-y-2 p-8">
        {/* ------------------------------------------------------------------ */}
        {/* Surface */}
        {/* ------------------------------------------------------------------ */}
        <SectionTitle>Surface (backgrounds)</SectionTitle>

        <div className="flex flex-col gap-4">
          {Object.entries(surface).map(([key, twClass]) => (
            <TokenRow key={key} label={`surface.${key}`} className={twClass}>
              <div className={cn('h-10 w-24 rounded-lg border border-future-border', twClass)} />
            </TokenRow>
          ))}
        </div>

        <Divider />

        {/* ------------------------------------------------------------------ */}
        {/* Accent */}
        {/* ------------------------------------------------------------------ */}
        <SectionTitle>Accent</SectionTitle>

        <div className="flex flex-col gap-4">
          {Object.entries(accent).map(([key, twClass]) => (
            <TokenRow key={key} label={`accent.${key}`} className={twClass}>
              <div className={cn('h-10 w-24 rounded-lg border border-future-border', twClass)} />
            </TokenRow>
          ))}
        </div>

        <Divider />

        {/* ------------------------------------------------------------------ */}
        {/* Foreground */}
        {/* ------------------------------------------------------------------ */}
        <SectionTitle>Foreground (text / icons)</SectionTitle>

        <div className="flex flex-col gap-4">
          {Object.entries(foreground).map(([key, twClass]) => {
            // Convert bg class pattern to text class for preview
            const textClass = twClass;
            return (
              <TokenRow key={key} label={`foreground.${key}`} className={twClass}>
                <span className={cn('text-sm font-medium', textClass)}>Sample text</span>
              </TokenRow>
            );
          })}
        </div>

        <Divider />

        {/* ------------------------------------------------------------------ */}
        {/* Border */}
        {/* ------------------------------------------------------------------ */}
        <SectionTitle>Border</SectionTitle>

        <div className="flex flex-col gap-4">
          {Object.entries(border).map(([key, twClass]) => (
            <TokenRow key={key} label={`border.${key}`} className={twClass}>
              <div
                className={cn('h-10 w-24 rounded-lg bg-future-surface-raised border-2', twClass)}
              />
            </TokenRow>
          ))}
        </div>

        <Divider />

        {/* ------------------------------------------------------------------ */}
        {/* Ring */}
        {/* ------------------------------------------------------------------ */}
        <SectionTitle>Ring (selection / focus)</SectionTitle>

        <div className="flex flex-col gap-4">
          {Object.entries(ring).map(([key, twClass]) => (
            <TokenRow key={key} label={`ring.${key}`} className={twClass}>
              <div
                className={cn('h-10 w-24 rounded-lg bg-future-surface-raised ring-2', twClass)}
              />
            </TokenRow>
          ))}
        </div>

        <Divider />

        {/* ------------------------------------------------------------------ */}
        {/* Gradient */}
        {/* ------------------------------------------------------------------ */}
        <SectionTitle>Gradient</SectionTitle>

        <div className="flex flex-col gap-4">
          {Object.entries(gradient).map(([key, twClass]) => (
            <TokenRow key={key} label={`gradient.${key}`} className={twClass}>
              <div className={cn('h-10 w-40 rounded-lg border border-future-border', twClass)} />
            </TokenRow>
          ))}
        </div>
      </div>
    </div>
  ),
};
