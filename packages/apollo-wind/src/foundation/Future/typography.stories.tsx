import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} from './typography';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Typography',
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

function TokenRow({
  token,
  value,
  preview,
  style,
}: {
  token: string;
  value: string | number;
  preview?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex items-baseline gap-6 border-b border-future-border-subtle py-3">
      <code className="w-48 shrink-0 text-sm font-medium text-future-accent-foreground-muted">
        {token}
      </code>
      <span className="w-16 shrink-0 text-sm tabular-nums text-future-foreground-muted">
        {typeof value === 'number' ? `${value}px` : value}
      </span>
      {preview && (
        <span
          className="text-future-foreground-secondary"
          style={{ fontFamily: fontFamily.base, ...style }}
        >
          {preview}
        </span>
      )}
    </div>
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
      {/* Font Family */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Font Family</SectionTitle>
      <p className="mb-6 text-sm text-future-foreground-muted">
        Inter is the primary typeface for all Future UI surfaces.
      </p>

      <TokenRow
        token="fontFamily.base"
        value="Inter"
        preview="The quick brown fox jumps over the lazy dog"
        style={{ fontFamily: fontFamily.base }}
      />
      <TokenRow
        token="fontFamily.monospace"
        value="JetBrains Mono"
        preview="const x = 42;"
        style={{ fontFamily: fontFamily.monospace }}
      />
      <TokenRow
        token="fontFamily.numeric"
        value="Inter"
        preview="0123456789"
        style={{
          fontFamily: fontFamily.numeric,
          fontVariantNumeric: 'tabular-nums',
        }}
      />

      <Divider />

      {/* ------------------------------------------------------------------ */}
      {/* Font Size */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Font Size</SectionTitle>

      {Object.entries(fontSize).map(([key, px]) => (
        <TokenRow
          key={key}
          token={`fontSize.${key}`}
          value={px}
          preview="The quick brown fox"
          style={{ fontSize: `${px}px`, lineHeight: '1.4' }}
        />
      ))}

      <Divider />

      {/* ------------------------------------------------------------------ */}
      {/* Font Weight */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Font Weight</SectionTitle>

      {Object.entries(fontWeight).map(([key, weight]) => (
        <TokenRow
          key={key}
          token={`fontWeight.${key}`}
          value={weight}
          preview="The quick brown fox jumps"
          style={{ fontWeight: weight, fontSize: '16px', lineHeight: '1.4' }}
        />
      ))}

      <Divider />

      {/* ------------------------------------------------------------------ */}
      {/* Line Height */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Line Height</SectionTitle>

      {Object.entries(lineHeight).map(([key, px]) => (
        <TokenRow
          key={key}
          token={`lineHeight.${key}`}
          value={px}
          preview="The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs."
          style={{
            fontSize: '14px',
            lineHeight: `${px}px`,
            maxWidth: '320px',
          }}
        />
      ))}

      <Divider />

      {/* ------------------------------------------------------------------ */}
      {/* Letter Spacing */}
      {/* ------------------------------------------------------------------ */}
      <SectionTitle>Letter Spacing</SectionTitle>

      {Object.entries(letterSpacing).map(([key, value]) => (
        <TokenRow
          key={key}
          token={`letterSpacing.${key}`}
          value={value}
          preview="The quick brown fox jumps over the lazy dog"
          style={{
            fontSize: '16px',
            letterSpacing: value,
          }}
        />
      ))}
      </div>
    </div>
  ),
};
