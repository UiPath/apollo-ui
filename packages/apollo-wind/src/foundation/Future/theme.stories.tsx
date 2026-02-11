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

type ThemeFamily = 'future' | 'legacy';

/** Derive the theme family and variant from the Storybook global value */
function parseThemeGlobal(value: string): { family: ThemeFamily; variant: 'dark' | 'light' } {
  if (value === 'legacy-dark') return { family: 'legacy', variant: 'dark' };
  if (value === 'legacy-light') return { family: 'legacy', variant: 'light' };
  if (value === 'light') return { family: 'future', variant: 'light' };
  return { family: 'future', variant: 'dark' };
}

/** Get the CSS class for a given family + variant */
function themeClass(family: ThemeFamily, variant: 'dark' | 'light') {
  return family === 'legacy'
    ? variant === 'light' ? 'legacy-light' : 'legacy-dark'
    : variant === 'light' ? 'future-light' : 'future-dark';
}

// ============================================================================
// Shared helpers
// ============================================================================

/** Page chrome uses shadcn bridge tokens (bg-background, text-foreground, etc.)
 *  so they resolve correctly under both .future-* and .legacy-* theme classes. */

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
    <div className="flex flex-col gap-4 rounded-xl border border-future-border-subtle bg-future-surface-raised p-6">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-future-accent" />
        <span className="text-xs font-semibold uppercase tracking-widest text-future-foreground-muted">
          {theme}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-future-foreground">Card title</h3>
        <p className="text-sm text-future-foreground-muted">
          Body text uses the muted foreground token for secondary information and descriptions.
        </p>
      </div>

      <Input placeholder="Search…" className="bg-future-surface-overlay" />

      <div className="flex items-center gap-3">
        <Button size="sm" className="bg-future-accent text-future-foreground-on-accent hover:bg-future-accent/90">
          Primary
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-future-border bg-future-surface text-future-foreground hover:bg-future-surface-hover"
        >
          Secondary
        </Button>
        <Button variant="ghost" size="sm" className="text-future-foreground hover:bg-future-surface-hover">
          Ghost
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        {[
          { bg: 'bg-future-surface', label: 'surface' },
          { bg: 'bg-future-surface-raised', label: 'raised' },
          { bg: 'bg-future-surface-overlay', label: 'overlay' },
          { bg: 'bg-future-surface-hover', label: 'hover' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div className={cn('h-8 w-8 rounded-md border border-future-border', s.bg)} />
            <span className="text-[10px] text-future-foreground-subtle">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Legacy preview card
// ============================================================================

function LegacyPreviewCard({ theme }: { theme: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-legacy-border-subtle bg-legacy-surface-raised p-6">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-legacy-accent" />
        <span className="text-xs font-semibold uppercase tracking-widest text-legacy-foreground-muted">
          {theme}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-legacy-foreground">Card title</h3>
        <p className="text-sm text-legacy-foreground-muted">
          Body text uses the muted foreground token for secondary information and descriptions.
        </p>
      </div>

      <Input placeholder="Search…" className="border-legacy-border-subtle bg-legacy-surface-overlay text-legacy-foreground placeholder:text-legacy-foreground-subtle" />

      <div className="flex items-center gap-3">
        <Button size="sm" className="bg-legacy-accent text-legacy-foreground-on-accent hover:bg-legacy-accent-hover">
          Primary
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-legacy-border-subtle bg-legacy-surface text-legacy-foreground hover:bg-legacy-surface-hover"
        >
          Secondary
        </Button>
        <Button variant="ghost" size="sm" className="text-legacy-foreground hover:bg-legacy-surface-hover">
          Ghost
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        {[
          { bg: 'bg-legacy-surface', label: 'surface' },
          { bg: 'bg-legacy-surface-raised', label: 'raised' },
          { bg: 'bg-legacy-surface-overlay', label: 'overlay' },
          { bg: 'bg-legacy-surface-hover', label: 'hover' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div className={cn('h-8 w-8 rounded-md border border-legacy-border', s.bg)} />
            <span className="text-[10px] text-legacy-foreground-subtle">{s.label}</span>
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
      { name: 'future-surface', usage: 'Page / canvas background', dark: '#09090b', light: '#ffffff' },
      { name: 'future-surface-raised', usage: 'Cards, panels, overlays', dark: '#18181b', light: '#fafafa' },
      { name: 'future-surface-overlay', usage: 'Inputs, tabs, icon rail', dark: '#27272a', light: '#f4f4f5' },
      { name: 'future-surface-hover', usage: 'Hover, selected nav', dark: '#3f3f46', light: '#e4e4e7' },
    ],
  },
  {
    group: 'Foreground',
    tokens: [
      { name: 'future-foreground', usage: 'Primary headings', dark: '#fafafa', light: '#09090b' },
      { name: 'future-foreground-muted', usage: 'Nav, secondary UI', dark: '#a1a1aa', light: '#71717a' },
      { name: 'future-foreground-subtle', usage: 'Labels, placeholders', dark: '#71717a', light: '#a1a1aa' },
    ],
  },
  {
    group: 'Accent',
    tokens: [
      { name: 'future-accent', usage: 'Logo, primary action', dark: '#06b6d4', light: '#06b6d4' },
      { name: 'future-accent-subtle', usage: 'Active nav, status badges', dark: '#083344', light: '#ecfeff' },
    ],
  },
  {
    group: 'Border',
    tokens: [
      { name: 'future-border', usage: 'Primary borders', dark: '#3f3f46', light: '#d4d4d8' },
      { name: 'future-border-subtle', usage: 'Subtle dividers', dark: '#27272a', light: '#e4e4e7' },
    ],
  },
];

const legacyTokenGroups = [
  {
    group: 'Surface',
    tokens: [
      { name: 'legacy-surface', usage: 'Page / canvas background', dark: '#182027', light: '#ffffff' },
      { name: 'legacy-surface-raised', usage: 'Cards, panels', dark: '#273139', light: '#ffffff' },
      { name: 'legacy-surface-overlay', usage: 'Secondary bg, inputs', dark: '#374652', light: '#f4f5f7' },
      { name: 'legacy-surface-hover', usage: 'Hover states', dark: '#526069', light: '#e9f1fa' },
    ],
  },
  {
    group: 'Foreground',
    tokens: [
      { name: 'legacy-foreground', usage: 'Primary text', dark: '#f4f5f7', light: '#273139' },
      { name: 'legacy-foreground-muted', usage: 'De-emphasized text', dark: '#cfd8dd', light: '#526069' },
      { name: 'legacy-foreground-subtle', usage: 'Labels, disabled', dark: '#a4b1b8', light: '#8a97a0' },
    ],
  },
  {
    group: 'Accent',
    tokens: [
      { name: 'legacy-accent', usage: 'Primary blue', dark: '#66adff', light: '#0067df' },
      { name: 'legacy-accent-hover', usage: 'Primary hover', dark: '#87bfff', light: '#0056ba' },
    ],
  },
  {
    group: 'Border',
    tokens: [
      { name: 'legacy-border', usage: 'Primary borders', dark: '#8a97a0', light: '#a4b1b8' },
      { name: 'legacy-border-subtle', usage: 'Subtle dividers', dark: '#526069', light: '#cfd8dd' },
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
                      <code className="text-xs text-muted-foreground" style={{ fontFamily: fontFamily.monospace }}>
                        {token.dark}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: token.light }} />
                      <code className="text-xs text-muted-foreground" style={{ fontFamily: fontFamily.monospace }}>
                        {token.light}
                      </code>
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
        <div className="future-dark rounded-xl bg-future-surface p-4">
          <FuturePreviewCard theme="Dark" />
        </div>
        <div className="future-light rounded-xl bg-future-surface p-4">
          <FuturePreviewCard theme="Light" />
        </div>
      </div>

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
  <div class="bg-future-surface text-future-foreground">
    Dark themed content
  </div>
</div>

<div class="future-light">
  <div class="bg-future-surface text-future-foreground">
    Light themed content
  </div>
</div>`}</CodeBlock>

        <CodeBlock>{`<!-- Or use a template component that handles it for you -->
<MaestroTemplate theme="dark">
  {/* children automatically inherit dark theme tokens */}
</MaestroTemplate>`}</CodeBlock>
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

      {/* ── Shadcn bridge ──────────────────────────────────────────────── */}
      <SectionTitle>Shadcn component compatibility</SectionTitle>
      <SectionDescription>
        The Future theme includes a built-in bridge that maps standard shadcn CSS
        variables to their Future token equivalents. This means shadcn/ui
        components like Button, Input, DataTable, and DropdownMenu work
        automatically inside any themed container — no extra configuration needed.
      </SectionDescription>

      <CodeBlock>{`/* future-theme.css — shadcn bridge (excerpt) */

.future-dark {
  --color-background:   var(--color-future-surface);
  --color-foreground:   var(--color-future-foreground);
  --color-primary:      var(--color-future-accent);
  --color-muted:        var(--color-future-surface-overlay);
  --color-border:       var(--color-future-border);
  --color-input:        var(--color-future-border);
  --color-ring:         var(--color-future-ring);
  /* … full mapping in future-theme.css */
}`}</CodeBlock>
    </>
  );
}

// ============================================================================
// Tab content — Legacy
// ============================================================================

function LegacyTabContent() {
  return (
    <>
      {/* ── Side-by-side preview ───────────────────────────────────────── */}
      <SectionTitle>Theme preview</SectionTitle>
      <SectionDescription>
        The same component rendered in both Legacy themes. The Legacy design
        language uses the apollo-core token set from UiPath&apos;s original
        design system.
      </SectionDescription>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="legacy-dark rounded-xl bg-legacy-surface p-4">
          <LegacyPreviewCard theme="Dark" />
        </div>
        <div className="legacy-light rounded-xl bg-legacy-surface p-4">
          <LegacyPreviewCard theme="Light" />
        </div>
      </div>

      <Divider />

      {/* ── How to use ─────────────────────────────────────────────────── */}
      <SectionTitle>How to use</SectionTitle>
      <SectionDescription>
        Apply <InlineCode>.legacy-dark</InlineCode> or <InlineCode>.legacy-light</InlineCode> to
        any container. The Legacy theme maps apollo-core token values into scoped
        CSS classes that work at any DOM level — just like the Future theme.
      </SectionDescription>

      <div className="flex flex-col gap-4">
        <CodeBlock>{`<!-- Wrap any container with the theme class -->
<div class="legacy-dark">
  <div class="bg-legacy-surface text-legacy-foreground">
    Dark themed content
  </div>
</div>

<div class="legacy-light">
  <div class="bg-legacy-surface text-legacy-foreground">
    Light themed content
  </div>
</div>`}</CodeBlock>

        <CodeBlock>{`/* Legacy tokens use the "legacy-" prefix */
/* bg-legacy-surface, text-legacy-foreground, border-legacy-border, etc. */

/* The shadcn bridge is also included, so shadcn components
   inherit the correct Legacy colors automatically. */`}</CodeBlock>
      </div>

      <Divider />

      {/* ── Token overview ─────────────────────────────────────────────── */}
      <SectionTitle>Token overview</SectionTitle>
      <SectionDescription>
        Key semantic tokens from the Legacy (apollo-core) design system and their
        resolved values per theme.
      </SectionDescription>

      <TokenTable groups={legacyTokenGroups} />

      <Divider />

      {/* ── Shadcn bridge ──────────────────────────────────────────────── */}
      <SectionTitle>Shadcn component compatibility</SectionTitle>
      <SectionDescription>
        Like the Future theme, the Legacy theme includes a shadcn bridge so standard
        components work automatically. The Legacy bridge maps apollo-core variables
        to shadcn expected names.
      </SectionDescription>

      <CodeBlock>{`/* legacy-theme.css — shadcn bridge (excerpt) */

.legacy-dark {
  --color-background:   var(--color-legacy-surface);
  --color-foreground:   var(--color-legacy-foreground);
  --color-primary:      var(--color-legacy-accent);
  --color-muted:        var(--color-legacy-surface-raised);
  --color-border:       var(--color-legacy-border-subtle);
  --color-input:        var(--color-legacy-border-subtle);
  --color-ring:         var(--color-legacy-ring);
  /* … full mapping in legacy-theme.css */
}`}</CodeBlock>
    </>
  );
}

// ============================================================================
// Story
// ============================================================================

const themeTabs = ['Future', 'Legacy'] as const;

function ThemePage({ globalTheme }: { globalTheme: string }) {
  const { family } = parseThemeGlobal(globalTheme);
  const [activeTab, setActiveTab] = React.useState<ThemeFamily>(family);

  // Sync tab when toolbar selection changes family
  React.useEffect(() => {
    setActiveTab(family);
  }, [family]);

  const activeThemeClass = themeClass(
    activeTab,
    parseThemeGlobal(globalTheme).variant,
  );

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
          new design direction) and <strong>Legacy</strong> (the original
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
          {activeTab === 'future' ? <FutureTabContent /> : <LegacyTabContent />}
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
  --color-future-surface:        #0f172a;
  --color-future-surface-raised: #1e293b;
  --color-future-foreground:     #f8fafc;
  --color-future-accent:         #8b5cf6;
  /* … define all token variables */

  /* shadcn bridge */
  --color-background: var(--color-future-surface);
  --color-foreground: var(--color-future-foreground);
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
