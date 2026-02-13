import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
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
// Token data
// ============================================================================

interface ColorToken {
  name: string;
  twClass: string;
  usage: string;
  dark: string;
  darkTw: string;
  light: string;
  lightTw: string;
}

interface GradientToken {
  name: string;
  twClass: string;
  darkFrom: string;
  darkTo: string;
  lightFrom: string;
  lightTo: string;
}

interface ColorGroup {
  group: string;
  tokens: ColorToken[];
}

const colorGroups: ColorGroup[] = [
  {
    group: 'Surface',
    tokens: [
      { name: 'surface', twClass: 'bg-future-surface', usage: 'Page, canvas, containers', dark: '#09090b', darkTw: 'zinc-950', light: '#fafafa', lightTw: 'zinc-50' },
      { name: 'surface-raised', twClass: 'bg-future-surface-raised', usage: 'Properties bar & panel (Flow); cards, overlays, panels', dark: '#18181b', darkTw: 'zinc-900', light: '#f4f4f5', lightTw: 'zinc-100' },
      { name: 'surface-overlay', twClass: 'bg-future-surface-overlay', usage: 'Left panel (Flow, Delegate); panels, inputs, tabs, icon rail', dark: '#27272a', darkTw: 'zinc-800', light: '#e4e4e7', lightTw: 'zinc-200' },
      { name: 'surface-hover', twClass: 'bg-future-surface-hover', usage: 'Nav hover, selected state', dark: '#3f3f46', darkTw: 'zinc-700', light: '#d4d4d8', lightTw: 'zinc-300' },
      { name: 'surface-muted', twClass: 'bg-future-surface-muted', usage: 'Badges, indicators', dark: '#71717a', darkTw: 'zinc-500', light: '#a1a1aa', lightTw: 'zinc-400' },
      { name: 'surface-inverse', twClass: 'bg-future-surface-inverse', usage: 'Buttons on opposite bg', dark: '#fafafa', darkTw: 'zinc-50', light: '#09090b', lightTw: 'zinc-950' },
    ],
  },
  {
    group: 'Accent',
    tokens: [
      { name: 'accent', twClass: 'bg-future-accent', usage: 'Logo, primary buttons, active indicators', dark: '#0891b2', darkTw: 'cyan-600', light: '#0891b2', lightTw: 'cyan-600' },
      { name: 'accent-subtle', twClass: 'bg-future-accent-subtle', usage: 'Selected state bg, active nav, status badges', dark: '#083344', darkTw: 'cyan-950', light: '#ecfeff', lightTw: 'cyan-50' },
    ],
  },
  {
    group: 'Foreground',
    tokens: [
      { name: 'foreground', twClass: 'text-future-foreground', usage: 'Primary headings', dark: '#fafafa', darkTw: 'zinc-50', light: '#09090b', lightTw: 'zinc-950' },
      { name: 'foreground-secondary', twClass: 'text-future-foreground-secondary', usage: 'Body, messages', dark: '#f4f4f5', darkTw: 'zinc-100', light: '#18181b', lightTw: 'zinc-900' },
      { name: 'foreground-hover', twClass: 'text-future-foreground-hover', usage: 'Hover states', dark: '#d4d4d8', darkTw: 'zinc-300', light: '#52525b', lightTw: 'zinc-600' },
      { name: 'foreground-muted', twClass: 'text-future-foreground-muted', usage: 'Nav, secondary UI, code', dark: '#a1a1aa', darkTw: 'zinc-400', light: '#71717a', lightTw: 'zinc-500' },
      { name: 'foreground-subtle', twClass: 'text-future-foreground-subtle', usage: 'Labels, placeholders', dark: '#71717a', darkTw: 'zinc-500', light: '#a1a1aa', lightTw: 'zinc-400' },
      { name: 'foreground-inverse', twClass: 'text-future-foreground-inverse', usage: 'Icons on inverse bg', dark: '#09090b', darkTw: 'zinc-950', light: '#fafafa', lightTw: 'zinc-50' },
      { name: 'foreground-on-accent', twClass: 'text-future-foreground-on-accent', usage: 'Text on accent bg', dark: '#fafafa', darkTw: 'zinc-50', light: '#fafafa', lightTw: 'zinc-50' },
      { name: 'foreground-accent', twClass: 'text-future-foreground-accent', usage: 'Accent text, icons', dark: '#06b6d4', darkTw: 'cyan-500', light: '#0891b2', lightTw: 'cyan-600' },
      { name: 'foreground-accent-muted', twClass: 'text-future-foreground-accent-muted', usage: 'Muted accent text', dark: '#22d3ee', darkTw: 'cyan-400', light: '#0891b2', lightTw: 'cyan-600' },
    ],
  },
  {
    group: 'Border',
    tokens: [
      { name: 'border', twClass: 'border-future-border', usage: 'Primary borders', dark: '#3f3f46', darkTw: 'zinc-700', light: '#d4d4d8', lightTw: 'zinc-300' },
      { name: 'border-subtle', twClass: 'border-future-border-subtle', usage: 'Subtle dividers', dark: '#27272a', darkTw: 'zinc-800', light: '#e4e4e7', lightTw: 'zinc-200' },
      { name: 'border-muted', twClass: 'border-future-border-muted', usage: 'Content borders', dark: '#18181b', darkTw: 'zinc-900', light: '#f4f4f5', lightTw: 'zinc-100' },
      { name: 'border-deep', twClass: 'border-future-border-deep', usage: 'Nested containers', dark: '#09090b', darkTw: 'zinc-950', light: '#fafafa', lightTw: 'zinc-50' },
      { name: 'border-inverse', twClass: 'border-future-border-inverse', usage: 'Borders on inverse bg', dark: '#e4e4e7', darkTw: 'zinc-200', light: '#3f3f46', lightTw: 'zinc-700' },
      { name: 'border-hover', twClass: 'border-future-border-hover', usage: 'Border hover state', dark: '#52525b', darkTw: 'zinc-600', light: '#a1a1aa', lightTw: 'zinc-400' },
    ],
  },
  {
    group: 'Ring',
    tokens: [
      { name: 'ring', twClass: 'ring-future-ring', usage: 'Focus / selection ring', dark: '#52525b', darkTw: 'zinc-600', light: '#a1a1aa', lightTw: 'zinc-400' },
    ],
  },
];

const gradientTokens: GradientToken[] = [
  { name: 'gradient-1', twClass: 'bg-future-gradient-1', darkFrom: 'zinc-700', darkTo: 'zinc-800', lightFrom: 'zinc-200', lightTo: 'zinc-100' },
  { name: 'gradient-2', twClass: 'bg-future-gradient-2', darkFrom: 'zinc-950', darkTo: 'zinc-900', lightFrom: 'zinc-50', lightTo: 'zinc-50' },
  { name: 'gradient-3', twClass: 'bg-future-gradient-3', darkFrom: 'zinc-700', darkTo: 'zinc-900', lightFrom: 'zinc-200', lightTo: 'zinc-50' },
  { name: 'gradient-4', twClass: 'bg-future-gradient-4', darkFrom: 'zinc-900', darkTo: 'zinc-800', lightFrom: 'zinc-50', lightTo: 'zinc-100' },
  { name: 'gradient-5', twClass: 'bg-future-gradient-5', darkFrom: 'zinc-950', darkTo: 'zinc-900', lightFrom: 'zinc-50', lightTo: 'zinc-50' },
  { name: 'gradient-6', twClass: 'bg-future-gradient-6', darkFrom: 'cyan-600', darkTo: 'cyan-950', lightFrom: 'cyan-400', lightTo: 'cyan-100' },
];

// ============================================================================
// Table components
// ============================================================================

function ColorTokenTable({ groups }: { groups: ColorGroup[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-future-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-future-border bg-future-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Tailwind Class</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Usage</th>
            <th className="px-4 py-2.5 text-center font-medium text-future-foreground-muted">Dark</th>
            <th className="px-4 py-2.5 text-center font-medium text-future-foreground-muted">Light</th>
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
                </td>
              </tr>
              {group.tokens.map((token) => (
                <tr key={token.name} className="border-b border-future-border-subtle last:border-b-0">
                  <td className="px-4 py-2">
                    <code className="text-xs text-future-foreground-accent" style={{ fontFamily: fontFamily.monospace }}>
                      {token.name}
                    </code>
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-xs text-future-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                      {token.twClass}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-future-foreground-muted">{token.usage}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 shrink-0 rounded border border-future-border" style={{ backgroundColor: token.dark }} />
                      <div className="flex flex-col">
                        <code className="text-xs text-future-foreground-muted" style={{ fontFamily: fontFamily.monospace }}>
                          {token.dark}
                        </code>
                        <code className="text-[10px] text-future-foreground-accent/70" style={{ fontFamily: fontFamily.monospace }}>
                          {token.darkTw}
                        </code>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 shrink-0 rounded border border-future-border" style={{ backgroundColor: token.light }} />
                      <div className="flex flex-col">
                        <code className="text-xs text-future-foreground-muted" style={{ fontFamily: fontFamily.monospace }}>
                          {token.light}
                        </code>
                        <code className="text-[10px] text-future-foreground-accent/70" style={{ fontFamily: fontFamily.monospace }}>
                          {token.lightTw}
                        </code>
                      </div>
                    </div>
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

function GradientTable({ gradients }: { gradients: GradientToken[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-future-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-future-border bg-future-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Tailwind Class</th>
            <th className="px-4 py-2.5 text-center font-medium text-future-foreground-muted">Preview</th>
            <th className="px-4 py-2.5 text-center font-medium text-future-foreground-muted">Dark stops</th>
            <th className="px-4 py-2.5 text-center font-medium text-future-foreground-muted">Light stops</th>
          </tr>
        </thead>
        <tbody>
          {gradients.map((g) => (
            <tr key={g.name} className="border-b border-future-border-subtle last:border-b-0">
              <td className="px-4 py-2">
                <code className="text-xs text-future-foreground-accent" style={{ fontFamily: fontFamily.monospace }}>
                  {g.name}
                </code>
              </td>
              <td className="px-4 py-2">
                <code className="text-xs text-future-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                  {g.twClass}
                </code>
              </td>
              <td className="px-4 py-3">
                <div className={cn('mx-auto h-6 w-28 rounded border border-future-border', g.twClass)} />
              </td>
              <td className="px-4 py-2 text-center">
                <code className="text-[10px] text-future-foreground-accent/70" style={{ fontFamily: fontFamily.monospace }}>
                  {g.darkFrom} → {g.darkTo}
                </code>
              </td>
              <td className="px-4 py-2 text-center">
                <code className="text-[10px] text-future-foreground-accent/70" style={{ fontFamily: fontFamily.monospace }}>
                  {g.lightFrom} → {g.lightTo}
                </code>
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
        ({ light: 'future-light', 'legacy-dark': 'legacy-dark', 'legacy-light': 'legacy-light', wireframe: 'future-wireframe', vertex: 'future-vertex', canvas: 'future-canvas' } as Record<string, string>)[globals.futureTheme] ?? 'future-dark',
        'min-h-screen w-full bg-future-surface'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-6xl space-y-10 p-8">
        <div>
          <h1
            className="mb-2 text-3xl font-bold tracking-tight text-future-foreground"
            style={{ fontFamily: fontFamily.base }}
          >
            Color Tokens
          </h1>
          <p className="text-sm text-future-foreground-muted">
            All semantic color tokens for the Future design language. Each token resolves to a different value
            in dark and light themes via CSS custom properties. Use the Tailwind class column for implementation.
          </p>
        </div>

        <ColorTokenTable groups={colorGroups} />

        <div>
          <h2
            className="mb-4 text-xl font-bold tracking-tight text-future-foreground"
            style={{ fontFamily: fontFamily.base }}
          >
            Gradients
          </h2>
          <p className="mb-4 text-sm text-future-foreground-muted">
            Theme-aware background gradients defined as custom utilities. Preview reflects the active theme.
          </p>
          <GradientTable gradients={gradientTokens} />
        </div>
      </div>
    </div>
  ),
};
