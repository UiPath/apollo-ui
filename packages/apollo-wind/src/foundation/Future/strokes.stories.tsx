import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';

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
// Token data
// ============================================================================

interface StrokeWidthToken {
  token: string;
  px: number;
  twClass: string;
  usage: string;
}

interface StrokeColorToken {
  token: string;
  hex: string;
  twPrimitive: string;
  twClass: string;
  usage: string;
}

const borderWidthTokens: StrokeWidthToken[] = [
  { token: 'none', px: 0, twClass: 'border-0', usage: 'Reset / remove border' },
  { token: 'default', px: 1, twClass: 'border', usage: 'Default component borders' },
];

const borderColorTokens: StrokeColorToken[] = [
  { token: 'subtle', hex: '#27272a', twPrimitive: 'zinc-800', twClass: 'border-zinc-800', usage: 'Dividers, card borders' },
  { token: 'default', hex: '#3f3f46', twPrimitive: 'zinc-700', twClass: 'border-zinc-700', usage: 'Default component borders' },
  { token: 'muted', hex: '#18181b', twPrimitive: 'zinc-900', twClass: 'border-zinc-900', usage: 'Subdued container borders' },
  { token: 'strong', hex: '#e4e4e7', twPrimitive: 'zinc-200', twClass: 'border-zinc-200', usage: 'High-contrast borders on dark' },
  { token: 'hover', hex: '#52525b', twPrimitive: 'zinc-600', twClass: 'border-zinc-600', usage: 'Hover state borders' },
];

// ============================================================================
// Table components
// ============================================================================

function BorderWidthTable({ tokens }: { tokens: StrokeWidthToken[] }) {
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
                  {token.px}
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
                  className="h-10 w-28 rounded-lg bg-surface-raised"
                  style={{ border: `${token.px}px solid var(--border)` }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BorderColorTable({ tokens }: { tokens: StrokeColorToken[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">Color</th>
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
              <td className="px-4 py-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 shrink-0 rounded border border-border" style={{ backgroundColor: token.hex }} />
                  <div className="flex flex-col">
                    <code className="text-xs text-foreground-muted" style={{ fontFamily: fontFamily.monospace }}>
                      {token.hex}
                    </code>
                    <code className="text-[10px] text-brand-foreground/70" style={{ fontFamily: fontFamily.monospace }}>
                      {token.twPrimitive}
                    </code>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2">
                <code className="text-xs text-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                  {token.twClass}
                </code>
              </td>
              <td className="px-4 py-2 text-foreground-muted">{token.usage}</td>
              <td className="px-4 py-3">
                <div
                  className="h-10 w-28 rounded-lg bg-surface-raised"
                  style={{ border: `2px solid ${token.hex}` }}
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
            Stroke Tokens
          </h1>
          <p className="text-sm text-foreground-muted">
            Border widths and border colors for the Future design language.
            Border colors reference Tailwind's Zinc palette (dark theme values shown).
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
            Border Width
          </h2>
          <BorderWidthTable tokens={borderWidthTokens} />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
            Border Color
          </h2>
          <BorderColorTable tokens={borderColorTokens} />
        </div>
      </div>
    </div>
  ),
};
