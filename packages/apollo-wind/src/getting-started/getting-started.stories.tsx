import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

const meta = {
  title: 'Introduction/Getting Started',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function resolveThemeClass(value: string) {
  if (value === 'legacy-dark') return 'legacy-dark';
  if (value === 'legacy-light') return 'legacy-light';
  if (value === 'wireframe') return 'future-wireframe';
  if (value === 'vertex') return 'future-vertex';
  if (value === 'canvas') return 'future-canvas';
  if (value === 'light') return 'future-light';
  return 'future-dark';
}

// ============================================================================
// Shared components
// ============================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">{children}</h2>;
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>;
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground">
      {children}
    </code>
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
            onClick={handleCopy}
            className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!label && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-foreground">
        <code style={{ fontFamily: fontFamily.monospace }}>{children}</code>
      </pre>
    </div>
  );
}

// ============================================================================
// Package card
// ============================================================================

const installTabs = ['Add to existing project', 'Run locally'] as const;
type InstallTab = (typeof installTabs)[number];

function PackageCard({
  name,
  packageName,
  description,
  bestFor,
  consumerInstall,
  localDevCommands,
}: {
  name: string;
  packageName: string;
  description: string;
  bestFor: string;
  consumerInstall: string;
  localDevCommands: string;
}) {
  const [activeTab, setActiveTab] = React.useState<InstallTab>('Add to existing project');

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-1 flex items-baseline gap-3">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <InlineCode>{packageName}</InlineCode>
      </div>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">{description}</p>

      <p className="mb-5 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">Best for: </span>
        {bestFor}
      </p>

      {/* Install path tabs */}
      <div className="mb-4 inline-flex rounded-lg border border-border bg-muted/50 p-1">
        {installTabs.map((tab) => (
          <button
            key={tab}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Add to existing project' && (
        <div>
          <CodeBlock>{consumerInstall}</CodeBlock>
        </div>
      )}

      {activeTab === 'Run locally' && (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            After cloning the{' '}
            <a
              href="https://github.com/UiPath/apollo-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline"
            >
              apollo-ui
            </a>
            {' '}monorepo and running <InlineCode>pnpm install</InlineCode>:
          </p>
          <CodeBlock>{localDevCommands}</CodeBlock>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

function GettingStartedPage({ globalTheme }: { globalTheme: string }) {
  return (
    <div
      className={cn(
        resolveThemeClass(globalTheme),
        'min-h-screen w-full bg-background text-foreground'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-3xl space-y-2 p-8">
        {/* Header */}
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground">
          UiPath Design System
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Apollo v.4 is UiPath's open-source design system for building consistent user experiences
          across all UiPath products.
        </p>

        <div className="pt-2">
          <a
            href="https://github.com/UiPath/apollo-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline"
          >
            github.com/UiPath/apollo-ui
          </a>
        </div>

        <Divider />

        {/* Packages overview */}
        <div>
          <SectionTitle>Choose your package</SectionTitle>
          <SectionDescription>
            Apollo is split into focused packages. Pick the one that matches what you're building.
          </SectionDescription>
        </div>

        <div className="space-y-6">
          {/* Apollo Wind */}
          <PackageCard
            name="Apollo Wind"
            packageName="@uipath/apollo-wind"
            description="The modern UI component library for rapid prototyping and new product interfaces. Built with Tailwind CSS and shadcn/ui — includes 60+ components, page templates, and full theming support."
            bestFor="Prototyping, new product UIs, and any project using Tailwind CSS."
            consumerInstall="npm install @uipath/apollo-wind"
            localDevCommands={`pnpm build
pnpm storybook:wind`}
          />

          {/* Apollo React */}
          <PackageCard
            name="Apollo React"
            packageName="@uipath/apollo-react"
            description="The component library for UiPath workflows and automation products. Built on Material UI with Apollo theming — provides the components and patterns used across workflow-based experiences."
            bestFor="Workflow interfaces, automation products, and existing Material UI projects."
            consumerInstall="npm install @uipath/apollo-react"
            localDevCommands={`pnpm build
pnpm storybook:all`}
          />

          {/* Apollo Core */}
          <PackageCard
            name="Apollo Core"
            packageName="@uipath/apollo-core"
            description="The shared foundation — design tokens, icons, fonts, and CSS variables. Both Apollo Wind and Apollo React depend on this package. Install it directly only if you need tokens without a component library."
            bestFor="Custom builds that need design tokens, icons, or fonts without a full component library."
            consumerInstall="npm install @uipath/apollo-core"
            localDevCommands="pnpm build"
          />
        </div>

        <Divider />

        {/* Monorepo development */}
        <div>
          <SectionTitle>Contributing to Apollo</SectionTitle>
          <SectionDescription>
            If you're contributing to the design system itself, clone the monorepo and run locally.
          </SectionDescription>
        </div>

        <CodeBlock label="Setup">
          {`# Install pnpm if you haven't already
npm install -g pnpm

# Clone the repository
git clone https://github.com/UiPath/apollo-ui.git
cd apollo-ui

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the Apollo Wind Storybook
pnpm storybook:wind`}
        </CodeBlock>

        <div className="mt-6" />

        <CodeBlock label="Development">
          {`# Run all packages in development mode
pnpm dev

# Run Storybook
pnpm storybook

# Lint all packages
pnpm lint

# Run tests
pnpm test`}
        </CodeBlock>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (_, { globals }) => <GettingStartedPage globalTheme={globals.futureTheme || 'dark'} />,
};
