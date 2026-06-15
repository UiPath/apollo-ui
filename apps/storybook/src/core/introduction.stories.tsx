import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

const meta = {
  title: 'Introduction/Getting Started',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Primitives
// ============================================================================

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-medium text-foreground">
      {children}
    </code>
  );
}

function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/50">
      {label && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!label && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>;
}

function StepItem({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {step}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="mb-2 text-base font-semibold text-foreground">{title}</h4>
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Token category card
// ============================================================================

function TokenCard({
  title,
  description,
  storyPath,
  example,
}: {
  title: string;
  description: string;
  storyPath: string;
  example: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex h-10 items-center">{example}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <a
        href={`/?path=${storyPath}`}
        target="_parent"
        className="mt-auto inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted no-underline"
      >
        View tokens →
      </a>
    </div>
  );
}

// ============================================================================
// Tab: Overview
// ============================================================================

function OverviewTab() {
  return (
    <div className="space-y-6">
      <SectionDescription>
        Apollo Core is the framework-agnostic foundation of the Apollo design system. It provides
        design tokens, icons, fonts, and CSS custom properties consumed by both{' '}
        <InlineCode>apollo-wind</InlineCode> and <InlineCode>apollo-react</InlineCode>.
      </SectionDescription>

      <InfoCallout>
        <p className="mb-1 font-medium text-foreground">Most projects do not need this directly</p>
        <p>
          Install Apollo Core directly only if you need tokens, icons, or fonts without a component
          library. If you are starting a new React app, start with{' '}
          <InlineCode>apollo-wind</InlineCode> or <InlineCode>apollo-react</InlineCode> instead.
          Both already include core as a dependency.
        </p>
      </InfoCallout>

      <Divider />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">What's included</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Design Tokens',
              description:
                'Colors, spacing, typography, radius, shadows — the full Apollo token set as JS constants and CSS variables.',
              example: (
                <div className="flex gap-1.5">
                  {[
                    'bg-primary',
                    'bg-blue-500',
                    'bg-emerald-500',
                    'bg-amber-500',
                    'bg-rose-500',
                  ].map((c) => (
                    <div key={c} className={`h-6 w-6 rounded-full ${c}`} />
                  ))}
                </div>
              ),
            },
            {
              title: 'Icons',
              description:
                '1000+ SVG icons from the Apollo icon set, importable as React components or raw SVG.',
              example: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-6 w-6 text-foreground"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M3 4.5v4.25A2.25 2.25 0 0 0 5.25 11h4.5A2.25 2.25 0 0 0 12 8.75V4.5A2.25 2.25 0 0 0 9.75 2.25h-4.5A2.25 2.25 0 0 0 3 4.5Zm0 10.5v.75A2.25 2.25 0 0 0 5.25 18h4.5A2.25 2.25 0 0 0 12 15.75v-.75A2.25 2.25 0 0 0 9.75 12.75h-4.5A2.25 2.25 0 0 0 3 15Zm9-10.5v.75a2.25 2.25 0 0 0 2.25 2.25h.75"
                  />
                </svg>
              ),
            },
            {
              title: 'Fonts',
              description:
                'Inter and JetBrains Mono font face declarations, self-hosted and ready to import.',
              example: (
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold leading-none text-foreground">Aa</span>
                  <span className="text-xs text-muted-foreground">Inter / JetBrains Mono</span>
                </div>
              ),
            },
            {
              title: 'CSS Custom Properties',
              description:
                'All tokens as CSS variables, resolved by the active theme class on the root element.',
              example: (
                <code className="text-xs text-muted-foreground">
                  <span className="text-blue-400">--color-primary</span>
                  <span className="text-foreground">: oklch(...);</span>
                </code>
              ),
            },
          ].map(({ title, description, example }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-8 items-center">{example}</div>
              <h4 className="mb-1 text-sm font-semibold text-foreground">{title}</h4>
              <p className="text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Quick Start
// ============================================================================

const quickStartPaths = ['Add to existing project', 'Run locally'] as const;
type QuickStartPath = (typeof quickStartPaths)[number];

function QuickStartTab() {
  const [path, setPath] = React.useState<QuickStartPath>('Add to existing project');

  return (
    <div className="space-y-8">
      {/* Path switcher */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">What are you trying to do?</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Choose the path that matches your goal. The steps below will update accordingly.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {quickStartPaths.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPath(p)}
              className={cn(
                'flex-1 cursor-pointer rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                path === p
                  ? 'border-primary bg-primary/10 font-medium text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="block font-medium text-foreground">{p}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {p === 'Add to existing project'
                  ? 'Install Apollo Core as a dependency in your own app'
                  : 'Clone the apollo-ui repo and run Storybook locally'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {path === 'Add to existing project' && (
        <>
          <div className="space-y-6">
            <StepItem step={1} title="Install the package">
              <CodeBlock label="terminal">{'npm install @uipath/apollo-core'}</CodeBlock>
            </StepItem>

            <StepItem step={2} title="Import CSS variables">
              <CodeBlock label="global CSS or app entry">
                {`@import "@uipath/apollo-core/tokens/css/variables.css";
@import "@uipath/apollo-core/tokens/css/theme-variables.css";
@import "@uipath/apollo-core/fonts/font.css";`}
              </CodeBlock>
              <p>
                This loads all Apollo design tokens as CSS custom properties and registers the font
                faces.
              </p>
            </StepItem>

            <StepItem step={3} title="Apply a theme class">
              <CodeBlock label="HTML or root element">
                {`<!-- Light theme -->
<body class="light">

<!-- Dark theme -->
<body class="dark">`}
              </CodeBlock>
              <p>
                The theme class on <InlineCode>{'<body>'}</InlineCode> resolves all semantic token
                values. Switch class to change the active theme.
              </p>
            </StepItem>
          </div>

          <Divider />

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Using tokens in JavaScript
            </h3>
            <SectionDescription>
              Import typed token constants directly from the package for use in JS/TS code.
            </SectionDescription>
            <CodeBlock label="Token imports">{`import { ColorPrimary500, SpacingMd, FontSizeSm } from '@uipath/apollo-core';

// Use in inline styles or style objects
const style = {
  color: ColorPrimary500,
  padding: SpacingMd,
  fontSize: FontSizeSm,
};`}</CodeBlock>
          </div>

          <Divider />

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Using CSS custom properties
            </h3>
            <SectionDescription>
              All tokens are also available as CSS variables, resolved by the active theme class on{' '}
              <InlineCode>{'<body>'}</InlineCode>.
            </SectionDescription>
            <CodeBlock label="CSS usage">{`/* Apply theme class to body */
body.light { /* light token values */ }
body.dark  { /* dark token values  */ }

/* Then use vars anywhere in your CSS */
.my-component {
  background: var(--color-background);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}`}</CodeBlock>
          </div>
        </>
      )}

      {path === 'Run locally' && (
        <>
          <InfoCallout>
            <p className="mb-1 font-medium text-foreground">Before you begin</p>
            <p>
              This path is for contributors and team members who want to browse or modify Apollo
              Core source files and run Storybook on their machine.
            </p>
          </InfoCallout>

          <div className="space-y-6">
            <StepItem step={1} title="Clone the repository">
              <CodeBlock label="terminal">
                {'git clone https://github.com/UiPath/apollo-ui.git\ncd apollo-ui'}
              </CodeBlock>
            </StepItem>

            <StepItem step={2} title="Install dependencies">
              <CodeBlock label="terminal">{'npm install -g pnpm\npnpm install'}</CodeBlock>
              <p>
                This project uses <InlineCode>pnpm</InlineCode> workspaces. Install it globally if
                you don't have it yet.
              </p>
            </StepItem>

            <StepItem step={3} title="Build all packages">
              <CodeBlock label="terminal">{'pnpm build'}</CodeBlock>
              <p>Compiles apollo-core, apollo-wind, and apollo-react before Storybook starts.</p>
            </StepItem>

            <StepItem step={4} title="Start Storybook">
              <CodeBlock label="terminal">{'pnpm storybook:dev'}</CodeBlock>
              <p>
                Opens Apollo Storybook at <InlineCode>http://localhost:6007</InlineCode>. Changes to
                source files hot-reload automatically.
              </p>
            </StepItem>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Tab: Tokens
// ============================================================================

function TokensTab() {
  return (
    <div className="space-y-6">
      <SectionDescription>
        All token categories available in Apollo Core. Click any card to explore the full set with
        live values and copy-ready references.
      </SectionDescription>

      <div className="grid gap-4 sm:grid-cols-2">
        <TokenCard
          title="Colors"
          description="Semantic color tokens for text, backgrounds, borders, and brand palettes."
          storyPath="/story/apollo-core-theme-colors--page"
          example={
            <div className="flex gap-1.5">
              {['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map(
                (c) => (
                  <div key={c} className={`h-6 w-6 rounded-full ${c}`} />
                )
              )}
            </div>
          }
        />
        <TokenCard
          title="Typography"
          description="Font families, sizes, weights, and line heights for consistent type."
          storyPath="/story/apollo-core-theme-typography--page"
          example={
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold leading-none text-foreground">Aa</span>
              <span className="text-xs text-muted-foreground">Inter / JetBrains Mono</span>
            </div>
          }
        />
        <TokenCard
          title="Spacing"
          description="A consistent spacing scale from xs to 4xl used across all components."
          storyPath="/story/apollo-core-theme-spacing--page"
          example={
            <div className="flex items-end gap-1">
              {[2, 3, 4, 6, 8].map((s) => (
                <div
                  key={s}
                  className="rounded-sm bg-primary/40"
                  style={{ width: s * 4, height: s * 4 }}
                />
              ))}
            </div>
          }
        />
        <TokenCard
          title="Icons"
          description="SVG icon library with 1000+ icons from the Apollo icon set."
          storyPath="/story/apollo-core-theme-icons--page"
          example={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-6 w-6 text-foreground"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M3 4.5v4.25A2.25 2.25 0 0 0 5.25 11h4.5A2.25 2.25 0 0 0 12 8.75V4.5A2.25 2.25 0 0 0 9.75 2.25h-4.5A2.25 2.25 0 0 0 3 4.5Zm0 10.5v.75A2.25 2.25 0 0 0 5.25 18h4.5A2.25 2.25 0 0 0 12 15.75v-.75A2.25 2.25 0 0 0 9.75 12.75h-4.5A2.25 2.25 0 0 0 3 15Zm9-10.5v.75a2.25 2.25 0 0 0 2.25 2.25h.75"
              />
            </svg>
          }
        />
        <TokenCard
          title="Shadows"
          description="Elevation shadow tokens for cards, modals, and layered surfaces."
          storyPath="/story/apollo-core-theme-shadows--page"
          example={
            <div className="flex gap-3">
              {['shadow-sm', 'shadow-md', 'shadow-lg'].map((s) => (
                <div key={s} className={`h-6 w-6 rounded bg-card ${s}`} />
              ))}
            </div>
          }
        />
        <TokenCard
          title="Borders"
          description="Border radius and width tokens for consistent component shapes."
          storyPath="/story/apollo-core-theme-borders--page"
          example={
            <div className="flex gap-3">
              {['rounded-sm', 'rounded-md', 'rounded-xl', 'rounded-full'].map((r) => (
                <div key={r} className={`h-6 w-6 border border-border ${r}`} />
              ))}
            </div>
          }
        />
        <TokenCard
          title="CSS Variables"
          description="All tokens as CSS custom properties for use in any framework or plain CSS."
          storyPath="/story/apollo-core-theme-css-variables--page"
          example={
            <code className="text-xs text-muted-foreground">
              <span className="text-blue-400">--color-primary</span>
              <span className="text-foreground">: oklch(...);</span>
            </code>
          }
        />
        <TokenCard
          title="Screens"
          description="Responsive breakpoint tokens matching Tailwind's screen scale."
          storyPath="/story/apollo-core-theme-screens--page"
          example={
            <div className="flex items-end gap-1.5">
              {['xs', 'sm', 'md', 'lg'].map((s, i) => (
                <div
                  key={s}
                  className="rounded-sm bg-primary/30"
                  style={{ width: 18 + i * 8, height: 18 + i * 4 }}
                />
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

const tabs = ['Overview', 'Quick Start', 'Tokens'] as const;
type TabId = (typeof tabs)[number];

function CoreIntroductionPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('Overview');

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-3xl space-y-2 p-8">
        {/* Header */}
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground">Apollo Core</h1>
        <p className="text-base leading-7 text-muted-foreground">
          The framework-agnostic foundation of the Apollo design system. Design tokens, icons,
          fonts, and CSS custom properties.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-0 pt-6">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={cn(
                'cursor-pointer px-4 pb-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-6">
          {activeTab === 'Overview' && <OverviewTab />}
          {activeTab === 'Quick Start' && <QuickStartTab />}
          {activeTab === 'Tokens' && <TokensTab />}
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <CoreIntroductionPage />,
};
