import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Spacing',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Token data
// ============================================================================

interface SpacingToken {
  token: string;
  px: number;
  twClass: string;
  usage: string;
}

interface SpacingGroup {
  group: string;
  description?: string;
  tokens: SpacingToken[];
}

const spacingGroups: SpacingGroup[] = [
  {
    group: 'Scale',
    description: 'Tailwind spacing scale (1 unit = 4px)',
    tokens: [
      { token: '0', px: 0, twClass: 'p-0', usage: 'Reset padding' },
      { token: '1', px: 4, twClass: 'p-1, gap-1', usage: 'Tight padding' },
      { token: '2', px: 8, twClass: 'p-2, gap-2', usage: 'Default gaps' },
      { token: '3', px: 12, twClass: 'px-3, py-3', usage: 'Inline padding' },
      { token: '4', px: 16, twClass: 'p-4, gap-4', usage: 'Content padding' },
      { token: '5', px: 20, twClass: 'py-5', usage: 'Section padding' },
      { token: '6', px: 24, twClass: 'gap-6, px-6', usage: 'Large gaps' },
      { token: '7', px: 28, twClass: 'gap-7', usage: 'Chat message gap (Flow)' },
      { token: '8', px: 32, twClass: 'gap-8', usage: 'Section gaps' },
      { token: '10', px: 40, twClass: 'px-10', usage: 'Page horizontal padding' },
    ],
  },
  {
    group: 'Half units',
    description: 'Fractional spacing for tighter control',
    tokens: [
      { token: '0.5', px: 2, twClass: 'gap-0.5', usage: 'Tight gaps' },
      { token: '2.5', px: 10, twClass: 'pt-2.5', usage: 'Node card padding, toolbar' },
    ],
  },
  {
    group: 'Arbitrary',
    description: 'Custom values outside the Tailwind scale, used via bracket notation',
    tokens: [
      { token: '15', px: 15, twClass: 'gap-[15px]', usage: 'Flow node gap' },
      { token: '18', px: 18, twClass: 'gap-[18px], pt-[18px]', usage: 'Delegate layout gaps' },
      { token: '20', px: 20, twClass: 'mt-20', usage: 'Delegate top margin' },
      { token: '37', px: 37, twClass: 'gap-[37px]', usage: 'Delegate section gap' },
      { token: '60', px: 60, twClass: 'w-[60px], h-[60px]', usage: 'Panel icon rail' },
      { token: '78', px: 78, twClass: 'min-h-[78px]', usage: 'Delegate card min-height' },
      { token: '124', px: 124, twClass: 'min-h-[124px]', usage: 'Delegate card min-height' },
      { token: '360', px: 360, twClass: 'w-[360px], h-[360px]', usage: 'Flow node size' },
      { token: '420', px: 420, twClass: 'w-[420px]', usage: 'Flow expanded panel width' },
      { token: '680', px: 680, twClass: 'max-w-[680px]', usage: 'Properties bar max-width' },
      { token: '800', px: 800, twClass: 'max-w-[800px]', usage: 'Delegate content max-width' },
      { token: '930', px: 930, twClass: 'w-[930px]', usage: 'Properties expanded panel' },
    ],
  },
];

// ============================================================================
// Table component
// ============================================================================

function SpacingTable({ groups }: { groups: SpacingGroup[] }) {
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
          {groups.map((group) => (
            <React.Fragment key={group.group}>
              <tr className="border-b border-border bg-surface-raised/50">
                <td
                  colSpan={5}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted"
                >
                  {group.group}
                  {group.description && (
                    <span className="ml-2 font-normal normal-case tracking-normal text-foreground-subtle">
                      — {group.description}
                    </span>
                  )}
                </td>
              </tr>
              {group.tokens.map((token) => (
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
                  <td className="px-4 py-2">
                    <div
                      className="h-4 rounded bg-brand/60"
                      style={{ width: `${Math.min(token.px, 120)}px`, minWidth: token.px > 0 ? '2px' : '0px' }}
                    />
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
        ({ light: 'future-light', 'core-dark': 'core-dark', 'core-light': 'core-light', wireframe: 'wireframe', vertex: 'vertex', canvas: 'canvas' } as Record<string, string>)[globals.futureTheme] ?? 'future-dark',
        'min-h-screen w-full bg-surface'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-5xl space-y-10 p-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Spacing Tokens
          </h1>
          <p className="text-sm text-foreground-muted">
            All spacing values used in Future templates. Scale tokens map to Tailwind's built-in spacing utilities.
            Arbitrary values use bracket notation.
          </p>
        </div>

        <SpacingTable groups={spacingGroups} />
      </div>
    </div>
  ),
};
