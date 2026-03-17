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
  return value ?? 'future-dark';
}

// ============================================================================
// Shared components
// ============================================================================

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
        <code style={{ fontFamily: fontFamily.monospace }}>{children}</code>
      </pre>
    </div>
  );
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
            type="button"
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
            </a>{' '}
            monorepo and running <InlineCode>pnpm install</InlineCode>:
          </p>
          <CodeBlock>{localDevCommands}</CodeBlock>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CLI components
// ============================================================================

const cliComponents = [
  // Forms
  { category: 'Forms', name: 'button', description: 'Primary action trigger' },
  { category: 'Forms', name: 'button-group', description: 'Grouped action buttons' },
  { category: 'Forms', name: 'input', description: 'Text input field' },
  { category: 'Forms', name: 'textarea', description: 'Multi-line text input' },
  { category: 'Forms', name: 'select', description: 'Dropdown selector' },
  { category: 'Forms', name: 'combobox', description: 'Searchable dropdown' },
  { category: 'Forms', name: 'multi-select', description: 'Multi-value selector' },
  { category: 'Forms', name: 'checkbox', description: 'Boolean toggle' },
  { category: 'Forms', name: 'radio-group', description: 'Single-choice selector' },
  { category: 'Forms', name: 'switch', description: 'On/off toggle' },
  { category: 'Forms', name: 'slider', description: 'Range input' },
  { category: 'Forms', name: 'label', description: 'Form field label' },
  { category: 'Forms', name: 'search', description: 'Search input with clear action' },
  { category: 'Forms', name: 'file-upload', description: 'Drag-and-drop file input with per-file errors' },
  { category: 'Forms', name: 'stepper', description: 'Multi-step form progress' },
  // Date & Time
  { category: 'Date & Time', name: 'calendar', description: 'Month calendar picker' },
  { category: 'Date & Time', name: 'date-picker', description: 'Date input with popover' },
  { category: 'Date & Time', name: 'datetime-picker', description: 'Combined date and time picker' },
  // Layout
  { category: 'Layout', name: 'card', description: 'Content container with header and body' },
  { category: 'Layout', name: 'separator', description: 'Horizontal or vertical divider' },
  { category: 'Layout', name: 'resizable', description: 'Draggable split-pane layout' },
  { category: 'Layout', name: 'scroll-area', description: 'Custom scrollable container' },
  { category: 'Layout', name: 'aspect-ratio', description: 'Enforce element aspect ratio' },
  // Navigation
  { category: 'Navigation', name: 'tabs', description: 'Tabbed content switcher' },
  { category: 'Navigation', name: 'breadcrumb', description: 'Hierarchical location trail' },
  { category: 'Navigation', name: 'pagination', description: 'Page navigation controls' },
  { category: 'Navigation', name: 'accordion', description: 'Collapsible content sections' },
  { category: 'Navigation', name: 'tree-view', description: 'Hierarchical item tree' },
  // Overlays
  { category: 'Overlays', name: 'dialog', description: 'Modal overlay' },
  { category: 'Overlays', name: 'sheet', description: 'Slide-in side panel' },
  { category: 'Overlays', name: 'alert-dialog', description: 'Confirmation dialog' },
  { category: 'Overlays', name: 'popover', description: 'Anchored floating panel' },
  { category: 'Overlays', name: 'hover-card', description: 'Preview card on hover' },
  { category: 'Overlays', name: 'dropdown-menu', description: 'Contextual action menu' },
  { category: 'Overlays', name: 'context-menu', description: 'Right-click menu' },
  { category: 'Overlays', name: 'command', description: 'Command palette with search' },
  { category: 'Overlays', name: 'tooltip', description: 'Inline hover hint' },
  // Data Display
  { category: 'Data Display', name: 'data-table', description: 'Sortable, filterable table' },
  { category: 'Data Display', name: 'badge', description: 'Status and label pill' },
  { category: 'Data Display', name: 'alert', description: 'Inline status message' },
  { category: 'Data Display', name: 'stats-card', description: 'KPI metric card' },
  { category: 'Data Display', name: 'empty-state', description: 'Zero-state placeholder' },
  { category: 'Data Display', name: 'skeleton', description: 'Loading placeholder' },
  { category: 'Data Display', name: 'progress', description: 'Progress bar' },
  { category: 'Data Display', name: 'spinner', description: 'Loading indicator' },
  { category: 'Data Display', name: 'sonner', description: 'Toast notifications' },
  { category: 'Data Display', name: 'toggle', description: 'Single toggle button' },
  { category: 'Data Display', name: 'toggle-group', description: 'Segmented toggle controls' },
  // Custom Apollo
  { category: 'Custom Apollo', name: 'page-header', description: 'Page title and action bar' },
  { category: 'Custom Apollo', name: 'global-header', description: 'App-level top navigation' },
  { category: 'Custom Apollo', name: 'panel-studio', description: 'Studio-style side panel' },
  { category: 'Custom Apollo', name: 'panel-delegate', description: 'Delegate-style nav panel' },
  { category: 'Custom Apollo', name: 'panel-flow', description: 'Flow editor nav rail' },
  { category: 'Custom Apollo', name: 'panel-maestro', description: 'Maestro dashboard panel' },
  { category: 'Custom Apollo', name: 'toolbar-canvas', description: 'Canvas floating toolbar' },
  { category: 'Custom Apollo', name: 'toolbar-view', description: 'View mode toolbar' },
  { category: 'Custom Apollo', name: 'flow-node', description: 'Workflow canvas node' },
  { category: 'Custom Apollo', name: 'flow-properties', description: 'Node properties panel' },
  { category: 'Custom Apollo', name: 'grid-maestro', description: 'Maestro-style data grid' },
  { category: 'Custom Apollo', name: 'chat-composer', description: 'AI chat input with attachments' },
  { category: 'Custom Apollo', name: 'chat-steps-view', description: 'AI thinking steps display' },
  { category: 'Custom Apollo', name: 'chat-first-experience', description: 'Empty chat onboarding state' },
  { category: 'Custom Apollo', name: 'chat-prompt-suggestions', description: 'Suggested prompt chips' },
  { category: 'Custom Apollo', name: 'canvas', description: 'Pannable, zoomable canvas area' },
] as const;

function PrereqsTooltip() {
  const [open, setOpen] = React.useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex cursor-default items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Prerequisites
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="shrink-0 opacity-60"
          aria-hidden="true"
        >
          <circle cx="5" cy="5" r="4.5" stroke="currentColor" />
          <path d="M5 4.5v3M5 3h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-foreground">Before you begin</p>
          <ul className="space-y-1.5 text-xs leading-5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Node 18+</span> — required by the
              shadcn CLI
            </li>
            <li>
              <span className="font-medium text-foreground">Tailwind CSS v4</span> — uses{' '}
              <code className="rounded bg-muted px-1 py-px font-mono text-[10px]">
                @import "tailwindcss"
              </code>
              , not{' '}
              <code className="rounded bg-muted px-1 py-px font-mono text-[10px]">
                tailwind.config.js
              </code>
            </li>
            <li>
              <span className="font-medium text-foreground">React project</span> — Vite, Next.js,
              or any React setup
            </li>
          </ul>
        </div>
      )}
    </span>
  );
}

// ============================================================================
// Tab: Choose your package
// ============================================================================

function ChooseYourPackageTab() {
  return (
    <div className="space-y-6">
      <SectionDescription>
        Apollo is split into focused packages. Pick the one that matches what you're building.
      </SectionDescription>

      <PackageCard
        name="Apollo Wind"
        packageName="@uipath/apollo-wind"
        description="The modern UI component library for rapid prototyping and new product interfaces. Built with Tailwind CSS and shadcn/ui — includes 60+ components, page templates, and full theming support."
        bestFor="Prototyping, new product UIs, and any project using Tailwind CSS."
        consumerInstall="npm install @uipath/apollo-wind"
        localDevCommands={`pnpm build\npnpm storybook:wind`}
      />

      <PackageCard
        name="Apollo React"
        packageName="@uipath/apollo-react"
        description="The component library for UiPath workflows and automation products. Built on Material UI with Apollo theming — provides the components and patterns used across workflow-based experiences."
        bestFor="Workflow interfaces, automation products, and existing Material UI projects."
        consumerInstall="npm install @uipath/apollo-react"
        localDevCommands={`pnpm build\npnpm storybook:all`}
      />

      <PackageCard
        name="Apollo Core"
        packageName="@uipath/apollo-core"
        description="The shared foundation — design tokens, icons, fonts, and CSS variables. Both Apollo Wind and Apollo React depend on this package. Install it directly only if you need tokens without a component library."
        bestFor="Custom builds that need design tokens, icons, or fonts without a full component library."
        consumerInstall="npm install @uipath/apollo-core"
        localDevCommands="pnpm build"
      />
    </div>
  );
}

// ============================================================================
// Tab: CLI
// ============================================================================

function CLITab() {
  const [copiedComponent, setCopiedComponent] = React.useState<string | null>(null);

  const handleCopyComponent = (name: string) => {
    navigator.clipboard.writeText(
      `npx shadcn@latest add https://ui.uipath.com/r/${name}.json`
    );
    setCopiedComponent(name);
    setTimeout(() => setCopiedComponent(null), 2000);
  };

  const categories = [...new Set(cliComponents.map((c) => c.category))];

  return (
    <div className="space-y-8">
      {/* Why CLI */}
      <div>
        <InfoCallout>
          The Apollo registry is in development. Commands on this page reflect the target
          experience and will work once the registry is published.
        </InfoCallout>
        <div className="mt-6">
          <SectionDescription>
            Apollo's CLI follows the shadcn ownership model — components are copied directly into
            your project rather than installed as a locked package dependency. You own the code, can
            customize it freely, and updates are an explicit choice, not a forced upgrade.
          </SectionDescription>
        </div>
      </div>

      <Divider />

      {/* Quick Start */}
      <div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">Quick Start</h3>
        <p className="mb-6 flex flex-wrap items-center gap-2 text-base leading-7 text-muted-foreground">
          Three commands to get Apollo components and theming into your project.{' '}
          <PrereqsTooltip />
        </p>

        <div className="space-y-4">
          <StepItem step={1} title="Initialize shadcn">
            <CodeBlock>{`npx shadcn@latest init`}</CodeBlock>
            <p>
              Creates a <InlineCode>components.json</InlineCode> config in your project root.
            </p>
          </StepItem>

          <StepItem step={2} title="Add the Apollo theme preset">
            <CodeBlock>{`npx shadcn@latest add https://ui.uipath.com/r/theme.json`}</CodeBlock>
            <p>
              Installs the Apollo CSS theme file and adds the{' '}
              <InlineCode>future-dark</InlineCode> and <InlineCode>future-light</InlineCode> classes
              to your project.
            </p>
          </StepItem>

          <StepItem step={3} title="Add your first component">
            <CodeBlock>{`npx shadcn@latest add https://ui.uipath.com/r/button.json`}</CodeBlock>
            <p>
              Copies the component source into{' '}
              <InlineCode>src/components/ui/button.tsx</InlineCode>. It's yours to use, read, and
              modify.
            </p>
          </StepItem>
        </div>
      </div>

      <Divider />

      {/* Theming */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Activating the Theme</h3>
        <SectionDescription>
          After installing the theme preset, apply the theme class to your root element. All
          semantic tokens resolve automatically from there.
        </SectionDescription>

        <CodeBlock label="Apply theme to your app root">
          {`<div className="future-dark min-h-screen bg-background text-foreground">
  {/* your app */}
</div>`}
        </CodeBlock>

        <p className="mt-4 text-sm text-muted-foreground">
          Switch to light theme by replacing <InlineCode>future-dark</InlineCode> with{' '}
          <InlineCode>future-light</InlineCode>. No other changes needed — all tokens adapt
          automatically.
        </p>
      </div>

      <Divider />

      {/* Updating */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Updating Components</h3>
        <SectionDescription>
          Because components live in your project, updates are opt-in. Re-run the add command to
          pull the latest version and review the diff before committing.
        </SectionDescription>

        <CodeBlock>{`npx shadcn@latest add https://ui.uipath.com/r/button.json`}</CodeBlock>

        <p className="mt-3 text-sm text-muted-foreground">
          shadcn will show you what changed. Accept the update, keep your version, or merge
          selectively — the choice is yours.
        </p>
      </div>

      <Divider />

      {/* Available Components */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Available Components</h3>
        <SectionDescription>
          Click copy on any row to get the install command for that component.
        </SectionDescription>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Component
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Install
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <React.Fragment key={category}>
                  <tr className="border-b border-border bg-muted/30">
                    <td
                      colSpan={3}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {category}
                    </td>
                  </tr>
                  {cliComponents
                    .filter((c) => c.category === category)
                    .map(({ name, description }) => (
                      <tr
                        key={name}
                        className="border-b border-border last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <InlineCode>{name}</InlineCode>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{description}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopyComponent(name)}
                            className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {copiedComponent === name ? 'Copied!' : 'Copy'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Contributing to Apollo
// ============================================================================

function ContributingTab() {
  return (
    <div className="space-y-6">
      <SectionDescription>
        If you're contributing to the design system itself, clone the monorepo and run locally.
      </SectionDescription>

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
  );
}

// ============================================================================
// Page
// ============================================================================

const tabs = ['Choose your package', 'Contributing to Apollo', 'CLI'] as const;
type TabId = (typeof tabs)[number];

function GettingStartedPage({ globalTheme }: { globalTheme: string }) {
  const [activeTab, setActiveTab] = React.useState<TabId>('Choose your package');

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

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pt-6 pb-0">
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
          {activeTab === 'Choose your package' && <ChooseYourPackageTab />}
          {activeTab === 'Contributing to Apollo' && <ContributingTab />}
          {activeTab === 'CLI' && <CLITab />}
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (_, { globals }) => <GettingStartedPage globalTheme={globals.theme || 'future-dark'} />,
};
