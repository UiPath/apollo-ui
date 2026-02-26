import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';

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
// Token data
// ============================================================================

interface ShadowToken {
  token: string;
  value: string;
  twClass: string;
  usage: string;
}

const shadowTokens: ShadowToken[] = [
  { token: 'sm', value: '0 1px 2px 0 rgba(0,0,0,0.05)', twClass: 'shadow-sm', usage: 'Subtle lift (logo, small badges)' },
  { token: 'rail', value: '0px 4px 16px 0px rgba(0,0,0,0.25)', twClass: 'shadow-[0px_4px_16px_0px_rgba(0,0,0,0.25)]', usage: 'Icon rail shadow (Flow panel)' },
  { token: 'elevated', value: '0px 4px 24px 0px rgba(0,0,0,0.25)', twClass: 'shadow-[0px_4px_24px_0px_rgba(0,0,0,0.25)]', usage: 'Panels, hover cards' },
];

// ============================================================================
// Table component
// ============================================================================

function ShadowTable({ tokens }: { tokens: ShadowToken[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Value</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Tailwind Class</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Usage</th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">Preview</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.token} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-3">
                <code className="text-xs text-brand-foreground" style={{ fontFamily: fontFamily.monospace }}>
                  {token.token}
                </code>
              </td>
              <td className="max-w-48 px-4 py-3">
                <code className="break-all text-[10px] text-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                  {token.value}
                </code>
              </td>
              <td className="max-w-48 px-4 py-3">
                <code className="break-all text-[10px] text-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                  {token.twClass}
                </code>
              </td>
              <td className="px-4 py-3 text-foreground-muted">{token.usage}</td>
              <td className="px-4 py-4">
                <div
                  className="mx-auto h-14 w-40 rounded-2xl border border-border-subtle bg-surface-raised"
                  style={{ boxShadow: token.value }}
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
      <div className="mx-auto max-w-6xl space-y-10 p-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Shadow Tokens
          </h1>
          <p className="text-sm text-foreground-muted">
            Box shadow values for depth and elevation in the Future design language.
            Shadows are theme-agnostic — the same values apply in both dark and light modes.
          </p>
        </div>

        <ShadowTable tokens={shadowTokens} />
      </div>
    </div>
  ),
};
