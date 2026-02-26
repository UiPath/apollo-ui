import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';

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
// Token data
// ============================================================================

interface RadiusToken {
  token: string;
  px: number;
  twClass: string;
  usage: string;
}

const radiusTokens: RadiusToken[] = [
  { token: 'sm', px: 4, twClass: 'rounded-[4px]', usage: 'Chat bubble corner (Flow)' },
  { token: 'lg', px: 8, twClass: 'rounded-lg', usage: 'Buttons, inputs, icons' },
  { token: 'lgPlus', px: 10, twClass: 'rounded-[10px]', usage: 'Toggle pill buttons' },
  { token: 'xl', px: 12, twClass: 'rounded-xl', usage: 'Toggle containers, cards' },
  { token: '2xl', px: 16, twClass: 'rounded-2xl', usage: 'Panels, large cards' },
  { token: 'xlPlus', px: 20, twClass: 'rounded-[20px]', usage: 'Node size selector (Flow)' },
  { token: '3xl', px: 24, twClass: 'rounded-3xl', usage: 'Canvas toolbar' },
  { token: 'pill', px: 32, twClass: 'rounded-[32px]', usage: 'Delegate card radius' },
  { token: 'circle', px: 9999, twClass: 'rounded-full', usage: 'Circular buttons (send)' },
];

// ============================================================================
// Table component
// ============================================================================

function RadiusTable({ tokens }: { tokens: RadiusToken[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-right font-medium text-foreground-muted">px</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Tailwind Class</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Usage</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Preview</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.token} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-2">
                <code className="text-xs text-brand-foreground" style={{ fontFamily: fontFamily.monospace }}>
                  {token.token}
                </code>
              </td>
              <td className="px-4 py-2 text-right">
                <code className="text-xs tabular-nums text-foreground-muted" style={{ fontFamily: fontFamily.monospace }}>
                  {token.px >= 9999 ? '9999' : token.px}
                </code>
              </td>
              <td className="px-4 py-2">
                <code className="text-xs text-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                  {token.twClass}
                </code>
              </td>
              <td className="px-4 py-2 text-foreground-muted">{token.usage}</td>
              <td className="px-4 py-3">
                <div
                  className="h-10 w-28 border border-border bg-surface-raised"
                  style={{ borderRadius: token.px >= 9999 ? '9999px' : `${token.px}px` }}
                />
              </td>
            </tr>
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
        ({ light: 'future-light', 'core-dark': 'core-dark', 'core-light': 'core-light', wireframe: 'wireframe', vertex: 'vertex', canvas: 'canvas' } as Record<string, string>)[globals.futureTheme] ?? 'future-dark',
        'min-h-screen w-full bg-surface'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-5xl space-y-10 p-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Border Radius Tokens
          </h1>
          <p className="text-sm text-foreground-muted">
            All border radius values for the Future design language. Most map to Tailwind radius utilities,
            with custom values using bracket notation.
          </p>
        </div>

        <RadiusTable tokens={radiusTokens} />
      </div>
    </div>
  ),
};
