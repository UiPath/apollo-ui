import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
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

interface CodeSyntaxToken {
  name: string;
  usage: string;
  darkVar: string;
  darkTw: string;
  darkHex: string;
  lightVar: string;
  lightTw: string;
  lightHex: string;
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
      {
        name: 'surface',
        twClass: 'bg-surface',
        usage: 'Page, canvas, containers',
        dark: '#09090b',
        darkTw: 'zinc-950',
        light: '#fafafa',
        lightTw: 'zinc-50',
      },
      {
        name: 'surface-raised',
        twClass: 'bg-surface-raised',
        usage: 'Properties bar & panel (Flow); cards, overlays, panels',
        dark: '#18181b',
        darkTw: 'zinc-900',
        light: '#f4f4f5',
        lightTw: 'zinc-100',
      },
      {
        name: 'surface-overlay',
        twClass: 'bg-surface-overlay',
        usage: 'Left panel (Flow, Delegate); panels, inputs, tabs, icon rail',
        dark: '#27272a',
        darkTw: 'zinc-800',
        light: '#e4e4e7',
        lightTw: 'zinc-200',
      },
      {
        name: 'surface-hover',
        twClass: 'bg-surface-hover',
        usage: 'Nav hover, selected state',
        dark: '#3f3f46',
        darkTw: 'zinc-700',
        light: '#d4d4d8',
        lightTw: 'zinc-300',
      },
      {
        name: 'surface-muted',
        twClass: 'bg-surface-muted',
        usage: 'Badges, indicators',
        dark: '#71717a',
        darkTw: 'zinc-500',
        light: '#a1a1aa',
        lightTw: 'zinc-400',
      },
      {
        name: 'surface-inverse',
        twClass: 'bg-surface-inverse',
        usage: 'Buttons on opposite bg',
        dark: '#fafafa',
        darkTw: 'zinc-50',
        light: '#09090b',
        lightTw: 'zinc-950',
      },
    ],
  },
  {
    group: 'Brand',
    tokens: [
      {
        name: 'brand',
        twClass: 'bg-brand',
        usage: 'Logo, primary buttons, active indicators',
        dark: '#0891b2',
        darkTw: 'cyan-600',
        light: '#0891b2',
        lightTw: 'cyan-600',
      },
      {
        name: 'brand-subtle',
        twClass: 'bg-brand-subtle',
        usage: 'Selected state bg, active nav, status badges',
        dark: '#083344',
        darkTw: 'cyan-950',
        light: '#ecfeff',
        lightTw: 'cyan-50',
      },
    ],
  },
  {
    group: 'Foreground',
    tokens: [
      {
        name: 'foreground',
        twClass: 'text-foreground',
        usage: 'Primary headings',
        dark: '#fafafa',
        darkTw: 'zinc-50',
        light: '#09090b',
        lightTw: 'zinc-950',
      },
      {
        name: 'foreground-secondary',
        twClass: 'text-foreground-secondary',
        usage: 'Body, messages',
        dark: '#f4f4f5',
        darkTw: 'zinc-100',
        light: '#18181b',
        lightTw: 'zinc-900',
      },
      {
        name: 'foreground-hover',
        twClass: 'text-foreground-hover',
        usage: 'Hover states',
        dark: '#d4d4d8',
        darkTw: 'zinc-300',
        light: '#52525b',
        lightTw: 'zinc-600',
      },
      {
        name: 'foreground-muted',
        twClass: 'text-foreground-muted',
        usage: 'Nav, secondary UI, code',
        dark: '#a1a1aa',
        darkTw: 'zinc-400',
        light: '#71717a',
        lightTw: 'zinc-500',
      },
      {
        name: 'foreground-subtle',
        twClass: 'text-foreground-subtle',
        usage: 'Labels, placeholders',
        dark: '#71717a',
        darkTw: 'zinc-500',
        light: '#a1a1aa',
        lightTw: 'zinc-400',
      },
      {
        name: 'foreground-inverse',
        twClass: 'text-foreground-inverse',
        usage: 'Icons on inverse bg',
        dark: '#09090b',
        darkTw: 'zinc-950',
        light: '#fafafa',
        lightTw: 'zinc-50',
      },
      {
        name: 'foreground-on-accent',
        twClass: 'text-foreground-on-accent',
        usage: 'Text on accent bg',
        dark: '#fafafa',
        darkTw: 'zinc-50',
        light: '#fafafa',
        lightTw: 'zinc-50',
      },
      {
        name: 'foreground-accent',
        twClass: 'text-foreground-accent',
        usage: 'Accent text, icons',
        dark: '#0891b2',
        darkTw: 'cyan-600',
        light: '#0891b2',
        lightTw: 'cyan-600',
      },
      {
        name: 'foreground-accent-muted',
        twClass: 'text-foreground-accent-muted',
        usage: 'Muted accent text',
        dark: '#22d3ee',
        darkTw: 'cyan-400',
        light: '#0891b2',
        lightTw: 'cyan-600',
      },
    ],
  },
  {
    group: 'Border',
    tokens: [
      {
        name: 'border',
        twClass: 'border-border',
        usage: 'Primary borders',
        dark: '#3f3f46',
        darkTw: 'zinc-700',
        light: '#d4d4d8',
        lightTw: 'zinc-300',
      },
      {
        name: 'border-subtle',
        twClass: 'border-border-subtle',
        usage: 'Subtle dividers',
        dark: '#27272a',
        darkTw: 'zinc-800',
        light: '#e4e4e7',
        lightTw: 'zinc-200',
      },
      {
        name: 'border-muted',
        twClass: 'border-border-muted',
        usage: 'Content borders',
        dark: '#18181b',
        darkTw: 'zinc-900',
        light: '#f4f4f5',
        lightTw: 'zinc-100',
      },
      {
        name: 'border-deep',
        twClass: 'border-border-deep',
        usage: 'Nested containers',
        dark: '#09090b',
        darkTw: 'zinc-950',
        light: '#fafafa',
        lightTw: 'zinc-50',
      },
      {
        name: 'border-inverse',
        twClass: 'border-border-inverse',
        usage: 'Borders on inverse bg',
        dark: '#e4e4e7',
        darkTw: 'zinc-200',
        light: '#3f3f46',
        lightTw: 'zinc-700',
      },
      {
        name: 'border-hover',
        twClass: 'border-border-hover',
        usage: 'Border hover state',
        dark: '#52525b',
        darkTw: 'zinc-600',
        light: '#a1a1aa',
        lightTw: 'zinc-400',
      },
    ],
  },
  {
    group: 'Ring',
    tokens: [
      {
        name: 'ring',
        twClass: 'ring-ring',
        usage: 'Focus / selection ring',
        dark: '#52525b',
        darkTw: 'zinc-600',
        light: '#a1a1aa',
        lightTw: 'zinc-400',
      },
    ],
  },
];

const gradientTokens: GradientToken[] = [
  {
    name: 'gradient-1',
    twClass: 'bg-gradient-1',
    darkFrom: 'zinc-700',
    darkTo: 'zinc-800',
    lightFrom: 'zinc-200',
    lightTo: 'zinc-100',
  },
  {
    name: 'gradient-2',
    twClass: 'bg-gradient-2',
    darkFrom: 'zinc-950',
    darkTo: 'zinc-900',
    lightFrom: 'zinc-50',
    lightTo: 'zinc-50',
  },
  {
    name: 'gradient-3',
    twClass: 'bg-gradient-3',
    darkFrom: 'zinc-700',
    darkTo: 'zinc-900',
    lightFrom: 'zinc-200',
    lightTo: 'zinc-50',
  },
  {
    name: 'gradient-4',
    twClass: 'bg-gradient-4',
    darkFrom: 'zinc-900',
    darkTo: 'zinc-800',
    lightFrom: 'zinc-50',
    lightTo: 'zinc-100',
  },
  {
    name: 'gradient-5',
    twClass: 'bg-gradient-5',
    darkFrom: 'zinc-950',
    darkTo: 'zinc-900',
    lightFrom: 'zinc-50',
    lightTo: 'zinc-50',
  },
  {
    name: 'gradient-6',
    twClass: 'bg-gradient-6',
    darkFrom: 'cyan-600',
    darkTo: 'cyan-950',
    lightFrom: 'cyan-400',
    lightTo: 'cyan-100',
  },
];

const codeSyntaxTokens: CodeSyntaxToken[] = [
  {
    name: '--code-rest',
    usage: 'Default text, identifiers, plain code',
    darkVar: 'var(--color-zinc-400)',
    darkTw: 'zinc-400',
    darkHex: '#a1a1aa',
    lightVar: 'var(--color-zinc-600)',
    lightTw: 'zinc-600',
    lightHex: '#52525b',
  },
  {
    name: '--code-punctuation',
    usage: 'Brackets, commas, semicolons',
    darkVar: 'var(--color-zinc-500)',
    darkTw: 'zinc-500',
    darkHex: '#71717a',
    lightVar: 'var(--color-zinc-500)',
    lightTw: 'zinc-500',
    lightHex: '#71717a',
  },
  {
    name: '--code-key',
    usage: 'Keywords, properties, attributes',
    darkVar: 'var(--color-cyan-400)',
    darkTw: 'cyan-400',
    darkHex: '#22d3ee',
    lightVar: 'var(--color-cyan-700)',
    lightTw: 'cyan-700',
    lightHex: '#0e7490',
  },
  {
    name: '--code-string',
    usage: 'String values',
    darkVar: 'var(--color-emerald-400)',
    darkTw: 'emerald-400',
    darkHex: '#34d399',
    lightVar: 'var(--color-emerald-700)',
    lightTw: 'emerald-700',
    lightHex: '#047857',
  },
  {
    name: '--code-number',
    usage: 'Numeric literals',
    darkVar: 'var(--color-amber-400)',
    darkTw: 'amber-400',
    darkHex: '#fbbf24',
    lightVar: 'var(--color-amber-700)',
    lightTw: 'amber-700',
    lightHex: '#b45309',
  },
  {
    name: '--code-literal',
    usage: 'Booleans, null, undefined',
    darkVar: 'var(--color-violet-400)',
    darkTw: 'violet-400',
    darkHex: '#a78bfa',
    lightVar: 'var(--color-violet-600)',
    lightTw: 'violet-600',
    lightHex: '#7c3aed',
  },
];

// ============================================================================
// Table components
// ============================================================================

function ColorTokenTable({ groups }: { groups: ColorGroup[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Usage</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">
              Tailwind Class
            </th>
            <th className="w-56 px-4 py-2.5 text-left font-medium text-foreground-muted">CSS Variable</th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">Dark</th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">Light</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.group}>
              <tr className="border-b border-border bg-surface-raised/50">
                <td
                  colSpan={6}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted"
                >
                  {group.group}
                </td>
              </tr>
              {group.tokens.map((token) => (
                <tr key={token.name} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2">
                    <code
                      className="text-xs text-foreground-accent"
                      style={{ fontFamily: fontFamily.monospace }}
                    >
                      {token.name}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-xs text-foreground-muted">{token.usage}</td>
                  <td className="px-4 py-2">
                    <code
                      className="text-xs text-foreground-subtle"
                      style={{ fontFamily: fontFamily.monospace }}
                    >
                      {token.twClass}
                    </code>
                  </td>
                  <td className="w-56 px-4 py-2">
                    <div className="flex flex-col gap-0.5">
                      <code
                        className="whitespace-nowrap text-[10px] text-foreground-accent/70"
                        style={{ fontFamily: fontFamily.monospace }}
                      >
                        {`var(--color-${token.darkTw})`}
                      </code>
                      <code
                        className="whitespace-nowrap text-[10px] text-foreground-subtle"
                        style={{ fontFamily: fontFamily.monospace }}
                      >
                        {`var(--color-${token.lightTw})`}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-start gap-2">
                      <div
                        className="h-5 w-5 shrink-0 rounded border border-border"
                        style={{ backgroundColor: token.dark }}
                      />
                      <div className="flex flex-col">
                        <code
                          className="whitespace-nowrap text-xs text-foreground-muted"
                          style={{ fontFamily: fontFamily.monospace }}
                        >
                          {token.dark}
                        </code>
                        <code
                          className="whitespace-nowrap text-[10px] text-foreground-accent/70"
                          style={{ fontFamily: fontFamily.monospace }}
                        >
                          {token.darkTw}
                        </code>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-start gap-2">
                      <div
                        className="h-5 w-5 shrink-0 rounded border border-border"
                        style={{ backgroundColor: token.light }}
                      />
                      <div className="flex flex-col">
                        <code
                          className="whitespace-nowrap text-xs text-foreground-muted"
                          style={{ fontFamily: fontFamily.monospace }}
                        >
                          {token.light}
                        </code>
                        <code
                          className="whitespace-nowrap text-[10px] text-foreground-accent/70"
                          style={{ fontFamily: fontFamily.monospace }}
                        >
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

function CodeSyntaxTable({ tokens }: { tokens: CodeSyntaxToken[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Usage</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">
              Tailwind Class
            </th>
            <th className="w-56 px-4 py-2.5 text-left font-medium text-foreground-muted">CSS Variable</th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">Dark</th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">Light</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.name} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-2">
                <code
                  className="text-xs text-foreground-accent"
                  style={{ fontFamily: fontFamily.monospace }}
                >
                  {token.name}
                </code>
              </td>
              <td className="px-4 py-2 text-xs text-foreground-muted">{token.usage}</td>
              <td className="px-4 py-2">
                <code
                  className="text-xs text-foreground-subtle"
                  style={{ fontFamily: fontFamily.monospace }}
                >
                  —
                </code>
              </td>
              <td className="w-56 px-4 py-2">
                <div className="flex flex-col gap-0.5">
                  <code
                    className="whitespace-nowrap text-[10px] text-foreground-accent/70"
                    style={{ fontFamily: fontFamily.monospace }}
                  >
                    {token.darkVar}
                  </code>
                  <code
                    className="whitespace-nowrap text-[10px] text-foreground-subtle"
                    style={{ fontFamily: fontFamily.monospace }}
                  >
                    {token.lightVar}
                  </code>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-start gap-2">
                  <div
                    className="h-5 w-5 shrink-0 rounded border border-border"
                    style={{ backgroundColor: token.darkHex }}
                  />
                  <div className="flex flex-col">
                    <code
                      className="whitespace-nowrap text-xs text-foreground-muted"
                      style={{ fontFamily: fontFamily.monospace }}
                    >
                      {token.darkHex}
                    </code>
                    <code
                      className="whitespace-nowrap text-[10px] text-foreground-accent/70"
                      style={{ fontFamily: fontFamily.monospace }}
                    >
                      {token.darkTw}
                    </code>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-start gap-2">
                  <div
                    className="h-5 w-5 shrink-0 rounded border border-border"
                    style={{ backgroundColor: token.lightHex }}
                  />
                  <div className="flex flex-col">
                    <code
                      className="whitespace-nowrap text-xs text-foreground-muted"
                      style={{ fontFamily: fontFamily.monospace }}
                    >
                      {token.lightHex}
                    </code>
                    <code
                      className="whitespace-nowrap text-[10px] text-foreground-accent/70"
                      style={{ fontFamily: fontFamily.monospace }}
                    >
                      {token.lightTw}
                    </code>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GradientTable({ gradients }: { gradients: GradientToken[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-foreground-muted">
              Tailwind Class
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">Preview</th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">
              Dark stops
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-foreground-muted">
              Light stops
            </th>
          </tr>
        </thead>
        <tbody>
          {gradients.map((g) => (
            <tr key={g.name} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-2">
                <code
                  className="text-xs text-foreground-accent"
                  style={{ fontFamily: fontFamily.monospace }}
                >
                  {g.name}
                </code>
              </td>
              <td className="px-4 py-2">
                <code
                  className="text-xs text-foreground-subtle"
                  style={{ fontFamily: fontFamily.monospace }}
                >
                  {g.twClass}
                </code>
              </td>
              <td className="px-4 py-3">
                <div className={cn('mx-auto h-6 w-28 rounded border border-border', g.twClass)} />
              </td>
              <td className="px-4 py-2 text-center">
                <code
                  className="text-[10px] text-foreground-accent/70"
                  style={{ fontFamily: fontFamily.monospace }}
                >
                  {g.darkFrom} → {g.darkTo}
                </code>
              </td>
              <td className="px-4 py-2 text-center">
                <code
                  className="text-[10px] text-foreground-accent/70"
                  style={{ fontFamily: fontFamily.monospace }}
                >
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
  render: () => (
    <div className="min-h-screen w-full bg-surface" style={{ fontFamily: fontFamily.base }}>
      <div className="mx-auto max-w-6xl space-y-10 p-8">
        <div>
          <h1
            className="mb-2 text-3xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: fontFamily.base }}
          >
            Color Tokens
          </h1>
          <p className="text-sm text-foreground-muted">
            All semantic color tokens for the Future design language. Each token resolves to a
            different value in dark and light themes via CSS custom properties. Use the Tailwind
            class column for implementation.
          </p>
        </div>

        <ColorTokenTable groups={colorGroups} />

        <div>
          <h2
            className="mb-4 text-xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: fontFamily.base }}
          >
            Components
          </h2>
          <p className="mb-6 text-sm text-foreground-muted">
            Semantic color tokens scoped to specific components. Each token maps to a Tailwind v4
            palette variable and resolves to a different value in dark and light themes. Reference
            tokens directly via <code style={{ fontFamily: fontFamily.monospace }}>var(--code-*)</code> in component styles.
          </p>
          <h3
            className="mb-3 text-sm font-semibold tracking-tight text-foreground"
            style={{ fontFamily: fontFamily.base }}
          >
            Code Block
          </h3>
          <CodeSyntaxTable tokens={codeSyntaxTokens} />
        </div>

        <div>
          <h2
            className="mb-4 text-xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: fontFamily.base }}
          >
            Gradients
          </h2>
          <p className="mb-4 text-sm text-foreground-muted">
            Theme-aware background gradients defined as custom utilities. Preview reflects the
            active theme.
          </p>
          <GradientTable gradients={gradientTokens} />
        </div>
      </div>
    </div>
  ),
};
