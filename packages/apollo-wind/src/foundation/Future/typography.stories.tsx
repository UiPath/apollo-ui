import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';

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
// Token data
// ============================================================================

interface TypographyToken {
  token: string;
  value: string;
  twClass: string;
  usage?: string;
}

interface TypographyGroup {
  group: string;
  description?: string;
  tokens: TypographyToken[];
  previewStyle?: (value: string) => React.CSSProperties;
}

const typographyGroups: TypographyGroup[] = [
  {
    group: 'Font Family',
    description: 'Inter is the primary typeface for all Future UI surfaces',
    tokens: [
      { token: 'base', value: 'Inter', twClass: 'font-sans', usage: 'All UI text' },
      { token: 'monospace', value: 'JetBrains Mono', twClass: 'font-mono', usage: 'Code, data, technical content' },
      { token: 'numeric', value: 'Inter (tabular)', twClass: 'font-sans tabular-nums', usage: 'Numbers, data displays' },
    ],
    previewStyle: (value: string) => {
      if (value === 'JetBrains Mono') return { fontFamily: fontFamily.monospace };
      if (value === 'Inter (tabular)') return { fontFamily: fontFamily.numeric, fontVariantNumeric: 'tabular-nums' as const };
      return { fontFamily: fontFamily.base };
    },
  },
  {
    group: 'Font Size',
    tokens: [
      { token: 'xs', value: '12px', twClass: 'text-xs', usage: 'Labels, badges' },
      { token: 'sm', value: '14px', twClass: 'text-sm', usage: 'Body text, nav items' },
      { token: 'md', value: '15px', twClass: 'text-[15px]', usage: 'Medium body text' },
      { token: 'base', value: '16px', twClass: 'text-base', usage: 'Default body text' },
      { token: 'xl', value: '20px', twClass: 'text-xl', usage: 'Sub-headings' },
      { token: '4xl', value: '40px', twClass: 'text-[40px]', usage: 'Hero headings' },
    ],
    previewStyle: (value: string) => ({ fontSize: value, lineHeight: '1.4', fontFamily: fontFamily.base }),
  },
  {
    group: 'Font Weight',
    tokens: [
      { token: 'normal', value: '400', twClass: 'font-normal', usage: 'Body text' },
      { token: 'medium', value: '500', twClass: 'font-medium', usage: 'Labels, emphasis' },
      { token: 'semibold', value: '600', twClass: 'font-semibold', usage: 'Sub-headings' },
      { token: 'bold', value: '700', twClass: 'font-bold', usage: 'Headings' },
    ],
    previewStyle: (value: string) => ({ fontWeight: Number(value), fontSize: '16px', lineHeight: '1.4', fontFamily: fontFamily.base }),
  },
  {
    group: 'Line Height',
    tokens: [
      { token: 'snug', value: '20px', twClass: 'leading-5', usage: 'Compact lists, labels' },
      { token: 'normal', value: '24px', twClass: 'leading-6', usage: 'Default body text' },
      { token: 'loose', value: '36px', twClass: 'leading-9', usage: 'Large headings' },
    ],
    previewStyle: (value: string) => ({ fontSize: '14px', lineHeight: value, maxWidth: '280px', fontFamily: fontFamily.base }),
  },
  {
    group: 'Letter Spacing',
    tokens: [
      { token: 'tight', value: '-0.8px', twClass: 'tracking-[-0.8px]', usage: 'Large headings (40px)' },
      { token: 'snug', value: '-0.6px', twClass: 'tracking-[-0.6px]', usage: 'Panel tab titles' },
      { token: 'normal', value: '-0.4px', twClass: 'tracking-[-0.4px]', usage: 'Primary text (16px)' },
      { token: 'subtle', value: '-0.35px', twClass: 'tracking-[-0.35px]', usage: 'Subtitles, labels (14px)' },
      { token: 'fine', value: '-0.3px', twClass: 'tracking-[-0.3px]', usage: 'Small labels (12px)' },
    ],
    previewStyle: (value: string) => ({ fontSize: '16px', letterSpacing: value, fontFamily: fontFamily.base }),
  },
];

const previewTexts: Record<string, string> = {
  'Font Family': 'The quick brown fox jumps',
  'Font Size': 'The quick brown fox',
  'Font Weight': 'The quick brown fox jumps',
  'Line Height': 'The quick brown fox jumps over the lazy dog. Pack my box.',
  'Letter Spacing': 'The quick brown fox jumps',
};

// ============================================================================
// Table component
// ============================================================================

function TypographyTable({ groups }: { groups: TypographyGroup[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-future-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-future-border bg-future-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Value</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Tailwind Class</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Usage</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Preview</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.group}>
              <tr className="border-b border-future-border bg-future-surface-raised/50">
                <td
                  colSpan={5}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-future-foreground-muted"
                >
                  {group.group}
                  {group.description && (
                    <span className="ml-2 font-normal normal-case tracking-normal text-future-foreground-subtle">
                      — {group.description}
                    </span>
                  )}
                </td>
              </tr>
              {group.tokens.map((token) => (
                <tr key={`${group.group}-${token.token}`} className="border-b border-future-border-subtle last:border-b-0">
                  <td className="px-4 py-2">
                    <code className="text-xs text-future-accent-foreground" style={{ fontFamily: fontFamily.monospace }}>
                      {token.token}
                    </code>
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-xs tabular-nums text-future-foreground-muted" style={{ fontFamily: fontFamily.monospace }}>
                      {token.value}
                    </code>
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-xs text-future-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                      {token.twClass}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-future-foreground-muted">{token.usage}</td>
                  <td className="px-4 py-2">
                    <span
                      className="text-future-foreground-secondary"
                      style={group.previewStyle?.(token.value)}
                    >
                      {group.group === 'Font Family' && token.value === 'JetBrains Mono'
                        ? 'const x = 42;'
                        : group.group === 'Font Family' && token.value === 'Inter (tabular)'
                          ? '0123456789'
                          : previewTexts[group.group]}
                    </span>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
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
        ({ light: 'future-light', 'legacy-dark': 'legacy-dark', 'legacy-light': 'legacy-light', wireframe: 'future-wireframe', vertex: 'future-vertex', canvas: 'future-canvas' } as Record<string, string>)[globals.futureTheme] ?? 'future-dark',
        'min-h-screen w-full bg-future-surface'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-6xl space-y-10 p-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-future-foreground">
            Typography Tokens
          </h1>
          <p className="text-sm text-future-foreground-muted">
            All typography values for the Future design language. Inter is the primary typeface.
            Values map to Tailwind utilities or bracket notation for custom sizes.
          </p>
        </div>

        <TypographyTable groups={typographyGroups} />
      </div>
    </div>
  ),
};
