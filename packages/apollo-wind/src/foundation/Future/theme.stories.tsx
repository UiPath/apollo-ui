import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib';
import { fontFamily } from './typography';

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

type ThemeFamily = 'future' | 'core' | 'demo';

const coreThemes = ['dark', 'light', 'dark-hc', 'light-hc'];
const demoThemes = ['wireframe', 'vertex', 'canvas'];

function parseThemeFamily(value: string): ThemeFamily {
  if (coreThemes.includes(value)) return 'core';
  if (demoThemes.includes(value)) return 'demo';
  return 'future';
}

function themeLabel(value: string): string {
  const labels: Record<string, string> = {
    'future-dark': 'Future Dark',
    'future-light': 'Future Light',
    dark: 'Dark',
    light: 'Light',
    'dark-hc': 'Dark High Contrast',
    'light-hc': 'Light High Contrast',
    wireframe: 'Wireframe',
    vertex: 'Vertex',
    canvas: 'Canvas',
  };
  return labels[value] ?? value;
}

/** Returns [primary, companion] theme class names for side-by-side preview. */
function themePair(value: string): [string, string] | [string] {
  const pairs: Record<string, [string, string]> = {
    'future-dark': ['future-dark', 'future-light'],
    'future-light': ['future-light', 'future-dark'],
    'dark': ['dark', 'light'],
    'light': ['light', 'dark'],
    'dark-hc': ['dark-hc', 'light-hc'],
    'light-hc': ['light-hc', 'dark-hc'],
  };
  return pairs[value] ?? [value];
}

// ============================================================================
// Shared helpers
// ============================================================================

/** Page chrome uses shadcn bridge tokens (bg-background, text-foreground, etc.)
 *  so they resolve correctly under all theme families. */

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
  return <code className="rounded bg-muted px-1.5 py-0.5 text-primary">{children}</code>;
}

// ============================================================================
// Unified preview card — inherits tokens from the active theme on <body>/<html>
// ============================================================================

function PreviewCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-brand" />
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
          {label}
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
// Iframe preview for core themes (requires body-level theme class)
// ============================================================================

function IframeThemePreview({ theme, label }: { theme: string; label: string }) {
  const [iframeRef, setIframeRef] = React.useState<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!iframeRef) return;

    const iframeDoc = iframeRef.contentDocument;
    if (!iframeDoc) return;

    // Set up the iframe document with body theme class
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body class="${theme}" style="margin: 0; padding: 0; min-height: 100%;">
          <div id="preview-mount"></div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Copy all stylesheets from parent document (includes Tailwind)
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    styles.forEach((style) => {
      const clone = style.cloneNode(true) as HTMLElement;
      iframeDoc.head.appendChild(clone);
    });

    // Set mount node for portal
    const mount = iframeDoc.getElementById('preview-mount');
    setMountNode(mount);
  }, [iframeRef, theme]);

  return (
    <>
      <iframe
        ref={setIframeRef}
        className="min-w-0 w-full rounded-xl border border-border"
        style={{ height: '480px', background: 'transparent' }}
        title={`${label} theme preview`}
      />
      {mountNode &&
        createPortal(
          <div className="h-full w-full bg-surface p-4">
            <PreviewCard label={label} />
          </div>,
          mountNode
        )}
    </>
  );
}

// ============================================================================
// Token tables
// ============================================================================

const futureTokenGroups = [
  {
    group: 'Surface',
    tokens: [
      {
        name: 'surface',
        usage: 'Page / canvas background',
        dark: '#09090b',
        darkTw: 'zinc-950',
        light: '#ffffff',
        lightTw: 'white',
      },
      {
        name: 'surface-raised',
        usage: 'Cards, panels, overlays',
        dark: '#18181b',
        darkTw: 'zinc-900',
        light: '#fafafa',
        lightTw: 'zinc-50',
      },
      {
        name: 'surface-overlay',
        usage: 'Inputs, tabs, icon rail',
        dark: '#27272a',
        darkTw: 'zinc-800',
        light: '#f4f4f5',
        lightTw: 'zinc-100',
      },
      {
        name: 'surface-hover',
        usage: 'Hover, selected nav',
        dark: '#3f3f46',
        darkTw: 'zinc-700',
        light: '#e4e4e7',
        lightTw: 'zinc-200',
      },
    ],
  },
  {
    group: 'Foreground',
    tokens: [
      {
        name: 'foreground',
        usage: 'Primary headings',
        dark: '#fafafa',
        darkTw: 'zinc-50',
        light: '#09090b',
        lightTw: 'zinc-950',
      },
      {
        name: 'foreground-muted',
        usage: 'Nav, secondary UI',
        dark: '#a1a1aa',
        darkTw: 'zinc-400',
        light: '#71717a',
        lightTw: 'zinc-500',
      },
      {
        name: 'foreground-subtle',
        usage: 'Labels, placeholders',
        dark: '#71717a',
        darkTw: 'zinc-500',
        light: '#a1a1aa',
        lightTw: 'zinc-400',
      },
    ],
  },
  {
    group: 'Brand',
    tokens: [
      {
        name: 'brand',
        usage: 'Logo, primary buttons, active indicators',
        dark: '#0891b2',
        darkTw: 'cyan-600',
        light: '#0891b2',
        lightTw: 'cyan-600',
      },
      {
        name: 'brand-subtle',
        usage: 'Selected state bg, active nav, status badges',
        dark: '#083344',
        darkTw: 'cyan-950',
        light: '#ecfeff',
        lightTw: 'cyan-50',
      },
    ],
  },
  {
    group: 'Border',
    tokens: [
      {
        name: 'border',
        usage: 'Primary borders',
        dark: '#3f3f46',
        darkTw: 'zinc-700',
        light: '#d4d4d8',
        lightTw: 'zinc-300',
      },
      {
        name: 'border-subtle',
        usage: 'Subtle dividers',
        dark: '#27272a',
        darkTw: 'zinc-800',
        light: '#e4e4e7',
        lightTw: 'zinc-200',
      },
    ],
  },
];

const coreTokenGroups = [
  {
    group: 'Surface',
    tokens: [
      {
        name: 'surface',
        usage: 'Page / canvas background',
        dark: '#182027',
        light: '#ffffff',
        lightTw: 'white',
      },
      {
        name: 'surface-raised',
        usage: 'Cards, panels',
        dark: '#273139',
        light: '#ffffff',
        lightTw: 'white',
      },
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

function TokenTable({
  groups,
}: {
  groups: {
    group: string;
    tokens: {
      name: string;
      usage: string;
      dark: string;
      darkTw?: string;
      light: string;
      lightTw?: string;
    }[];
  }[];
}) {
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
                    <code
                      className="text-xs text-primary"
                      style={{ fontFamily: fontFamily.monospace }}
                    >
                      {token.name}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{token.usage}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="h-5 w-5 rounded border border-border"
                        style={{ backgroundColor: token.dark }}
                      />
                      <div className="flex flex-col">
                        <code
                          className="text-xs text-muted-foreground"
                          style={{ fontFamily: fontFamily.monospace }}
                        >
                          {token.dark}
                        </code>
                        {'darkTw' in token && (token as { darkTw?: string }).darkTw && (
                          <code
                            className="text-[10px] text-primary/70"
                            style={{ fontFamily: fontFamily.monospace }}
                          >
                            {(token as { darkTw: string }).darkTw}
                          </code>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="h-5 w-5 rounded border border-border"
                        style={{ backgroundColor: token.light }}
                      />
                      <div className="flex flex-col">
                        <code
                          className="text-xs text-muted-foreground"
                          style={{ fontFamily: fontFamily.monospace }}
                        >
                          {token.light}
                        </code>
                        {'lightTw' in token && (token as { lightTw?: string }).lightTw && (
                          <code
                            className="text-[10px] text-primary/70"
                            style={{ fontFamily: fontFamily.monospace }}
                          >
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
// Unified theme page — responds to the global Storybook theme switcher
// ============================================================================

function ThemePage({ globalTheme }: { globalTheme: string }) {
  const family = parseThemeFamily(globalTheme);
  const label = themeLabel(globalTheme);
  const tokenGroups = family === 'core' ? coreTokenGroups : futureTokenGroups;

  return (
    <div
      className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-4xl space-y-2 p-8">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SectionTitle>Theme</SectionTitle>
        <SectionDescription>
          Apollo ships with multiple theme families — <strong>Core</strong> (the original
          apollo-core tokens), <strong>Future</strong> (the new design direction), and{' '}
          <strong>Demo</strong> themes (Wireframe, Vertex, Canvas). Use the theme selector in the
          toolbar above to switch between them. Everything on this page updates live.
        </SectionDescription>

        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
          Active theme: <strong className="text-foreground">{label}</strong>
          <span className="text-xs opacity-60">({family})</span>
        </div>

        <Divider />

        {/* ── Live preview ───────────────────────────────────────────── */}
        <SectionTitle>Theme preview</SectionTitle>
        {(() => {
          const pair = themePair(globalTheme);
          const hasPair = pair.length === 2;
          const isDemoTheme = demoThemes.includes(globalTheme);
          const isCoreTheme = coreThemes.includes(globalTheme);

          return (
            <>
              <SectionDescription>
                {hasPair && isCoreTheme
                  ? 'Core themes require body-level class application. The previews below are rendered in iframes to demonstrate both variants side-by-side.'
                  : hasPair
                    ? 'The same component rendered in both light and dark variants. All tokens resolve automatically via element-level CSS classes.'
                    : 'Demo themes are scoped at the element level. Use the toolbar to switch between theme variants.'}
              </SectionDescription>

              <div
                className={cn(
                  'grid w-full grid-cols-1 gap-6',
                  hasPair && 'md:grid-cols-2',
                  !hasPair && isDemoTheme && 'md:w-1/2'
                )}
              >
                {isCoreTheme ? (
                  <>
                    <IframeThemePreview theme={pair[0]} label={themeLabel(pair[0])} />
                    {pair[1] && <IframeThemePreview theme={pair[1]} label={themeLabel(pair[1])} />}
                  </>
                ) : (
                  <>
                    <div
                      className={cn(
                        pair[0],
                        'min-w-0 rounded-xl border border-border bg-surface p-4'
                      )}
                    >
                      <PreviewCard label={themeLabel(pair[0])} />
                    </div>
                    {pair[1] && (
                      <div
                        className={cn(
                          pair[1],
                          'min-w-0 rounded-xl border border-border bg-surface p-4'
                        )}
                      >
                        <PreviewCard label={themeLabel(pair[1])} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          );
        })()}

        <Divider />

        {/* ── Token overview ─────────────────────────────────────────── */}
        <SectionTitle>Token overview</SectionTitle>
        <SectionDescription>
          Key semantic tokens and their resolved values for the{' '}
          <strong>{family === 'core' ? 'Core' : family === 'demo' ? 'Demo' : 'Future'}</strong>{' '}
          theme family. See the Colors page for the full token reference.
        </SectionDescription>

        <TokenTable groups={tokenGroups} />

        <Divider />

        {/* ── How to use ─────────────────────────────────────────────── */}
        <SectionTitle>How to use</SectionTitle>
        {family === 'core' ? (
          <>
            <SectionDescription>
              Apollo Core themes are activated by adding <InlineCode>light</InlineCode>,{' '}
              <InlineCode>dark</InlineCode>, <InlineCode>light-hc</InlineCode>, or{' '}
              <InlineCode>dark-hc</InlineCode> as a class on <InlineCode>&lt;body&gt;</InlineCode>.
              The bridge layer in <InlineCode>tailwind.consumer.css</InlineCode> maps apollo-core
              tokens to bare variable names so components using <InlineCode>bg-surface</InlineCode>,{' '}
              <InlineCode>text-foreground</InlineCode>, etc. resolve correctly.
            </SectionDescription>

            <CodeBlock>{`<!-- Apply theme class to <body> -->
<body class="dark">
  <div class="bg-surface text-foreground">
    Dark themed content
  </div>
</body>`}</CodeBlock>
          </>
        ) : (
          <>
            <SectionDescription>
              Apply the theme class to any container. Everything inside inherits the correct token
              values. Templates like <InlineCode>MaestroTemplate</InlineCode> handle this
              automatically via their <InlineCode>theme</InlineCode> prop.
            </SectionDescription>

            <div className="flex flex-col gap-4">
              <CodeBlock>{`<!-- Wrap any container with the theme class -->
<div class="${globalTheme}">
  <div class="bg-surface text-foreground">
    Themed content
  </div>
</div>`}</CodeBlock>

              <CodeBlock>{`<!-- Or use a template component -->
<MaestroTemplate theme="${globalTheme}">
  {/* children automatically inherit theme tokens */}
</MaestroTemplate>`}</CodeBlock>
            </div>
          </>
        )}

        <Divider />

        {/* ── Shadcn bridge ──────────────────────────────────────────── */}
        <SectionTitle>Shadcn component compatibility</SectionTitle>
        <SectionDescription>
          Every theme includes a built-in bridge that maps standard shadcn CSS variables to their
          semantic token equivalents. Components like Button, Input, DataTable, and DropdownMenu
          work automatically inside any themed container — no extra configuration needed.
        </SectionDescription>

        {family === 'core' ? (
          <CodeBlock>{`/* tailwind.consumer.css — Core bridge (excerpt) */

body.dark {
  --color-card:     var(--color-background-raised);
  --color-muted:    var(--color-background-secondary);
  --color-ring:     var(--color-focus-indicator);

  /* bare var bridge */
  --surface:        var(--color-background);
  --brand:          var(--color-primary);
  --foreground:     var(--color-foreground);
  /* … full mapping in tailwind.consumer.css */
}`}</CodeBlock>
        ) : (
          <CodeBlock>{`/* tailwind.consumer.css — shadcn aliases (excerpt) */

.${globalTheme} {
  --background:   var(--surface);
  --card:         var(--surface-raised);
  --primary:      var(--brand);
  --muted:        var(--surface-overlay);
  --input:        var(--border);
  --ring:         var(--ring);
  /* … full mapping in tailwind.consumer.css */
}`}</CodeBlock>
        )}

        <Divider />

        {/* ── Adding new themes ──────────────────────────────────────── */}
        <SectionTitle>Adding new themes</SectionTitle>
        <SectionDescription>
          To create a new theme, define a CSS class that sets the same set of CSS custom properties.
          All components using semantic tokens will automatically adapt to the new palette.
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
  render: (_, { globals }) => <ThemePage globalTheme={globals.theme || 'future-dark'} />,
};
