import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from './typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Theme/Future/Theme',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Theme helpers
// ============================================================================

type ThemeFamily = 'future' | 'core';

/** Derive the theme family and variant from the Storybook global value */
function parseThemeGlobal(value: string): { family: ThemeFamily; variant: 'dark' | 'light'; override?: string } {
  if (value === 'core-dark') return { family: 'core', variant: 'dark' };
  if (value === 'core-light') return { family: 'core', variant: 'light' };
  if (value === 'wireframe') return { family: 'future', variant: 'light', override: 'wireframe' };
  if (value === 'vertex') return { family: 'future', variant: 'dark', override: 'vertex' };
  if (value === 'canvas') return { family: 'future', variant: 'dark', override: 'canvas' };
  if (value === 'light') return { family: 'future', variant: 'light' };
  return { family: 'future', variant: 'dark' };
}

/** Get the CSS class for a given family + variant, respecting demo theme overrides */
function themeClass(family: ThemeFamily, variant: 'dark' | 'light', override?: string) {
  if (override) return override;
  return family === 'core'
    ? variant === 'light' ? 'core-light' : 'core-dark'
    : variant === 'light' ? 'future-light' : 'future-dark';
}

// ============================================================================
// Shared helpers
// ============================================================================

/** Page chrome uses shadcn bridge tokens (bg-background, text-foreground, etc.)
 *  so they resolve correctly under both .future-* and .core-* theme classes. */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 text-2xl font-bold tracking-tight text-foreground"
      style={{ fontFamily: fontFamily.base }}
    >
      {children}
    </h2>
  );
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-6 text-sm leading-relaxed text-muted-foreground"
      style={{ fontFamily: fontFamily.base }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground"
      style={{ fontFamily: fontFamily.monospace }}
    >
      {children}
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-primary">
      {children}
    </code>
  );
}

// ============================================================================
// Future preview card
// ============================================================================

function FuturePreviewCard({ theme }: { theme: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-brand" />
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
          {theme}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-foreground">Card title</h3>
        <p className="text-sm text-foreground-muted">
          Body text uses the muted foreground token for secondary information and descriptions.
        </p>
      </div>

      <Input placeholder="Search…" className="bg-surface-overlay" />

      <div className="flex items-center gap-3">
        <Button size="sm" className="bg-brand text-foreground-on-accent hover:bg-brand/90">
          Primary
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-surface text-foreground hover:bg-surface-hover"
        >
          Secondary
        </Button>
        <Button variant="ghost" size="sm" className="text-foreground hover:bg-surface-hover">
          Ghost
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        {[
          { bg: 'bg-surface', label: 'surface' },
          { bg: 'bg-surface-raised', label: 'raised' },
          { bg: 'bg-surface-overlay', label: 'overlay' },
          { bg: 'bg-surface-hover', label: 'hover' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div className={cn('h-8 w-8 rounded-md border border-border', s.bg)} />
            <span className="text-[10px] text-foreground-subtle">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Core preview card
// ============================================================================

function CorePreviewCard({ theme }: { theme: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-brand" />
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
          {theme}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-foreground">Card title</h3>
        <p className="text-sm text-foreground-muted">
          Body text uses the muted foreground token for secondary information and descriptions.
        </p>
      </div>

      <Input placeholder="Search…" className="border-border-subtle bg-surface-overlay text-foreground placeholder:text-foreground-subtle" />

      <div className="flex items-center gap-3">
        <Button size="sm" className="bg-brand text-foreground-on-accent hover:bg-brand-hover">
          Primary
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-border-subtle bg-surface text-foreground hover:bg-surface-hover"
        >
          Secondary
        </Button>
        <Button variant="ghost" size="sm" className="text-foreground hover:bg-surface-hover">
          Ghost
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        {[
          { bg: 'bg-surface', label: 'surface' },
          { bg: 'bg-surface-raised', label: 'raised' },
          { bg: 'bg-surface-overlay', label: 'overlay' },
          { bg: 'bg-surface-hover', label: 'hover' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div className={cn('h-8 w-8 rounded-md border border-border', s.bg)} />
            <span className="text-[10px] text-foreground-subtle">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Token tables
// ============================================================================

const futureTokenGroups = [
  {
    group: 'Surface',
    tokens: [
      { name: 'surface', usage: 'Page / canvas background', dark: '#09090b', darkTw: 'zinc-950', light: '#ffffff', lightTw: 'white' },
      { name: 'surface-raised', usage: 'Cards, panels, overlays', dark: '#18181b', darkTw: 'zinc-900', light: '#fafafa', lightTw: 'zinc-50' },
      { name: 'surface-overlay', usage: 'Inputs, tabs, icon rail', dark: '#27272a', darkTw: 'zinc-800', light: '#f4f4f5', lightTw: 'zinc-100' },
      { name: 'surface-hover', usage: 'Hover, selected nav', dark: '#3f3f46', darkTw: 'zinc-700', light: '#e4e4e7', lightTw: 'zinc-200' },
    ],
  },
  {
    group: 'Foreground',
    tokens: [
      { name: 'foreground', usage: 'Primary headings', dark: '#fafafa', darkTw: 'zinc-50', light: '#09090b', lightTw: 'zinc-950' },
      { name: 'foreground-muted', usage: 'Nav, secondary UI', dark: '#a1a1aa', darkTw: 'zinc-400', light: '#71717a', lightTw: 'zinc-500' },
      { name: 'foreground-subtle', usage: 'Labels, placeholders', dark: '#71717a', darkTw: 'zinc-500', light: '#a1a1aa', lightTw: 'zinc-400' },
    ],
  },
  {
    group: 'Brand',
    tokens: [
      { name: 'brand', usage: 'Logo, primary buttons, active indicators', dark: '#0891b2', darkTw: 'cyan-600', light: '#0891b2', lightTw: 'cyan-600' },
      { name: 'brand-subtle', usage: 'Selected state bg, active nav, status badges', dark: '#083344', darkTw: 'cyan-950', light: '#ecfeff', lightTw: 'cyan-50' },
    ],
  },
  {
    group: 'Border',
    tokens: [
      { name: 'border', usage: 'Primary borders', dark: '#3f3f46', darkTw: 'zinc-700', light: '#d4d4d8', lightTw: 'zinc-300' },
      { name: 'border-subtle', usage: 'Subtle dividers', dark: '#27272a', darkTw: 'zinc-800', light: '#e4e4e7', lightTw: 'zinc-200' },
    ],
  },
];

const coreTokenGroups = [
  {
    group: 'Surface',
    tokens: [
      { name: 'surface', usage: 'Page / canvas background', dark: '#182027', light: '#ffffff', lightTw: 'white' },
      { name: 'surface-raised', usage: 'Cards, panels', dark: '#273139', light: '#ffffff', lightTw: 'white' },
      { name: 'surface-overlay', usage: 'Secondary bg, inputs', dark: '#374652', light: '#f4f5f7' },
      { name: 'surface-hover', usage: 'Hover states', dark: '#526069', light: '#e9f1fa' },
    ],
  },
  {
    group: 'Foreground',
    tokens: [
      { name: 'foreground', usage: 'Primary text', dark: '#f4f5f7', light: '#273139' },
      { name: 'foreground-muted', usage: 'De-emphasized text', dark: '#cfd8dd', light: '#526069' },
      { name: 'foreground-subtle', usage: 'Labels, disabled', dark: '#a4b1b8', light: '#8a97a0' },
    ],
  },
  {
    group: 'Accent',
    tokens: [
      { name: 'brand', usage: 'Primary blue', dark: '#66adff', light: '#0067df' },
      { name: 'brand-hover', usage: 'Primary hover', dark: '#87bfff', light: '#0056ba' },
    ],
  },
  {
    group: 'Border',
    tokens: [
      { name: 'border', usage: 'Primary borders', dark: '#8a97a0', light: '#a4b1b8' },
      { name: 'border-subtle', usage: 'Subtle dividers', dark: '#526069', light: '#cfd8dd' },
    ],
  },
];

function TokenTable({ groups }: { groups: typeof futureTokenGroups }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm" style={{ fontFamily: fontFamily.base }}>
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Token</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Usage</th>
            <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Dark</th>
            <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Light</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.group}>
              <tr className="border-b border-border bg-card/50">
                <td
                  colSpan={4}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {group.group}
                </td>
              </tr>
              {group.tokens.map((token) => (
                <tr key={token.name} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2">
                    <code className="text-xs text-primary" style={{ fontFamily: fontFamily.monospace }}>
                      {token.name}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{token.usage}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: token.dark }} />
                      <div className="flex flex-col">
                        <code className="text-xs text-muted-foreground" style={{ fontFamily: fontFamily.monospace }}>
                          {token.dark}
                        </code>
                        {'darkTw' in token && (token as { darkTw?: string }).darkTw && (
                          <code className="text-[10px] text-primary/70" style={{ fontFamily: fontFamily.monospace }}>
                            {(token as { darkTw: string }).darkTw}
                          </code>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: token.light }} />
                      <div className="flex flex-col">
                        <code className="text-xs text-muted-foreground" style={{ fontFamily: fontFamily.monospace }}>
                          {token.light}
                        </code>
                        {'lightTw' in token && (token as { lightTw?: string }).lightTw && (
                          <code className="text-[10px] text-primary/70" style={{ fontFamily: fontFamily.monospace }}>
                            {(token as { lightTw: string }).lightTw}
                          </code>
                        )}
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

// ============================================================================
// Tab content — Future
// ============================================================================

function FutureTabContent() {
  return (
    <>
      {/* ── Side-by-side preview ───────────────────────────────────────── */}
      <SectionTitle>Theme preview</SectionTitle>
      <SectionDescription>
        The same component rendered in both themes. All tokens resolve
        automatically — no conditional styling needed.
      </SectionDescription>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="future-dark rounded-xl bg-surface p-4">
          <FuturePreviewCard theme="Dark" />
        </div>
        <div className="future-light rounded-xl bg-surface p-4">
          <FuturePreviewCard theme="Light" />
        </div>
      </div>

      <Divider />

      {/* ── Token overview ─────────────────────────────────────────────── */}
      <SectionTitle>Token overview</SectionTitle>
      <SectionDescription>
        Key semantic tokens and their resolved values per theme. See the
        Colors page for the full token reference.
      </SectionDescription>

      <TokenTable groups={futureTokenGroups} />

      <Divider />

      {/* ── How to use ─────────────────────────────────────────────────── */}
      <SectionTitle>How to use</SectionTitle>
      <SectionDescription>
        Apply <InlineCode>.future-dark</InlineCode> or <InlineCode>.future-light</InlineCode> to
        any container. Everything inside inherits the correct token values.
        Templates like <InlineCode>MaestroTemplate</InlineCode> handle
        this automatically via their <InlineCode>theme</InlineCode> prop.
      </SectionDescription>

      <div className="flex flex-col gap-4">
        <CodeBlock>{`<!-- Wrap any container with the theme class -->
<div class="future-dark">
  <div class="bg-surface text-foreground">
    Dark themed content
  </div>
</div>

<div class="future-light">
  <div class="bg-surface text-foreground">
    Light themed content
  </div>
</div>`}</CodeBlock>

        <CodeBlock>{`<!-- Or use a template component that handles it for you -->
<MaestroTemplate theme="dark">
  {/* children automatically inherit dark theme tokens */}
</MaestroTemplate>`}</CodeBlock>
      </div>

      <Divider />

      {/* ── Shadcn bridge ──────────────────────────────────────────────── */}
      <SectionTitle>Shadcn component compatibility</SectionTitle>
      <SectionDescription>
        The Future theme includes a built-in bridge that maps standard shadcn CSS
        variables to their Future token equivalents. This means shadcn/ui
        components like Button, Input, DataTable, and DropdownMenu work
        automatically inside any themed container — no extra configuration needed.
      </SectionDescription>

      <CodeBlock>{`/* themes.css — shadcn aliases (excerpt) */

.future-dark {
  --color-background:   var(--surface);
  --color-foreground:   var(--foreground);
  --color-primary:      var(--accent);
  --color-muted:        var(--surface-overlay);
  --color-border:       var(--border);
  --color-input:        var(--border);
  --color-ring:         var(--ring);
  /* … full mapping in themes.css */
}`}</CodeBlock>
    </>
  );
}

// ============================================================================
// Tab content — Core
// ============================================================================

function CoreTabContent() {
  return (
    <>
      {/* ── Side-by-side preview ───────────────────────────────────────── */}
      <SectionTitle>Theme preview</SectionTitle>
      <SectionDescription>
        The same component rendered in both Core themes. The Core design
        language uses the apollo-core token set from UiPath&apos;s original
        design system.
      </SectionDescription>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="core-dark rounded-xl bg-surface p-4">
          <CorePreviewCard theme="Dark" />
        </div>
        <div className="core-light rounded-xl bg-surface p-4">
          <CorePreviewCard theme="Light" />
        </div>
      </div>

      <Divider />

      {/* ── Token overview ─────────────────────────────────────────────── */}
      <SectionTitle>Token overview</SectionTitle>
      <SectionDescription>
        Key semantic tokens from the Core (apollo-core) design system and their
        resolved values per theme.
      </SectionDescription>

      <TokenTable groups={coreTokenGroups} />

      <Divider />

      {/* ── How to use ─────────────────────────────────────────────────── */}
      <SectionTitle>How to use</SectionTitle>
      <SectionDescription>
        Apply <InlineCode>.core-dark</InlineCode> or <InlineCode>.core-light</InlineCode> to
        any container. The Core theme maps apollo-core token values into scoped
        CSS classes that work at any DOM level — just like the Future theme.
      </SectionDescription>

      <div className="flex flex-col gap-4">
        <CodeBlock>{`<!-- Wrap any container with the theme class -->
<div class="core-dark">
  <div class="bg-surface text-foreground">
    Dark themed content
  </div>
</div>

<div class="core-light">
  <div class="bg-surface text-foreground">
    Light themed content
  </div>
</div>`}</CodeBlock>

        <CodeBlock>{`/* Core tokens use the same bare names as Future */
/* bg-surface, text-foreground, border-border, etc. */

/* The shadcn bridge is also included, so shadcn components
   inherit the correct Core colors automatically. */`}</CodeBlock>
      </div>

      <Divider />

      {/* ── Shadcn bridge ──────────────────────────────────────────────── */}
      <SectionTitle>Shadcn component compatibility</SectionTitle>
      <SectionDescription>
        Like the Future theme, the Core theme includes a shadcn bridge so standard
        components work automatically. The Core bridge maps apollo-core variables
        to shadcn expected names.
      </SectionDescription>

      <CodeBlock>{`/* themes.css — core shadcn aliases (excerpt) */

.core-dark {
  --color-background:   var(--surface);
  --color-foreground:   var(--foreground);
  --color-primary:      var(--accent);
  --color-muted:        var(--surface-raised);
  --color-border:       var(--border-subtle);
  --color-input:        var(--border-subtle);
  --color-ring:         var(--ring);
  /* … full mapping in themes.css */
}`}</CodeBlock>
    </>
  );
}

// ============================================================================
// Story
// ============================================================================

const themeTabs = ['Future', 'Core'] as const;

function ThemePage({ globalTheme }: { globalTheme: string }) {
  const { family } = parseThemeGlobal(globalTheme);
  const [activeTab, setActiveTab] = React.useState<ThemeFamily>(family);

  // Sync tab when toolbar selection changes family
  React.useEffect(() => {
    setActiveTab(family);
  }, [family]);

  const parsed = parseThemeGlobal(globalTheme);
  const activeThemeClass = themeClass(activeTab, parsed.variant, parsed.override);

  return (
    <div
      className={cn(activeThemeClass, 'min-h-screen w-full bg-background text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-4xl space-y-2 p-8">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SectionTitle>Theme</SectionTitle>
        <SectionDescription>
          Apollo ships with two design languages — <strong>Future</strong> (the
          new design direction) and <strong>Core</strong> (the original
          apollo-core tokens). Each provides dark and light variants activated
          via CSS classes. Use the toolbar selector above to switch themes, or
          use the tabs below to explore each design language.
        </SectionDescription>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-border pb-0">
          {themeTabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.toLowerCase() as ThemeFamily)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {activeTab === 'future' ? <FutureTabContent /> : <CoreTabContent />}
        </div>

        <Divider />

        {/* ── Adding new themes (shared) ─────────────────────────────── */}
        <SectionTitle>Adding new themes</SectionTitle>
        <SectionDescription>
          To create a new theme, define a new CSS class that sets the same set of
          CSS custom properties. All components using semantic tokens will
          automatically adapt to the new palette.
        </SectionDescription>

        <CodeBlock>{`/* Example: creating a new theme variant */

.my-brand-dark {
  --surface:        #0f172a;
  --surface-raised: #1e293b;
  --foreground:     #f8fafc;
  --accent:         #8b5cf6;
  /* … define all token variables */

  /* shadcn bridge */
  --color-background: var(--surface);
  --color-foreground: var(--foreground);
  /* … */
}`}</CodeBlock>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (_, { globals }) => (
    <ThemePage globalTheme={globals.futureTheme || 'dark'} />
  ),
};
