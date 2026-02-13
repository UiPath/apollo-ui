import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';

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
// Token data
// ============================================================================

interface ResponsiveToken {
  token: string;
  px: number;
  usage: string;
}

interface ResponsiveGroup {
  group: string;
  description: string;
  tokens: ResponsiveToken[];
}

const responsiveGroups: ResponsiveGroup[] = [
  {
    group: 'Breakpoints',
    description: 'Min-width values for layout behavior via matchMedia()',
    tokens: [
      { token: 'viewportGuard', px: 769, usage: 'Content visible at this width; below shows overlay' },
      { token: 'panelExpand', px: 1025, usage: 'Left panel expanded at this width; below collapsed' },
    ],
  },
  {
    group: 'Viewport presets',
    description: 'Named widths for Storybook viewport dropdown and testing',
    tokens: [
      { token: 'xs', px: 540, usage: 'Screen XS — mobile' },
      { token: 's', px: 768, usage: 'Screen S — tablet' },
      { token: 'm', px: 1024, usage: 'Screen M — small desktop' },
      { token: 'l', px: 1440, usage: 'Screen L — standard desktop' },
      { token: 'xl', px: 1920, usage: 'Screen XL — wide desktop' },
    ],
  },
];

// ============================================================================
// Table component
// ============================================================================

function ResponsiveTable({ groups }: { groups: ResponsiveGroup[] }) {
  const maxPx = 1920;

  return (
    <div className="overflow-hidden rounded-lg border border-future-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-future-border bg-future-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-right font-medium text-future-foreground-muted">px</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Usage</th>
            <th className="px-4 py-2.5 text-left font-medium text-future-foreground-muted">Relative width</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.group}>
              <tr className="border-b border-future-border bg-future-surface-raised/50">
                <td
                  colSpan={4}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-future-foreground-muted"
                >
                  {group.group}
                  <span className="ml-2 font-normal normal-case tracking-normal text-future-foreground-subtle">
                    — {group.description}
                  </span>
                </td>
              </tr>
              {group.tokens.map((token) => (
                <tr key={token.token} className="border-b border-future-border-subtle last:border-b-0">
                  <td className="px-4 py-2">
                    <code className="text-xs text-future-accent-foreground" style={{ fontFamily: fontFamily.monospace }}>
                      {token.token}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <code className="text-xs tabular-nums text-future-foreground-muted" style={{ fontFamily: fontFamily.monospace }}>
                      {token.px}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-future-foreground-muted">{token.usage}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 rounded bg-future-accent/60"
                        style={{ width: `${(token.px / maxPx) * 100}%`, minWidth: '4px' }}
                      />
                      <span className="shrink-0 text-[10px] tabular-nums text-future-foreground-subtle" style={{ fontFamily: fontFamily.monospace }}>
                        {((token.px / maxPx) * 100).toFixed(0)}%
                      </span>
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
      <div className="mx-auto max-w-5xl space-y-10 p-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-future-foreground">
            Responsive Tokens
          </h1>
          <p className="text-sm text-future-foreground-muted">
            Breakpoints and viewport presets for the Future design language.
            Breakpoints control layout behavior; viewport presets are named widths for testing.
          </p>
        </div>

        <ResponsiveTable groups={responsiveGroups} />
      </div>
    </div>
  ),
};
